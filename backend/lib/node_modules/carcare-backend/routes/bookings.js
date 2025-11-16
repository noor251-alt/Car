// backend/routes/bookings.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const NotificationService = require('../services/NotificationService');
const logger = require('../utils/logger');

// Create booking
router.post('/',
  auth,
  [
    body('vehicleId').isInt(),
    body('addressId').isInt(),
    body('washType').isIn(['exterior', 'classic', 'deep']),
    body('scheduledDate').isDate(),
    body('scheduledTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('isUrgent').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (req.user.role !== 'client') {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const {
        vehicleId,
        addressId,
        washType,
        scheduledDate,
        scheduledTime,
        specialInstructions,
        isUrgent
      } = req.body;

      // Get client profile ID
      const clientProfile = await Booking.getClientProfileId(req.user.id);

      // Get wash price
      const washPrice = await Booking.getWashPrice(washType);
      let price = washPrice.base_price;
      let urgentFee = 0;

      if (isUrgent) {
        urgentFee = price * 0.3; // 30% urgent fee
        price += urgentFee;
      }

      // Check if client has active subscription
      const subscription = await Booking.checkActiveSubscription(clientProfile.id);
      if (subscription && subscription.washes_used < subscription.monthly_washes) {
        // Use subscription wash
        await Booking.useSubscriptionWash(subscription.id);
        price = 0; // Free with subscription
      }

      // Create booking
      const booking = await Booking.create({
        clientId: clientProfile.id,
        vehicleId,
        addressId,
        washType,
        scheduledDate,
        scheduledTime,
        price,
        specialInstructions,
        isUrgent,
        urgentFee
      });

      // Notify nearby agents
      const io = req.app.get('io');
      await NotificationService.notifyNearbyAgents(booking, io);

      logger.info(`Booking created: ${booking.booking_number}`);

      res.status(201).json({
        success: true,
        booking
      });
    } catch (error) {
      logger.error('Create booking error:', error);
      res.status(500).json({ message: 'Erreur lors de la création de la réservation' });
    }
  }
);

// Get booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Check authorization
    if (req.user.role === 'client' && booking.client.id !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    if (req.user.role === 'agent' && booking.agent && booking.agent.id !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    logger.error('Get booking error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Get user bookings
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let bookings;

    if (req.user.role === 'client') {
      const clientProfile = await Booking.getClientProfileId(req.user.id);
      bookings = await Booking.getClientBookings(clientProfile.id, status);
    } else if (req.user.role === 'agent') {
      const agentProfile = await Booking.getAgentProfileId(req.user.id);
      bookings = await Booking.getAgentBookings(agentProfile.id, status);
    }

    res.json({ success: true, bookings });
  } catch (error) {
    logger.error('Get bookings error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Get available bookings for agent
router.get('/agent/available', auth, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const agentProfile = await Booking.getAgentProfileId(req.user.id);
    const bookings = await Booking.findAvailableForAgent(agentProfile.id);

    res.json({ success: true, bookings });
  } catch (error) {
    logger.error('Get available bookings error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Accept booking (agent)
router.post('/:id/accept', auth, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const agentProfile = await Booking.getAgentProfileId(req.user.id);
    
    // Check agent availability
    if (!agentProfile.availability_status) {
      return res.status(400).json({ message: 'Vous devez être disponible pour accepter une réservation' });
    }

    const booking = await Booking.assignAgent(req.params.id, agentProfile.id);

    // Notify client
    await NotificationService.notifyClient(booking.client_id, {
      title: 'Réservation acceptée',
      body: `Un agent a accepté votre réservation ${booking.booking_number}`,
      data: { bookingId: booking.id, type: 'booking_accepted' }
    });

    const io = req.app.get('io');
    io.to(`booking-${booking.id}`).emit('booking-accepted', { booking });

    logger.info(`Booking accepted: ${booking.booking_number} by agent ${req.user.id}`);

    res.json({ success: true, booking });
  } catch (error) {
    logger.error('Accept booking error:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de l\'acceptation' });
  }
});

// Start booking (agent)
router.post('/:id/start', auth, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const booking = await Booking.updateStatus(req.params.id, 'in_progress');

    // Notify client
    await NotificationService.notifyClient(booking.client_id, {
      title: 'Lavage commencé',
      body: 'L\'agent a commencé le lavage de votre véhicule',
      data: { bookingId: booking.id, type: 'booking_started' }
    });

    const io = req.app.get('io');
    io.to(`booking-${booking.id}`).emit('booking-started', { booking });

    res.json({ success: true, booking });
  } catch (error) {
    logger.error('Start booking error:', error);
    res.status(500).json({ message: 'Erreur lors du démarrage' });
  }
});

// Complete booking (agent)
router.post('/:id/complete',
  auth,
  [
    body('afterPhotos').isArray().notEmpty()
  ],
  async (req, res) => {
    try {
      if (req.user.role !== 'agent') {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const { afterPhotos } = req.body;

      const booking = await Booking.updateStatus(req.params.id, 'completed', {
        afterPhotos
      });

      // Notify client
      await NotificationService.notifyClient(booking.client_id, {
        title: 'Lavage terminé',
        body: 'Votre véhicule est prêt ! Merci de remettre vos clés à l\'agent.',
        data: { bookingId: booking.id, type: 'booking_completed' }
      });

      const io = req.app.get('io');
      io.to(`booking-${booking.id}`).emit('booking-completed', { booking });

      logger.info(`Booking completed: ${booking.booking_number}`);

      res.json({ success: true, booking });
    } catch (error) {
      logger.error('Complete booking error:', error);
      res.status(500).json({ message: 'Erreur lors de la finalisation' });
    }
  }
);

// Cancel booking
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Check authorization and status
    if (req.user.role === 'client' && booking.client.id !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({ message: 'Cette réservation ne peut pas être annulée' });
    }

    await Booking.updateStatus(req.params.id, 'cancelled');

    // Notify other party
    if (req.user.role === 'client' && booking.agent) {
      await NotificationService.notifyAgent(booking.agent_id, {
        title: 'Réservation annulée',
        body: `La réservation ${booking.booking_number} a été annulée par le client`,
        data: { bookingId: booking.id, type: 'booking_cancelled' }
      });
    } else if (req.user.role === 'agent') {
      await NotificationService.notifyClient(booking.client_id, {
        title: 'Réservation annulée',
        body: `Votre réservation ${booking.booking_number} a été annulée`,
        data: { bookingId: booking.id, type: 'booking_cancelled' }
      });
    }

    const io = req.app.get('io');
    io.to(`booking-${booking.id}`).emit('booking-cancelled', { bookingId: booking.id, reason });

    logger.info(`Booking cancelled: ${booking.booking_number}`);

    res.json({ success: true, message: 'Réservation annulée' });
  } catch (error) {
    logger.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'annulation' });
  }
});

// Upload before photos
router.post('/:id/before-photos',
  auth,
  require('../middleware/upload').array('photos', 5),
  async (req, res) => {
    try {
      if (req.user.role !== 'agent') {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const photoUrls = req.files.map(file => `/uploads/${file.filename}`);

      const booking = await Booking.updateStatus(req.params.id, booking.status, {
        beforePhotos: photoUrls
      });

      res.json({ success: true, photos: photoUrls });
    } catch (error) {
      logger.error('Upload photos error:', error);
      res.status(500).json({ message: 'Erreur lors de l\'upload' });
    }
  }
);

module.exports = router;