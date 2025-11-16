// backend/models/Chat.js
const { pool } = require('../config/database');

class Chat {
  /**
   * Verify booking access
   */
  static async verifyBookingAccess(bookingId, userId) {
    const query = `
      SELECT b.id
      FROM bookings b
      LEFT JOIN client_profiles cp ON b.client_id = cp.id
      LEFT JOIN agent_profiles ap ON b.agent_id = ap.id
      WHERE b.id = \$1
        AND (cp.user_id = \$2 OR ap.user_id = \$2)
    `;

    const result = await pool.query(query, [bookingId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Get messages
   */
  static async getMessages(bookingId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;

    const query = `
      SELECT cm.*,
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'profile_image', u.profile_image,
          'role', u.role
        ) as sender
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.booking_id = \$1
      ORDER BY cm.created_at ASC
      LIMIT \$2 OFFSET \$3
    `;

    const countQuery = `
      SELECT COUNT(*) FROM chat_messages WHERE booking_id = \$1
    `;

    const [messagesResult, countResult] = await Promise.all([
      pool.query(query, [bookingId, limit, offset]),
      pool.query(countQuery, [bookingId])
    ]);

    return {
      messages: messagesResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  /**
   * Send message
   */
  static async sendMessage(messageData) {
    const { bookingId, senderId, message } = messageData;

    const query = `
      INSERT INTO chat_messages (booking_id, sender_id, message)
      VALUES (\$1, \$2, \$3)
      RETURNING *
    `;

    const result = await pool.query(query, [bookingId, senderId, message]);

    // Get sender info
    const senderQuery = `
      SELECT id, first_name, last_name, profile_image, role
      FROM users WHERE id = \$1
    `;
    
    const senderResult = await pool.query(senderQuery, [senderId]);

    return {
      ...result.rows[0],
      sender: senderResult.rows[0]
    };
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(bookingId, userId) {
    const query = `
      UPDATE chat_messages
      SET is_read = true
      WHERE booking_id = \$1
        AND sender_id != \$2
        AND is_read = false
    `;

    await pool.query(query, [bookingId, userId]);
  }

  /**
   * Get recipient for notification
   */
  static async getRecipient(bookingId, senderId) {
    const query = `
      SELECT 
        CASE 
          WHEN cp.user_id = \$2 THEN ap.user_id
          ELSE cp.user_id
        END as recipient_id
      FROM bookings b
      JOIN client_profiles cp ON b.client_id = cp.id
      LEFT JOIN agent_profiles ap ON b.agent_id = ap.id
      WHERE b.id = \$1
    `;

    const result = await pool.query(query, [bookingId, senderId]);
    
    if (result.rows[0]?.recipient_id) {
      return { id: result.rows[0].recipient_id };
    }
    
    return null;
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(bookingId, userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM chat_messages
      WHERE booking_id = \$1
        AND sender_id != \$2
        AND is_read = false
    `;

    const result = await pool.query(query, [bookingId, userId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = Chat;