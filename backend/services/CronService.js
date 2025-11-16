// backend/services/CronService.js
const cron = require('node-cron');
const { pool } = require('../config/database');
const NotificationService = require('./NotificationService');
const logger = require('../utils/logger');

class CronService {
  /**
   * Initialize all cron jobs
   */
  init() {
    // Send booking reminders every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      await this.sendBookingReminders();
    });

    // Check and expire subscriptions daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.expireSubscriptions();
    });

    // Process scheduled notifications every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.processScheduledNotifications();
    });

    // Update agent levels daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
      await this.updateAgentLevels();
    });

    // Update client tiers daily at 4 AM
    cron.schedule('0 4 * * *', async () => {
      await this.updateClientTiers();
    });

    logger.info('Cron jobs initialized');
  }

  /**
   * Send booking reminders
   */
  async sendBookingReminders() {
    try {
      const query = `
        SELECT b.*, 
          json_build_object(
            'user_id', u.id,
            'first_name', u.first_name,
            'fcm_token', u.fcm_token
          ) as client
        FROM bookings b
        JOIN client_profiles cp ON b.client_id = cp.id
        JOIN users u ON cp.user_id = u.id
        WHERE b.status IN ('pending', 'accepted')
          AND b.scheduled_date = CURRENT_DATE
          AND b.scheduled_time BETWEEN CURRENT_TIME AND CURRENT_TIME + INTERVAL '2 hours'
          AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.user_id = u.id 
            AND n.data->>'bookingId' = b.id::text 
            AND n.type = 'booking_reminder'
            AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '2 hours'
          )
      `;

      const result = await pool.query(query);

      for (const booking of result.rows) {
        await NotificationService.sendPushNotification(booking.client.user_id, {
          title: '⏰ Rappel de réservation',
          body: `Votre lavage est prévu dans moins de 2 heures`,
          data: {
            type: 'booking_reminder',
            bookingId: booking.id.toString()
          }
        });
      }

      if (result.rows.length > 0) {
        logger.info(`Sent ${result.rows.length} booking reminders`);
      }
    } catch (error) {
      logger.error('Send booking reminders error:', error);
    }
  }

  /**
   * Expire old subscriptions
   */
  async expireSubscriptions() {
    try {
      const query = `
        UPDATE subscriptions
        SET status = 'expired'
        WHERE status = 'active'
          AND end_date < CURRENT_DATE
        RETURNING id, client_id
      `;

      const result = await pool.query(query);

      for (const subscription of result.rows) {
        const clientQuery = 'SELECT user_id FROM client_profiles WHERE id = \$1';
        const clientResult = await pool.query(clientQuery, [subscription.client_id]);

        if (clientResult.rows[0]) {
          await NotificationService.sendPushNotification(clientResult.rows[0].user_id, {
            title: 'Abonnement expiré',
            body: 'Votre abonnement premium est arrivé à expiration. Renouvelez-le pour continuer à profiter des avantages !',
            data: { type: 'subscription_expired' }
          });
        }
      }

      if (result.rows.length > 0) {
        logger.info(`Expired ${result.rows.length} subscriptions`);
      }
    } catch (error) {
      logger.error('Expire subscriptions error:', error);
    }
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications() {
    try {
      const query = `
        SELECT * FROM scheduled_notifications
        WHERE scheduled_time <= CURRENT_TIMESTAMP
          AND sent = false
        LIMIT 100
      `;

      const result = await pool.query(query);

      for (const notification of result.rows) {
        try {
          await NotificationService.sendPushNotification(notification.user_id, {
            title: notification.title,
            body: notification.body,
            data: JSON.parse(notification.data)
          });

          await pool.query(
            'UPDATE scheduled_notifications SET sent = true WHERE id = \$1',
            [notification.id]
          );
        } catch (error) {
          logger.error(`Failed to send scheduled notification ${notification.id}:`, error);
        }
      }

      if (result.rows.length > 0) {
        logger.info(`Processed ${result.rows.length} scheduled notifications`);
      }
    } catch (error) {
      logger.error('Process scheduled notifications error:', error);
    }
  }

  /**
   * Update agent levels
   */
  async updateAgentLevels() {
    try {
      const query = `
        UPDATE agent_profiles
        SET level = CASE
          WHEN total_bookings >= 100 AND rating >= 4.5 AND total_reviews >= 50 THEN 'expert'
          WHEN total_bookings >= 50 AND rating >= 4.0 THEN 'advanced'
          WHEN total_bookings >= 20 AND rating >= 3.5 THEN 'intermediate'
          ELSE 'beginner'
        END
        WHERE level != CASE
          WHEN total_bookings >= 100 AND rating >= 4.5 AND total_reviews >= 50 THEN 'expert'
          WHEN total_bookings >= 50 AND rating >= 4.0 THEN 'advanced'
          WHEN total_bookings >= 20 AND rating >= 3.5 THEN 'intermediate'
          ELSE 'beginner'
        END
        RETURNING id, user_id, level
      `;

      const result = await pool.query(query);

      for (const agent of result.rows) {
        await NotificationService.notifyAgent(agent.id, {
          title: '🎉 Nouveau niveau !',
          body: `Félicitations ! Vous êtes maintenant au niveau ${agent.level}`,
          data: { type: 'level_up', level: agent.level }
        });
      }

      if (result.rows.length > 0) {
        logger.info(`Updated ${result.rows.length} agent levels`);
      }
    } catch (error) {
      logger.error('Update agent levels error:', error);
    }
  }

  /**
   * Update client tiers
   */
  async updateClientTiers() {
    try {
      const query = `
        UPDATE client_profiles
        SET tier = CASE
          WHEN total_bookings >= 50 THEN 'gold'
          WHEN total_bookings >= 20 THEN 'silver'
          ELSE 'bronze'
        END
        WHERE tier != CASE
          WHEN total_bookings >= 50 THEN 'gold'
          WHEN total_bookings >= 20 THEN 'silver'
          ELSE 'bronze'
        END
        RETURNING id, user_id, tier
      `;

      const result = await pool.query(query);

      for (const client of result.rows) {
        await NotificationService.notifyClient(client.id, {
          title: '✨ Nouveau palier !',
          body: `Félicitations ! Vous êtes maintenant au palier ${client.tier}`,
          data: { type: 'tier_upgrade', tier: client.tier }
        });
      }

      if (result.rows.length > 0) {
        logger.info(`Updated ${result.rows.length} client tiers`);
      }
    } catch (error) {
      logger.error('Update client tiers error:', error);
    }
  }
}

module.exports = new CronService();