// backend/services/pushNotifications.js
const { Expo } = require('expo-server-sdk');
const db = require('../config/database');
const logger = require('../utils/logger');

const expo = new Expo();

/**
 * Send push notification to user
 */
async function sendPushNotification(userId, notification) {
  try {
    // Get user's push token
    const [users] = await db.query(
      'SELECT push_token FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0 || !users[0].push_token) {
      return;
    }

    const pushToken = users[0].push_token;

    // Check if token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error('Invalid push token:', pushToken);
      return;
    }

    // Check notification settings
    const [settings] = await db.query(
      'SELECT settings FROM notification_settings WHERE user_id = ?',
      [userId]
    );

    if (settings.length > 0) {
      const userSettings = JSON.parse(settings[0].settings);
      if (userSettings[notification.type] === false) {
        return; // User has disabled this notification type
      }
    }

    // Create the message
    const message = {
      to: pushToken,
      sound: 'default',
      title: notification.title,
      body: notification.message,
      data: notification.data || {},
      badge: await getUnreadCount(userId),
    };

    // Send the notification
    const ticket = await expo.sendPushNotificationsAsync([message]);
    logger.info('Notification push envoyée:', ticket);

    return ticket;
  } catch (error) {
    console.error('Send push notification error:', error);
  }
}

/**
 * Get unread notifications count
 */
async function getUnreadCount(userId) {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result[0].count;
  } catch (error) {
    return 0;
  }
}

/**
 * Create and send notification
 */
async function createNotification(userId, type, message, data = {}) {
  try {
    // Insert notification in database
    const [result] = await db.query(
      `INSERT INTO notifications (user_id, type, message, data)
      VALUES (?, ?, ?, ?)`,
      [userId, type, message, JSON.stringify(data)]
    );

    const notificationId = result.insertId;

    // Get full notification
    const [notification] = await db.query(
      'SELECT * FROM notifications WHERE id = ?',
      [notificationId]
    );

    // Send push notification
    await sendPushNotification(userId, {
      type: type,
      title: getNotificationTitle(type),
      message: message,
      data: data,
    });

    // Emit socket event
    const io = require('../socket').getIO();
    io.to(`user-${userId}`).emit('new-notification', notification[0]);

    return notification[0];
  } catch (error) {
    console.error('Create notification error:', error);
  }
}

/**
 * Get notification title based on type
 */
function getNotificationTitle(type) {
  const titles = {
    booking_confirmed: 'Réservation confirmée',
    booking_assigned: 'Agent assigné',
    agent_on_way: 'Agent en route',
    agent_arrived: 'Agent arrivé',
    service_started: 'Service démarré',
    service_completed: 'Service terminé',
    payment_completed: 'Paiement confirmé',
    booking_cancelled: 'Réservation annulée',
    new_message: 'Nouveau message',
    referral_reward: 'Récompense de parrainage',
    subscription_reminder: 'Rappel d\'abonnement',
    promotion: 'Promotion spéciale',
  };

  return titles[type] || 'CarCare';
}

module.exports = {
  sendPushNotification,
  createNotification,
};