// backend/routes/agents.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Agent = require('../models/Agent');
const logger = require('../utils/logger');

// Get agent profile
router.get('/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const profile = await Agent.getProfile(req.user.id);
    res.json({ success: true, profile });
  } catch (error) {
    logger.error('Get agent profile error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Update agent profile
router.put('/profile',
  auth,
  [
    body('bio').optional().trim(),
    body('licenseNumber').optional().trim(),
    body('vehicleInfo').optional().isObject()
  ],
  async (req, res) => {
    try {
      if (req.user.role !== 'agent') {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const profile = await Agent.updateProfile(req.user.profileId, req.body);

      res.json({ success: true, profile });
    } catch (error) {
      logger.error('Update agent profile error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

// Update availability status
router.put('/availability',
  auth,
  [body('available').isBoolean()],
  async (req, res) => {
    try {
      if (req.user.role !== 'agent') {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const { available } = req.body;

      await Agent.updateAvailability(req.user.profileId, available);

      logger.info(`Agent ${req.user.id} availability set to ${available}`);

      res.json({ success: true, available });
    } catch (error) {
      logger.error('Update availability error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

// Update location
router.post('/location',
  auth,
  [
    body('latitude').isFloat(),
    body('longitude').isFloat()
  ],
  async (req, res) => {
    try {
      if (req.user.role !== 'agent') {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { latitude, longitude } = req.body;

      await Agent.updateLocation(req.user.profileId, latitude, longitude);

      // Emit location update via socket
      const io = req.app.get('io');
      io.emit('agent-location-updated', {
        agentId: req.user.id,
        latitude,
        longitude
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Update location error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

// Set preferred zones
router.put('/preferred-zones',
  auth,
  [body('zones').isArray()],
  async (req, res) => {
    try {
      if (req.user.role !== 'agent') {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const { zones } = req.body;

      await Agent.setPreferredZones(req.user.profileId, zones);

      res.json({ success: true, zones });
    } catch (error) {
      logger.error('Set preferred zones error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

// Get earnings statistics
router.get('/earnings', auth, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { period = 'month' } = req.query;

    const earnings = await Agent.getEarnings(req.user.profileId, period);

    res.json({ success: true, earnings });
  } catch (error) {
    logger.error('Get earnings error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Get earnings history
router.get('/earnings/history', auth, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { page = 1, limit = 20 } = req.query;

    const history = await Agent.getEarningsHistory(
      req.user.profileId,
      parseInt(page),
      parseInt(limit)
    );

    res.json({ success: true, ...history });
  } catch (error) {
    logger.error('Get earnings history error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Get statistics
router.get('/statistics', auth, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const stats = await Agent.getStatistics(req.user.profileId);

    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Get statistics error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Get reviews
router.get('/reviews', auth, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { page = 1, limit = 20 } = req.query;

    const reviews = await Agent.getReviews(
      req.user.profileId,
      parseInt(page),
      parseInt(limit)
    );

    res.json({ success: true, ...reviews });
  } catch (error) {
    logger.error('Get reviews error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Respond to review
router.post('/reviews/:reviewId/response',
  auth,
  [body('response').trim().notEmpty()],
  async (req, res) => {
    try {
      if (req.user.role !== 'agent') {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const { response } = req.body;

      await Agent.respondToReview(req.params.reviewId, req.user.profileId, response);

      logger.info(`Agent ${req.user.id} responded to review ${req.params.reviewId}`);

      res.json({ success: true, message: 'Réponse ajoutée' });
    } catch (error) {
      logger.error('Respond to review error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

module.exports = router;