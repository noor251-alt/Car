// backend/services/scheduledNotifications.js
const cron = require('node-cron');
const db = require('../config/database');
const logger = require('../utils/logger');

class ScheduledNotificationsService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the scheduled notifications service
   * Runs every minute to check for pending notifications
   */
  start() {
    if (this.isRunning) {
      logger.warn('Le service de notifications programmées est déjà en cours d\'exécution');
      return;
    }

    // Run every minute
    cron.schedule('* * * * *', async () => {
      await this.processScheduledNotifications();
    });

    this.isRunning = true;
    logger.info('Service de notifications programmées démarré');
  }

  /**
   * Process pending scheduled notifications
   */
  async processScheduledNotifications() {
    try {
      // Get pending jobs that are due
      const [jobs] = await db.query(
        `SELECT * FROM scheduled_jobs
        WHERE status = 'pending'
        AND scheduled_at <= NOW()
        AND attempts < max_attempts
        ORDER BY scheduled_at ASC
        LIMIT 10`
      );

      for (const job of jobs) {
        await this.processJob(job);
      }
    } catch (error) {
      console.error('Process scheduled notifications error:', error);
    }
  }

  /**
   * Process individual job
   */
  async processJob(job) {
    try {
      // Update job status to processing
      await db.query(
        'UPDATE scheduled_jobs SET status = ?, attempts = attempts + 1 WHERE id = ?',
        ['processing', job.id]
      );

      const data = JSON.parse(job.data);

      if (job.type === 'bulk_notification') {
        await this.processBulkNotification(data);
      }

      // Mark job as completed
      await db.query(
        'UPDATE scheduled_jobs SET status = ?, processed_at = NOW() WHERE id = ?',
        ['completed', job.id]
      );
    } catch (error) {
      console.error(`Process job ${job.id} error:`, error);

      // Update job with error
      await db.query(
        `UPDATE scheduled_jobs 
        SET status = ?, error_message = ?
        WHERE id = ?`,
        [job.attempts >= job.max_attempts ? 'failed' : 'pending', error.message, job.id]
      );
    }
  }

  /**
   * Process bulk notification
   */
  async processBulkNotification(data) {
    const { bulk_notification_id, recipient_ids } = data;

    // Get bulk notification details
    const [notifications] = await db.query(
      'SELECT * FROM bulk_notifications WHERE id = ?',
      [bulk_notification_id]
    );

    if (notifications.length === 0) {
      throw new Error('Bulk notification not found');
    }

    const notification = notifications[0];

    // Send notifications
    const { sendBulkNotifications } = require('../routes/admin');
    await sendBulkNotifications(bulk_notification_id, recipient_ids, {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      action_url: notification.action_url,
      image_url: notification.image_url,
      send_push: notification.send_push,
      send_email: notification.send_email,
      send_sms: notification.send_sms,
    });
  }
}

module.exports = new ScheduledNotificationsService();