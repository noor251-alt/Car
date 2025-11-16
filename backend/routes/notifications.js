// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/database');
const { sendPushNotification } = require('../services/pushNotifications');

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    const [notifications] = await db.query(
      `SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [unreadCount] = await db.query(
      `SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );

    res.json({
      notifications: notifications,
      unread_count: unreadCount[0].count,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query(
      `UPDATE notifications 
      SET is_read = TRUE, read_at = NOW()
      WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query(
      `UPDATE notifications 
      SET is_read = TRUE, read_at = NOW()
      WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications
 * @access  Private
 */
router.delete('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query('DELETE FROM notifications WHERE user_id = ?', [userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/notifications/settings
 * @desc    Get notification settings
 * @access  Private
 */
router.get('/settings', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [settings] = await db.query(
      'SELECT settings FROM notification_settings WHERE user_id = ?',
      [userId]
    );

    if (settings.length === 0) {
      // Return default settings
      return res.json({
        settings: {
          booking_confirmed: true,
          booking_assigned: true,
          agent_on_way: true,
          agent_arrived: true,
          service_completed: true,
          new_message: true,
          promotion: true,
          referral_reward: true,
          subscription_reminder: true,
          booking_reminder: true,
        },
      });
    }

    res.json({ settings: JSON.parse(settings[0].settings) });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   PUT /api/notifications/settings
 * @desc    Update notification settings
 * @access  Private
 */
router.put('/settings', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { settings } = req.body;

    await db.query(
      `INSERT INTO notification_settings (user_id, settings)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE settings = ?`,
      [userId, JSON.stringify(settings), JSON.stringify(settings)]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/notifications/push-token
 * @desc    Update push notification token
 * @access  Private
 */
router.post('/push-token', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    await db.query(
      'UPDATE users SET push_token = ? WHERE id = ?',
      [token, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update push token error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;