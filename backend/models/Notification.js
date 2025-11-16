// backend/models/Notification.js
const { pool } = require('../config/database');

class Notification {
  /**
   * Get user notifications
   */
  static async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE user_id = \$1';
    if (unreadOnly) {
      whereClause += ' AND is_read = false';
    }

    const query = `
      SELECT * FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT \$2 OFFSET \$3
    `;

    const countQuery = `
      SELECT COUNT(*) FROM notifications ${whereClause}
    `;

    const [notificationsResult, countResult] = await Promise.all([
      pool.query(query, [userId, limit, offset]),
      pool.query(countQuery, [userId])
    ]);

    return {
      notifications: notificationsResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = \$1 AND is_read = false
    `;

    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Mark as read
   */
  static async markAsRead(notificationId, userId) {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE id = \$1 AND user_id = \$2
      RETURNING *
    `;

    const result = await pool.query(query, [notificationId, userId]);
    return result.rows[0];
  }

  /**
   * Mark all as read
   */
  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = \$1 AND is_read = false
    `;

    await pool.query(query, [userId]);
  }

  /**
   * Delete notification
   */
  static async delete(notificationId, userId) {
    const query = `
      DELETE FROM notifications
      WHERE id = \$1 AND user_id = \$2
    `;

    await pool.query(query, [notificationId, userId]);
  }
}

module.exports = Notification;