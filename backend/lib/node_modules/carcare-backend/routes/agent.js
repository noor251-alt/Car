// backend/routes/agent.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const agentAuth = require('../middleware/agentAuth');
const upload = require('../middleware/upload');
const db = require('../config/database');
const { createNotification } = require('../services/pushNotifications');
const socketService = require('../socket');

/**
 * @route   GET /api/agent/dashboard
 * @desc    Get agent dashboard stats
 * @access  Private (Agent only)
 */
router.get('/dashboard', [auth, agentAuth], async (req, res) => {
  try {
    const agentId = req.user.id;

    // Today's stats
    const [todayStats] = await db.query(
      `SELECT 
        COUNT(*) as today_bookings,
        SUM(CASE WHEN status = 'completed' THEN agent_earnings ELSE 0 END) as today_earnings,
        SUM(CASE WHEN status IN ('in_progress', 'completed') THEN 
          TIMESTAMPDIFF(MINUTE, service_started_at, 
            COALESCE(service_completed_at, NOW())) 
        ELSE 0 END) / 60 as today_hours
      FROM bookings
      WHERE agent_id = ?
      AND DATE(created_at) = CURDATE()`,
      [agentId]
    );

    // Month stats
    const [monthStats] = await db.query(
      `SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as month_completed,
        SUM(CASE WHEN status = 'completed' THEN agent_earnings ELSE 0 END) as month_earnings,
        AVG(CASE WHEN rating IS NOT NULL THEN rating END) as month_rating
      FROM bookings
      WHERE agent_id = ?
      AND MONTH(created_at) = MONTH(CURDATE())
      AND YEAR(created_at) = YEAR(CURDATE())`,
      [agentId]
    );

    // Overall stats
    const [overallStats] = await db.query(
      `SELECT 
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating IS NOT NULL THEN 1 END) as total_reviews
      FROM bookings
      WHERE agent_id = ? AND rating IS NOT NULL`,
      [agentId]
    );

    // Unread notifications
    const [notifications] = await db.query(
      `SELECT COUNT(*) as unread_notifications
      FROM notifications
      WHERE user_id = ? AND is_read = FALSE`,
      [agentId]
    );

    res.json({
      today_bookings: todayStats[0].today_bookings || 0,
      today_earnings: parseFloat(todayStats[0].today_earnings) || 0,
      today_hours: parseFloat(todayStats[0].today_hours).toFixed(1) || 0,
      month_completed: monthStats[0].month_completed || 0,
      month_earnings: parseFloat(monthStats[0].month_earnings) || 0,
      month_rating: parseFloat(monthStats[0].month_rating) || 0,
      average_rating: parseFloat(overallStats[0].average_rating) || 0,
      total_reviews: overallStats[0].total_reviews || 0,
      unread_notifications: notifications[0].unread_notifications || 0,
    });
  } catch (error) {
    console.error('Get agent dashboard error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/agent/bookings/today
 * @desc    Get today's bookings
 * @access  Private (Agent only)
 */
router.get('/bookings/today', [auth, agentAuth], async (req, res) => {
  try {
    const agentId = req.user.id;

    const [bookings] = await db.query(
      `SELECT 
        b.*,
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        c.phone as client_phone,
        c.profile_image as client_image,
        a.street_address,
        a.city,
        a.postal_code,
        a.latitude,
        a.longitude
      FROM bookings b
      JOIN users c ON b.client_id = c.id
      LEFT JOIN addresses a ON b.address_id = a.id
      WHERE b.agent_id = ?
      AND DATE(b.scheduled_time) = CURDATE()
      ORDER BY b.scheduled_time ASC`,
      [agentId]
    );

    // Format bookings
    const formattedBookings = bookings.map((booking) => ({
      ...booking,
      client: {
        first_name: booking.client_name?.split(' ')[0],
        last_name: booking.client_name?.split(' ').slice(1).join(' '),
        phone: booking.client_phone,
        profile_image: booking.client_image,
      },
      address: {
        street_address: booking.street_address,
        city: booking.city,
        postal_code: booking.postal_code,
        latitude: booking.latitude,
        longitude: booking.longitude,
      },
    }));

    res.json({ bookings: formattedBookings });
  } catch (error) {
    console.error('Get today bookings error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/agent/bookings
 * @desc    Get all agent bookings with filters
 * @access  Private (Agent only)
 */
router.get('/bookings', [auth, agentAuth], async (req, res) => {
  try {
    const agentId = req.user.id;
    const { status, date_from, date_to, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT 
        b.*,
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        c.phone as client_phone,
        c.profile_image as client_image,
        c.rating as client_rating,
        a.street_address,
        a.city,
        a.postal_code,
        a.latitude,
        a.longitude,
        v.brand as vehicle_brand,
        v.model as vehicle_model,
        v.color as vehicle_color,
        v.license_plate as vehicle_plate
      FROM bookings b
      JOIN users c ON b.client_id = c.id
      LEFT JOIN addresses a ON b.address_id = a.id
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.agent_id = ?
    `;

    const params = [agentId];

    // Apply filters
    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    if (date_from) {
      query += ' AND DATE(b.scheduled_time) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND DATE(b.scheduled_time) <= ?';
      params.push(date_to);
    }

    query += ' ORDER BY b.scheduled_time DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [bookings] = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM bookings b WHERE b.agent_id = ?';
    const countParams = [agentId];

    if (status) {
      countQuery += ' AND b.status = ?';
      countParams.push(status);
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

    // Format bookings
    const formattedBookings = bookings.map((booking) => ({
      ...booking,
      client: {
        first_name: booking.client_name?.split(' ')[0],
        last_name: booking.client_name?.split(' ').slice(1).join(' '),
        phone: booking.client_phone,
        profile_image: booking.client_image,
        rating: booking.client_rating,
      },
      address: {
        street_address: booking.street_address,
        city: booking.city,
        postal_code: booking.postal_code,
        latitude: booking.latitude,
        longitude: booking.longitude,
      },
      vehicle: {
        brand: booking.vehicle_brand,
        model: booking.vehicle_model,
        color: booking.vehicle_color,
        license_plate: booking.vehicle_plate,
      },
    }));

    res.json({
      bookings: formattedBookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Get agent bookings error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/agent/bookings/:id
 * @desc    Get booking details
 * @access  Private (Agent only)
 */
router.get('/bookings/:id', [auth, agentAuth], async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = req.user.id;

    const [bookings] = await db.query(
      `SELECT 
        b.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.phone as client_phone,
        c.email as client_email,
        c.profile_image as client_image,
        c.rating as client_rating,
        a.street_address,
        a.city,
        a.postal_code,
        a.latitude,
        a.longitude,
        v.brand as vehicle_brand,
        v.model as vehicle_model,
        v.year as vehicle_year,
        v.color as vehicle_color,
        v.license_plate as vehicle_plate,
        v.photos as vehicle_photos
      FROM bookings b
      JOIN users c ON b.client_id = c.id
      LEFT JOIN addresses a ON b.address_id = a.id
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.id = ? AND b.agent_id = ?`,
      [id, agentId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    const booking = bookings[0];

    // Format response
    const formattedBooking = {
      ...booking,
      client: {
        id: booking.client_id,
        first_name: booking.client_first_name,
        last_name: booking.client_last_name,
        phone: booking.client_phone,
        email: booking.client_email,
        profile_image: booking.client_image,
        rating: booking.client_rating,
      },
      address: {
        street_address: booking.street_address,
        city: booking.city,
        postal_code: booking.postal_code,
        latitude: booking.latitude,
        longitude: booking.longitude,
      },
      vehicle: booking.vehicle_id
        ? {
            brand: booking.vehicle_brand,
            model: booking.vehicle_model,
            year: booking.vehicle_year,
            color: booking.vehicle_color,
            license_plate: booking.vehicle_plate,
          }
        : null,
      vehicle_photos: booking.vehicle_photos,
    };

    res.json({ booking: formattedBooking });
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   PUT /api/agent/bookings/:id/status
 * @desc    Update booking status
 * @access  Private (Agent only)
 */
router.put(
  '/bookings/:id/status',
  [
    auth,
    agentAuth,
    body('status').isIn([
      'confirmed',
      'en_route',
      'in_progress',
      'completed',
      'cancelled',
    ]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status } = req.body;
      const agentId = req.user.id;

      // Verify booking belongs to agent
      const [bookings] = await db.query(
        'SELECT * FROM bookings WHERE id = ? AND agent_id = ?',
        [id, agentId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({ message: 'Réservation non trouvée' });
      }

      const booking = bookings[0];

      // Validate status transition
      const validTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['en_route', 'cancelled'],
        en_route: ['in_progress', 'cancelled'],
        in_progress: ['completed'],
      };

      if (
        !validTransitions[booking.status] ||
        !validTransitions[booking.status].includes(status)
      ) {
        return res.status(400).json({
          message: `Transition invalide de ${booking.status} vers ${status}`,
        });
      }

      // Update booking status
      const updateData = { status };

      // Set timestamps based on status
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date();
      } else if (status === 'en_route') {
        updateData.en_route_at = new Date();
      } else if (status === 'in_progress') {
        updateData.service_started_at = new Date();
      } else if (status === 'completed') {
        updateData.service_completed_at = new Date();
      }

      await db.query('UPDATE bookings SET ? WHERE id = ?', [updateData, id]);

      // Send notification to client
      const notificationMessages = {
        confirmed: 'Votre réservation a été confirmée par l\'agent',
        en_route: 'Votre agent est en route !',
        in_progress: 'Le lavage de votre véhicule a commencé',
        completed: 'Le lavage est terminé ! Merci d\'avoir utilisé CarCare',
      };

      if (notificationMessages[status]) {
        await createNotification(
          booking.client_id,
          `booking_${status}`,
          notificationMessages[status],
          {
            booking_id: id,
            booking_number: booking.booking_number,
          }
        );
      }

      // Emit socket event
      const io = socketService.getIO();
      io.to(`user-${booking.client_id}`).emit('booking-updated', {
        bookingId: id,
        status: status,
      });

      // If completed, calculate earnings
      if (status === 'completed') {
        await calculateAndDistributeEarnings(id);
      }

      res.json({
        success: true,
        message: 'Statut mis à jour avec succès',
        status: status,
      });
    } catch (error) {
      console.error('Update booking status error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * @route   POST /api/agent/bookings/:id/complete
 * @desc    Complete service with photos
 * @access  Private (Agent only)
 */
router.post(
  '/bookings/:id/complete',
  [auth, agentAuth, upload.fields([
    { name: 'before_photos', maxCount: 5 },
    { name: 'after_photos', maxCount: 5 },
  ])],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const agentId = req.user.id;

      // Verify booking
      const [bookings] = await db.query(
        'SELECT * FROM bookings WHERE id = ? AND agent_id = ?',
        [id, agentId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({ message: 'Réservation non trouvée' });
      }

      const booking = bookings[0];

      if (booking.status !== 'in_progress') {
        return res.status(400).json({
          message: 'Le service doit être en cours pour être complété',
        });
      }

      // Process photos
      const beforePhotos = req.files['before_photos']
        ? req.files['before_photos'].map((file) => `/uploads/${file.filename}`)
        : [];

      const afterPhotos = req.files['after_photos']
        ? req.files['after_photos'].map((file) => `/uploads/${file.filename}`)
        : [];

      if (afterPhotos.length === 0) {
        return res.status(400).json({
          message: 'Au moins une photo après le service est requise',
        });
      }

      // Update booking
      await db.query(
        `UPDATE bookings 
        SET status = 'completed',
            service_completed_at = NOW(),
            before_photos = ?,
            after_photos = ?,
            completion_notes = ?
        WHERE id = ?`,
        [JSON.stringify(beforePhotos), JSON.stringify(afterPhotos), notes, id]
      );

      // Calculate earnings
      await calculateAndDistributeEarnings(id);

      // Send notification to client
      await createNotification(
        booking.client_id,
        'service_completed',
        'Votre véhicule est prêt ! Consultez les photos du résultat',
        {
          booking_id: id,
          booking_number: booking.booking_number,
          after_photos: afterPhotos,
        }
      );

      // Emit socket event
      const io = socketService.getIO();
      io.to(`user-${booking.client_id}`).emit('service-completed', {
        bookingId: id,
        afterPhotos: afterPhotos,
      });

      res.json({
        success: true,
        message: 'Service complété avec succès',
        booking_id: id,
      });
    } catch (error) {
      console.error('Complete service error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * @route   POST /api/agent/bookings/:id/report-issue
 * @desc    Report issue with booking
 * @access  Private (Agent only)
 */
router.post(
  '/bookings/:id/report-issue',
  [
    auth,
    agentAuth,
    body('issue_type').notEmpty(),
    body('description').optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { issue_type, description } = req.body;
      const agentId = req.user.id;

      // Verify booking
      const [bookings] = await db.query(
        'SELECT * FROM bookings WHERE id = ? AND agent_id = ?',
        [id, agentId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({ message: 'Réservation non trouvée' });
      }

      // Create issue report
      await db.query(
        `INSERT INTO booking_issues (booking_id, reported_by, issue_type, description)
        VALUES (?, ?, ?, ?)`,
        [id, agentId, issue_type, description]
      );

      // Notify admin
      const [admins] = await db.query(
        'SELECT id FROM users WHERE role = "admin"'
      );

      for (const admin of admins) {
        await createNotification(
          admin.id,
          'booking_issue',
          `Problème signalé sur la réservation #${bookings[0].booking_number}`,
          {
            booking_id: id,
            issue_type: issue_type,
          }
        );
      }

      res.json({
        success: true,
        message: 'Problème signalé avec succès',
      });
    } catch (error) {
      console.error('Report issue error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * @route   PUT /api/agent/status
 * @desc    Update agent availability status
 * @access  Private (Agent only)
 */
router.put(
  '/status',
  [auth, agentAuth, body('status').isIn(['available', 'busy', 'offline'])],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status } = req.body;
      const agentId = req.user.id;

      await db.query('UPDATE users SET status = ? WHERE id = ?', [status, agentId]);

      // Emit socket event
      const io = socketService.getIO();
      io.emit('agent-status-changed', {
        agentId: agentId,
        status: status,
      });

      res.json({
        success: true,
        message: 'Statut mis à jour',
        status: status,
      });
    } catch (error) {
      console.error('Update agent status error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * @route   GET /api/agent/status
 * @desc    Get agent current status
 * @access  Private (Agent only)
 */
router.get('/status', [auth, agentAuth], async (req, res) => {
  try {
    const agentId = req.user.id;

    const [users] = await db.query(
      'SELECT status FROM users WHERE id = ?',
      [agentId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Agent non trouvé' });
    }

    res.json({ status: users[0].status || 'offline' });
  } catch (error) {
    console.error('Get agent status error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/agent/earnings
 * @desc    Get agent earnings
 * @access  Private (Agent only)
 */
router.get('/earnings', [auth, agentAuth], async (req, res) => {
  try {
    const agentId = req.user.id;
    const { period = 'month', year, month } = req.query;

    let query = `
      SELECT 
        DATE(service_completed_at) as date,
        COUNT(*) as bookings_count,
        SUM(agent_earnings) as total_earnings,
        AVG(agent_earnings) as avg_earnings
      FROM bookings
      WHERE agent_id = ?
      AN