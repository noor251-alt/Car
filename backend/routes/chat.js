// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const db = require('../config/database');

/**
 * @route   GET /api/chat/:bookingId/messages
 * @desc    Get messages for a booking
 * @access  Private
 */
router.get('/:bookingId/messages', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this booking
    const [bookings] = await db.query(
      'SELECT * FROM bookings WHERE id = ? AND (client_id = ? OR agent_id = ?)',
      [bookingId, userId, userId]
    );

    if (bookings.length === 0) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Get messages
    const [messages] = await db.query(
      `SELECT 
        m.*,
        CONCAT(u.first_name, ' ', u.last_name) as sender_name,
        u.profile_image as sender_image
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.booking_id = ?
      ORDER BY m.created_at ASC`,
      [bookingId]
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/chat/:bookingId/messages
 * @desc    Send a message
 * @access  Private
 */
router.post(
  '/:bookingId/messages',
  [
    auth,
    upload.single('image'),
    body('message_type').isIn(['text', 'image']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { bookingId } = req.params;
      const { message, message_type } = req.body;
      const userId = req.user.id;

      // Verify user has access to this booking
      const [bookings] = await db.query(
        'SELECT * FROM bookings WHERE id = ? AND (client_id = ? OR agent_id = ?)',
        [bookingId, userId, userId]
      );

      if (bookings.length === 0) {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      let messageContent = message;

      // Handle image upload
      if (message_type === 'image') {
        if (!req.file) {
          return res.status(400).json({ message: 'Image requise' });
        }

        const imageUrl = `/uploads/chat/${req.file.filename}`;
        messageContent = imageUrl;
      }

      // Insert message
      const [result] = await db.query(
        `INSERT INTO messages (
          booking_id, sender_id, message, message_type
        ) VALUES (?, ?, ?, ?)`,
        [bookingId, userId, messageContent, message_type]
      );

      // Get full message with sender info
      const [newMessage] = await db.query(
        `SELECT 
          m.*,
          CONCAT(u.first_name, ' ', u.last_name) as sender_name,
          u.profile_image as sender_image
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?`,
        [result.insertId]
      );

      // Send push notification to other party
      // TODO: Implement push notification service

      res.json({ message: newMessage[0] });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * @route   PUT /api/chat/:bookingId/read
 * @desc    Mark messages as read
 * @access  Private
 */
router.put('/:bookingId/read', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Mark all messages from other party as read
    await db.query(
      `UPDATE messages 
      SET is_read = TRUE, read_at = NOW()
      WHERE booking_id = ? 
      AND sender_id != ? 
      AND is_read = FALSE`,
      [bookingId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/chat/unread-count
 * @desc    Get unread messages count
 * @access  Private
 */
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await db.query(
      `SELECT COUNT(DISTINCT booking_id) as count
      FROM messages
      WHERE booking_id IN (
        SELECT id FROM bookings 
        WHERE client_id = ? OR agent_id = ?
      )
      AND sender_id != ?
      AND is_read = FALSE`,
      [userId, userId, userId]
    );

    res.json({ unreadCount: result[0].count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;