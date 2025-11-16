// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/stats', [auth, adminAuth], async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    let dateFilter = '';
    let previousDateFilter = '';

    if (period === 'week') {
      dateFilter = 'AND YEARWEEK(created_at) = YEARWEEK(NOW())';
      previousDateFilter = 'AND YEARWEEK(created_at) = YEARWEEK(NOW() - INTERVAL 1 WEEK)';
    } else if (period === 'month') {
      dateFilter = 'AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())';
      previousDateFilter = 'AND MONTH(created_at) = MONTH(NOW() - INTERVAL 1 MONTH)';
    } else if (period === 'year') {
      dateFilter = 'AND YEAR(created_at) = YEAR(NOW())';
      previousDateFilter = 'AND YEAR(created_at) = YEAR(NOW() - INTERVAL 1 YEAR)';
    }

    // Current period stats
    const [currentStats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM bookings WHERE 1=1 ${dateFilter}) as total_bookings,
        (SELECT SUM(platform_earnings) FROM bookings WHERE status = 'completed' ${dateFilter}) as total_revenue,
        (SELECT COUNT(*) FROM users WHERE role = 'client' ${dateFilter}) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'agent' ${dateFilter}) as total_agents,
        (SELECT COUNT(*) FROM users WHERE role = 'agent' AND status = 'available') as online_agents
    `);

    // Previous period stats for growth calculation
    const [previousStats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM bookings WHERE 1=1 ${previousDateFilter}) as prev_bookings,
        (SELECT SUM(platform_earnings) FROM bookings WHERE status = 'completed' ${previousDateFilter}) as prev_revenue,
        (SELECT COUNT(*) FROM users WHERE role = 'client' ${previousDateFilter}) as prev_users,
        (SELECT COUNT(*) FROM users WHERE role = 'agent' ${previousDateFilter}) as prev_agents
    `);

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (!previous || previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const stats = {
      total_bookings: currentStats[0].total_bookings || 0,
      total_revenue: parseFloat(currentStats[0].total_revenue) || 0,
      total_users: currentStats[0].total_users || 0,
      total_agents: currentStats[0].total_agents || 0,
      online_agents: currentStats[0].online_agents || 0,
      total_bookings_growth: calculateGrowth(
        currentStats[0].total_bookings,
        previousStats[0].prev_bookings
      ),
      total_revenue_growth: calculateGrowth(
        currentStats[0].total_revenue,
        previousStats[0].prev_revenue
      ),
      total_users_growth: calculateGrowth(
        currentStats[0].total_users,
        previousStats[0].prev_users
      ),
      total_agents_growth: calculateGrowth(
        currentStats[0].total_agents,
        previousStats[0].prev_agents
      ),
    };

    res.json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/revenue-chart
 * @desc    Get revenue chart data
 * @access  Private (Admin only)
 */
router.get('/revenue-chart', [auth, adminAuth], async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    let groupBy = '';
    let dateFormat = '';
    let intervalDays = 7;

    if (period === 'week') {
      groupBy = 'DATE(service_completed_at)';
      dateFormat = '%d/%m';
      intervalDays = 7;
    } else if (period === 'month') {
      groupBy = 'DATE(service_completed_at)';
      dateFormat = '%d/%m';
      intervalDays = 30;
    } else if (period === 'year') {
      groupBy = 'DATE_FORMAT(service_completed_at, "%Y-%m")';
      dateFormat = '%m/%Y';
      intervalDays = 365;
    }

    const [data] = await db.query(
      `SELECT 
        ${groupBy} as date,
        DATE_FORMAT(service_completed_at, '${dateFormat}') as label,
        SUM(platform_earnings) as revenue
      FROM bookings
      WHERE status = 'completed'
      AND service_completed_at >= DATE_SUB(NOW(), INTERVAL ${intervalDays} DAY)
      GROUP BY ${groupBy}
      ORDER BY date ASC`
    );

    const labels = data.map((item) => item.label);
    const values = data.map((item) => parseFloat(item.revenue) || 0);
    const total = values.reduce((sum, val) => sum + val, 0);

    res.json({
      labels: labels,
      values: values,
      total: total,
    });
  } catch (error) {
    console.error('Get revenue chart error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/bookings-chart
 * @desc    Get bookings chart data by status
 * @access  Private (Admin only)
 */
router.get('/bookings-chart', [auth, adminAuth], async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    let dateFilter = '';

    if (period === 'week') {
      dateFilter = 'AND YEARWEEK(created_at) = YEARWEEK(NOW())';
    } else if (period === 'month') {
      dateFilter = 'AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())';
    } else if (period === 'year') {
      dateFilter = 'AND YEAR(created_at) = YEAR(NOW())';
    }

    const [data] = await db.query(
      `SELECT 
        status,
        COUNT(*) as count
      FROM bookings
      WHERE 1=1 ${dateFilter}
      GROUP BY status
      ORDER BY count DESC`
    );

    const statusLabels = {
      pending: 'En attente',
      confirmed: 'Confirmées',
      en_route: 'En route',
      in_progress: 'En cours',
      completed: 'Terminées',
      cancelled: 'Annulées',
    };

    const labels = data.map((item) => statusLabels[item.status] || item.status);
    const values = data.map((item) => item.count);

    res.json({
      labels: labels,
      values: values,
    });
  } catch (error) {
    console.error('Get bookings chart error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/service-distribution
 * @desc    Get service type distribution
 * @access  Private (Admin only)
 */
router.get('/service-distribution', [auth, adminAuth], async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let dateFilter = '';

    if (period === 'week') {
      dateFilter = 'AND YEARWEEK(created_at) = YEARWEEK(NOW())';
    } else if (period === 'month') {
      dateFilter = 'AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())';
    } else if (period === 'year') {
      dateFilter = 'AND YEAR(created_at) = YEAR(NOW())';
    }

    const [data] = await db.query(
      `SELECT 
        wash_type,
        COUNT(*) as count
      FROM bookings
      WHERE status = 'completed' ${dateFilter}
      GROUP BY wash_type
      ORDER BY count DESC`
    );

    const typeLabels = {
      basic_exterior: 'Extérieur Basique',
      complete_exterior: 'Extérieur Complet',
      interior: 'Intérieur',
      complete: 'Complet',
      premium: 'Premium',
    };

    const distribution = data.map((item) => ({
      name: typeLabels[item.wash_type] || item.wash_type,
      count: item.count,
    }));

    res.json(distribution);
  } catch (error) {
    console.error('Get service distribution error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/recent-activity
 * @desc    Get recent platform activity
 * @access  Private (Admin only)
 */
router.get('/recent-activity', [auth, adminAuth], async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [activities] = await db.query(
      `SELECT 
        id,
        type,
        description,
        created_at
      FROM activity_logs
      ORDER BY created_at DESC
      LIMIT ?`,
      [limit]
    );

    res.json({ activities: activities });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters
 * @access  Private (Admin only)
 */
router.get('/users', [auth, adminAuth], async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT 
        u.*,
        COUNT(DISTINCT b.id) as total_bookings,
        AVG(b.rating) as average_rating
      FROM users u
      LEFT JOIN bookings b ON u.id = b.client_id
      WHERE 1=1
    `;

    const params = [];

    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }

    if (status) {
      query += ' AND u.status = ?';
      params.push(status);
    }

    if (search) {
      query += ` AND (
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.email LIKE ? OR 
        u.phone LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' GROUP BY u.id ORDER BY u.created_at DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [users] = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users u WHERE 1=1';
    const countParams = [];

    if (role) {
      countQuery += ' AND u.role = ?';
      countParams.push(role);
    }

    if (status) {
      countQuery += ' AND u.status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ` AND (
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.email LIKE ? OR 
        u.phone LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await db.query(countQuery, countParams);

    res.json({
      users: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status
 * @access  Private (Admin only)
 */
router.put('/users/:id/status', [auth, adminAuth], async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (type, description, user_id, created_at)
      VALUES ('user_status_changed', ?, ?, NOW())`,
      [`Statut utilisateur modifié: ${status}`, id]
    );

    res.json({ success: true, message: 'Statut mis à jour' });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/bookings
 * @desc    Get all bookings with filters
 * @access  Private (Admin only)
 */
router.get('/bookings', [auth, adminAuth], async (req, res) => {
  try {
    const {
      status,
      agent_id,
      client_id,
      date_from,
      date_to,
      page = 1,
      limit = 20,
    } = req.query;

    let query = `
      SELECT 
        b.*,
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        CONCAT(a.first_name, ' ', a.last_name) as agent_name,
        addr.city
      FROM bookings b
      JOIN users c ON b.client_id = c.id
      LEFT JOIN users a ON b.agent_id = a.id
      LEFT JOIN addresses addr ON b.address_id = addr.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    if (agent_id) {
      query += ' AND b.agent_id = ?';
      params.push(agent_id);
    }

    if (client_id) {
      query += ' AND b.client_id = ?';
      params.push(client_id);
    }

    if (date_from) {
      query += ' AND DATE(b.scheduled_time) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND DATE(b.scheduled_time) <= ?';
      params.push(date_to);
    }

    query += ' ORDER BY b.created_at DESC';

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [bookings] = await db.query(query, params);

    // Get total count (same filters without pagination)
    let countQuery = 'SELECT COUNT(*) as total FROM bookings b WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND b.status = ?';
      countParams.push(status);
    }

    if (agent_id) {
      countQuery += ' AND b.agent_id = ?';
      countParams.push(agent_id);
    }

    if (client_id) {
      countQuery += ' AND b.client_id = ?';
      countParams.push(client_id);
    }

    if (date_from) {
      countQuery += ' AND DATE(b.scheduled_time) >= ?';
      countParams.push(date_from);
    }

    if (date_to) {
      countQuery += ' AND DATE(b.scheduled_time) <= ?';
      countParams.push(date_to);
    }

    const [countResult] = await db.query(countQuery, countParams);

    res.json({
      bookings: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// backend/routes/admin.js (suite)

/**
 * @route   PUT /api/admin/users/:id/suspend
 * @desc    Suspend user
 * @access  Private (Admin only)
 */
router.put('/users/:id/suspend', [auth, adminAuth], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await db.query(
      'UPDATE users SET status = ?, suspension_reason = ? WHERE id = ?',
      ['suspended', reason, id]
    );

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (type, description, user_id, created_at)
      VALUES ('user_suspended', ?, ?, NOW())`,
      [`Utilisateur suspendu: ${reason}`, id]
    );

    // Send notification
    await createNotification(
      id,
      'account_suspended',
      `Votre compte a été suspendu. Raison: ${reason}`,
      {}
    );

    res.json({ success: true, message: 'Utilisateur suspendu' });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete('/users/:id', [auth, adminAuth], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has active bookings
    const [activeBookings] = await db.query(
      `SELECT COUNT(*) as count FROM bookings 
      WHERE (client_id = ? OR agent_id = ?) 
      AND status IN ('pending', 'confirmed', 'en_route', 'in_progress')`,
      [id, id]
    );

    if (activeBookings[0].count > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer un utilisateur avec des réservations actives',
      });
    }

    // Delete user
    await db.query('DELETE FROM users WHERE id = ?', [id]);

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (type, description, created_at)
      VALUES ('user_deleted', ?, NOW())`,
      [`Utilisateur supprimé (ID: ${id})`]
    );

    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/admin/users/:id/promote-agent
 * @desc    Promote user to agent
 * @access  Private (Admin only)
 */
router.post('/users/:id/promote-agent', [auth, adminAuth], async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('UPDATE users SET role = ? WHERE id = ?', ['agent', id]);

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (type, description, user_id, created_at)
      VALUES ('user_promoted', ?, ?, NOW())`,
      ['Utilisateur promu en agent', id]
    );

    // Send notification
    await createNotification(
      id,
      'promoted_to_agent',
      'Félicitations ! Vous avez été promu agent CarCare',
      {}
    );

    res.json({ success: true, message: 'Utilisateur promu en agent' });
  } catch (error) {
    console.error('Promote user error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/users/:id/details
 * @desc    Get detailed user information
 * @access  Private (Admin only)
 */
router.get('/users/:id/details', [auth, adminAuth], async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.query(
      `SELECT 
        u.*,
        a.street_address,
        a.city,
        a.postal_code,
        a.latitude,
        a.longitude
      FROM users u
      LEFT JOIN addresses a ON u.id = a.user_id
      WHERE u.id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    // Format address
    if (user.street_address) {
      user.address = {
        street_address: user.street_address,
        city: user.city,
        postal_code: user.postal_code,
        latitude: user.latitude,
        longitude: user.longitude,
      };
    }

    res.json({ user: user });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/users/:id/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/users/:id/stats', [auth, adminAuth], async (req, res) => {
  try {
    const { id } = req.params;

    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
        SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END) as total_spent,
        AVG(CASE WHEN rating IS NOT NULL THEN rating END) as average_rating
      FROM bookings
      WHERE client_id = ? OR agent_id = ?`,
      [id, id]
    );

    res.json(stats[0]);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// backend/routes/admin.js (suite)

/**
 * @route   POST /api/admin/notifications/bulk
 * @desc    Send bulk notifications
 * @access  Private (Admin only)
 */
router.post(
  '/notifications/bulk',
  [
    auth,
    adminAuth,
    upload.single('image'),
    body('title').notEmpty().withMessage('Titre requis'),
    body('message').notEmpty().withMessage('Message requis'),
    body('type').isIn(['info', 'success', 'warning', 'promotion', 'urgent']),
    body('recipient_type').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        type,
        recipient_type,
        title,
        message,
        action_url,
        delivery_type,
        scheduled_at,
        send_push,
        send_email,
        send_sms,
        user_id,
        filters,
      } = req.body;

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      // Get recipient user IDs
      let recipientIds = [];

      if (recipient_type === 'single' && user_id) {
        recipientIds = [user_id];
      } else {
        recipientIds = await getRecipientIds(recipient_type, filters);
      }

      if (recipientIds.length === 0) {
        return res.status(400).json({
          message: 'Aucun destinataire trouvé',
        });
      }

      // Create bulk notification record
      const [result] = await db.query(
        `INSERT INTO bulk_notifications 
        (type, title, message, action_url, image_url, recipient_type, 
         recipient_count, delivery_type, scheduled_at, send_push, send_email, send_sms, 
         created_by, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          type,
          title,
          message,
          action_url,
          imageUrl,
          recipient_type,
          recipientIds.length,
          delivery_type || 'immediate',
          scheduled_at || null,
          send_push === 'true' || send_push === true,
          send_email === 'true' || send_email === true,
          send_sms === 'true' || send_sms === true,
          req.user.id,
          delivery_type === 'scheduled' ? 'scheduled' : 'processing',
        ]
      );

      const bulkNotificationId = result.insertId;

      if (delivery_type === 'immediate') {
        // Send immediately
        await sendBulkNotifications(bulkNotificationId, recipientIds, {
          type,
          title,
          message,
          action_url,
          image_url: imageUrl,
          send_push: send_push === 'true' || send_push === true,
          send_email: send_email === 'true' || send_email === true,
          send_sms: send_sms === 'true' || send_sms === true,
        });

        res.json({
          success: true,
          message: 'Notifications envoyées',
          sent_count: recipientIds.length,
        });
      } else {
        // Schedule for later
        await db.query(
          `INSERT INTO scheduled_jobs (type, data, scheduled_at, status)
          VALUES ('bulk_notification', ?, ?, 'pending')`,
          [
            JSON.stringify({
              bulk_notification_id: bulkNotificationId,
              recipient_ids: recipientIds,
            }),
            scheduled_at,
          ]
        );

        res.json({
          success: true,
          message: 'Notification programmée',
          scheduled_for: scheduled_at,
        });
      }
    } catch (error) {
      console.error('Send bulk notification error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * @route   POST /api/admin/notifications/recipient-count
 * @desc    Get recipient count for notification criteria
 * @access  Private (Admin only)
 */
router.post('/notifications/recipient-count', [auth, adminAuth], async (req, res) => {
  try {
    const { recipientType, filters, userId } = req.body;

    let count = 0;

    if (recipientType === 'single' && userId) {
      count = 1;
    } else {
      const recipientIds = await getRecipientIds(recipientType, filters);
      count = recipientIds.length;
    }

    res.json({ count: count });
  } catch (error) {
    console.error('Get recipient count error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/admin/notifications/bulk/history
 * @desc    Get bulk notification history
 * @access  Private (Admin only)
 */
router.get('/notifications/bulk/history', [auth, adminAuth], async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const [notifications] = await db.query(
      `SELECT 
        bn.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM bulk_notifications bn
      JOIN users u ON bn.created_by = u.id
      ORDER BY bn.created_at DESC
      LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM bulk_notifications'
    );

    res.json({
      notifications: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Get bulk notification history error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Helper function to get recipient IDs based on criteria
 */
async function getRecipientIds(recipientType, filters) {
  let query = 'SELECT id FROM users WHERE 1=1';
  const params = [];

  // Base recipient type filtering
  switch (recipientType) {
    case 'clients':
      query += ' AND role = "client"';
      break;
    case 'agents':
      query += ' AND role = "agent"';
      break;
    case 'active':
      query += ' AND status = "active"';
      break;
    case 'inactive':
      query += ' AND status != "active"';
      break;
    case 'premium':
      query += ' AND has_active_subscription = TRUE';
      break;
  }

  // Custom filters
  if (filters) {
    const parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;

    if (parsedFilters.minBookings) {
      query += ` AND (
        SELECT COUNT(*) FROM bookings WHERE client_id = users.id OR agent_id = users.id
      ) >= ?`;
      params.push(parseInt(parsedFilters.minBookings));
    }

    if (parsedFilters.maxBookings) {
      query += ` AND (
        SELECT COUNT(*) FROM bookings WHERE client_id = users.id OR agent_id = users.id
      ) <= ?`;
      params.push(parseInt(parsedFilters.maxBookings));
    }

    if (parsedFilters.minRating) {
      query += ` AND (
        SELECT AVG(rating) FROM bookings 
        WHERE agent_id = users.id AND rating IS NOT NULL
      ) >= ?`;
      params.push(parseFloat(parsedFilters.minRating));
    }

    if (parsedFilters.registeredAfter) {
      query += ' AND created_at >= ?';
      params.push(parsedFilters.registeredAfter);
    }

    if (parsedFilters.hasActiveSubscription) {
      query += ' AND has_active_subscription = TRUE';
    }
  }

  const [users] = await db.query(query, params);
  return users.map((user) => user.id);
}

/**
 * Helper function to send bulk notifications
 */
async function sendBulkNotifications(bulkNotificationId, recipientIds, notificationData) {
  try {
    let sentCount = 0;
    let failedCount = 0;

    for (const userId of recipientIds) {
      try {
        // Create individual notification
        await db.query(
          `INSERT INTO notifications 
          (user_id, type, message, data, bulk_notification_id)
          VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            notificationData.type,
            notificationData.message,
            JSON.stringify({
              title: notificationData.title,
              action_url: notificationData.action_url,
              image_url: notificationData.image_url,
            }),
            bulkNotificationId,
          ]
        );

        // Send push notification
        if (notificationData.send_push) {
          await sendPushNotification(userId, {
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: {
              action_url: notificationData.action_url,
              image_url: notificationData.image_url,
            },
          });
        }

        // Send email
        if (notificationData.send_email) {
          await sendEmailNotification(userId, notificationData);
        }

        // Send SMS
        if (notificationData.send_sms) {
          await sendSMSNotification(userId, notificationData);
        }

        sentCount++;
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
        failedCount++;
      }
    }

    // Update bulk notification status
    await db.query(
      `UPDATE bulk_notifications 
      SET status = 'completed', 
          sent_count = ?, 
          failed_count = ?,
          completed_at = NOW()
      WHERE id = ?`,
      [sentCount, failedCount, bulkNotificationId]
    );

    return { sentCount, failedCount };
  } catch (error) {
    console.error('Send bulk notifications error:', error);

    // Update status to failed
    await db.query(
      `UPDATE bulk_notifications 
      SET status = 'failed', error_message = ?
      WHERE id = ?`,
      [error.message, bulkNotificationId]
    );

    throw error;
  }
}

/**
 * Helper function to send email notification
 */
async function sendEmailNotification(userId, notificationData) {
  // Implementation depends on your email service (SendGrid, Mailgun, etc.)
  // This is a placeholder
  logger.info(`Envoi d'email à l'utilisateur ${userId}`);
}

/**
 * Helper function to send SMS notification
 */
async function sendSMSNotification(userId, notificationData) {
  // Implementation depends on your SMS service (Twilio, etc.)
  // This is a placeholder
  logger.info(`Envoi de SMS à l'utilisateur ${userId}`);
}

module.exports = router;