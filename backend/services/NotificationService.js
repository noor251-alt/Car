// backend/services/NotificationService.js
const admin = require('firebase-admin');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '
'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    })
  });
}

class NotificationService {
  /**
   * Send push notification to user
   */
  async sendPushNotification(userId, notification) {
    try {
      // Get user FCM token
      const result = await pool.query(
        'SELECT fcm_token FROM users WHERE id = \$1',
        [userId]
      );

      if (!result.rows[0]?.fcm_token) {
        logger.warn(`No FCM token for user ${userId}`);
        return null;
      }

      const fcmToken = result.rows[0].fcm_token;

      // Prepare message
      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        token: fcmToken,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      // Send notification
      const response = await admin.messaging().send(message);

      // Save notification to database
      await this.saveNotification(userId, notification);

      logger.info(`Push notification sent to user ${userId}: ${response}`);

      return response;
    } catch (error) {
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        // Remove invalid token
        await pool.query(
          'UPDATE users SET fcm_token = NULL WHERE id = \$1',
          [userId]
        );
        logger.warn(`Removed invalid FCM token for user ${userId}`);
      } else {
        logger.error('Send push notification error:', error);
      }
      throw error;
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendMulticastNotification(userIds, notification) {
    try {
      // Get FCM tokens
      const result = await pool.query(
        'SELECT fcm_token FROM users WHERE id = ANY(\$1) AND fcm_token IS NOT NULL',
        [userIds]
      );

      const tokens = result.rows.map(row => row.fcm_token);

      if (tokens.length === 0) {
        logger.warn('No valid FCM tokens found');
        return null;
      }

      // Prepare message
      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        tokens: tokens
      };

      // Send notifications
      const response = await admin.messaging().sendMulticast(message);

      // Save notifications
      for (const userId of userIds) {
        await this.saveNotification(userId, notification);
      }

      logger.info(`Multicast notification sent: ${response.successCount} success, ${response.failureCount} failures`);

      return response;
    } catch (error) {
      logger.error('Send multicast notification error:', error);
      throw error;
    }
  }

  /**
   * Save notification to database
   */
  async saveNotification(userId, notification) {
    try {
      const query = `
        INSERT INTO notifications (user_id, title, body, type, data)
        VALUES (\$1, \$2, \$3, \$4, \$5)
        RETURNING *
      `;

      const values = [
        userId,
        notification.title,
        notification.body,
        notification.data?.type || 'general',
        JSON.stringify(notification.data || {})
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Save notification error:', error);
      throw error;
    }
  }

  /**
   * Notify client
   */
  async notifyClient(clientId, notification) {
    try {
      // Get user ID from client profile
      const result = await pool.query(
        'SELECT user_id FROM client_profiles WHERE id = \$1',
        [clientId]
      );

      if (!result.rows[0]) {
        throw new Error('Client not found');
      }

      return await this.sendPushNotification(result.rows[0].user_id, notification);
    } catch (error) {
      logger.error('Notify client error:', error);
      throw error;
    }
  }

  /**
   * Notify agent
   */
  async notifyAgent(agentId, notification) {
    try {
      // Get user ID from agent profile
      const result = await pool.query(
        'SELECT user_id FROM agent_profiles WHERE id = \$1',
        [agentId]
      );

      if (!result.rows[0]) {
        throw new Error('Agent not found');
      }

      return await this.sendPushNotification(result.rows[0].user_id, notification);
    } catch (error) {
      logger.error('Notify agent error:', error);
      throw error;
    }
  }

  /**
   * Notify nearby agents about new booking
   */
  async notifyNearbyAgents(booking, io) {
    try {
      const query = `
        SELECT ap.id, ap.user_id, ap.current_latitude, ap.current_longitude, u.fcm_token,
               (
                 6371 * acos(
                   cos(radians(\$1)) * cos(radians(ap.current_latitude)) *
                   cos(radians(ap.current_longitude) - radians(\$2)) +
                   sin(radians(\$1)) * sin(radians(ap.current_latitude))
                 )
               ) AS distance
        FROM agent_profiles ap
        JOIN users u ON ap.user_id = u.id
        WHERE ap.availability_status = true
          AND ap.verified = true
          AND u.status = 'active'
          AND ap.current_latitude IS NOT NULL
          AND ap.current_longitude IS NOT NULL
        HAVING distance < 10
        ORDER BY distance
        LIMIT 10
      `;

      const result = await pool.query(query, [
        booking.address.latitude,
        booking.address.longitude
      ]);

      const agentIds = result.rows.map(row => row.user_id);

      if (agentIds.length === 0) {
        logger.warn('No nearby agents found for booking');
        return;
      }

      // Send push notifications
      await this.sendMulticastNotification(agentIds, {
        title: '🚗 Nouvelle réservation disponible',
        body: `Lavage ${booking.wash_type} à ${booking.address.city} - ${booking.price} TND`,
        data: {
          type: 'new_booking',
          bookingId: booking.id.toString(),
          washType: booking.wash_type,
          price: booking.price.toString(),
          distance: result.rows[0].distance.toString()
        }
      });

      // Emit via socket
      result.rows.forEach(agent => {
        io.to(`agent-${agent.user_id}`).emit('new-booking-available', {
          booking,
          distance: agent.distance
        });
      });

      logger.info(`Notified ${agentIds.length} nearby agents about booking ${booking.id}`);
    } catch (error) {
      logger.error('Notify nearby agents error:', error);
      throw error;
    }
  }

  /**
   * Send topic notification
   */
  async sendTopicNotification(topic, notification) {
    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        topic: topic
      };

      const response = await admin.messaging().send(message);
      logger.info(`Topic notification sent to ${topic}: ${response}`);

      return response;
    } catch (error) {
      logger.error('Send topic notification error:', error);
      throw error;
    }
  }

  /**
   * Subscribe user to topic
   */
  async subscribeToTopic(fcmToken, topic) {
    try {
      const response = await admin.messaging().subscribeToTopic(fcmToken, topic);
      logger.info(`User subscribed to topic ${topic}`);
      return response;
    } catch (error) {
      logger.error('Subscribe to topic error:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe user from topic
   */
  async unsubscribeFromTopic(fcmToken, topic) {
    try {
      const response = await admin.messaging().unsubscribeFromTopic(fcmToken, topic);
      logger.info(`User unsubscribed from topic ${topic}`);
      return response;
    } catch (error) {
      logger.error('Unsubscribe from topic error:', error);
      throw error;
    }
  }

  /**
   * Send scheduled notification (for reminders)
   */
  async scheduleNotification(userId, notification, scheduledTime) {
    try {
      // Save to database with scheduled time
      const query = `
        INSERT INTO scheduled_notifications (user_id, title, body, type, data, scheduled_time)
        VALUES (\$1, \$2, \$3, \$4, \$5, \$6)
        RETURNING *
      `;

      const values = [
        userId,
        notification.title,
        notification.body,
        notification.data?.type || 'reminder',
        JSON.stringify(notification.data || {}),
        scheduledTime
      ];

      const result = await pool.query(query, values);
      logger.info(`Notification scheduled for user ${userId} at ${scheduledTime}`);

      return result.rows[0];
    } catch (error) {
      logger.error('Schedule notification error:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();