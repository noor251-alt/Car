// backend/routes/users.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const upload = require('../middleware/upload');
const logger = require('../utils/logger');

// Update profile
router.put('/profile',
  auth,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('phone').optional().isMobilePhone('any')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, phone } = req.body;

      const updatedUser = await User.updateProfile(req.user.id, {
        firstName,
        lastName,
        phone
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
  }
);

// Upload profile image
router.post('/profile/image',
  auth,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Aucune image fournie' });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      await User.updateProfileImage(req.user.id, imageUrl);

      res.json({ success: true, imageUrl });
    } catch (error) {
      logger.error('Upload image error:', error);
      res.status(500).json({ message: 'Erreur lors de l\'upload' });
    }
  }
);

// Change password
router.put('/password',
  auth,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user.id);
      const isValid = await User.comparePassword(currentPassword, user.password_hash);

      if (!isValid) {
        return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
      }

      await User.updatePassword(req.user.id, newPassword);

      logger.info(`Password changed for user ${req.user.id}`);

      res.json({ success: true, message: 'Mot de passe modifié' });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

// Get client profile details
router.get('/client/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const profile = await User.getClientProfile(req.user.id);
    res.json({ success: true, profile });
  } catch (error) {
    logger.error('Get client profile error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Manage vehicles
router.get('/vehicles', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const vehicles = await User.getVehicles(req.user.profileId);
    res.json({ success: true, vehicles });
  } catch (error) {
    logger.error('Get vehicles error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/vehicles',
  auth,
  [
    body('make').trim().notEmpty(),
    body('model').trim().notEmpty(),
    body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
    body('color').optional().trim(),
    body('licensePlate').optional().trim()
  ],
  async (req, res) => {
    try {
      if (req.user.role !== 'client') {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const vehicle = await User.addVehicle(req.user.profileId, req.body);

      logger.info(`Vehicle added for client ${req.user.id}`);

      res.status(201).json({ success: true, vehicle });
    } catch (error) {
      logger.error('Add vehicle error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

router.put('/vehicles/:id',
  auth,
  async (req, res) => {
    try {
      const vehicle = await User.updateVehicle(req.params.id, req.user.profileId, req.body);
      res.json({ success: true, vehicle });
    } catch (error) {
      logger.error('Update vehicle error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

router.delete('/vehicles/:id', auth, async (req, res) => {
  try {
    await User.deleteVehicle(req.params.id, req.user.profileId);
    res.json({ success: true, message: 'Véhicule supprimé' });
  } catch (error) {
    logger.error('Delete vehicle error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Manage addresses
router.get('/addresses', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const addresses = await User.getAddresses(req.user.profileId);
    res.json({ success: true, addresses });
  } catch (error) {
    logger.error('Get addresses error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/addresses',
  auth,
  [
    body('label').optional().trim(),
    body('addressLine1').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('latitude').isFloat(),
    body('longitude').isFloat()
  ],
  async (req, res) => {
    try {
      if (req.user.role !== 'client') {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const address = await User.addAddress(req.user.profileId, req.body);

      logger.info(`Address added for client ${req.user.id}`);

      res.status(201).json({ success: true, address });
    } catch (error) {
      logger.error('Add address error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

router.put('/addresses/:id', auth, async (req, res) => {
  try {
    const address = await User.updateAddress(req.params.id, req.user.profileId, req.body);
    res.json({ success: true, address });
  } catch (error) {
    logger.error('Update address error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.delete('/addresses/:id', auth, async (req, res) => {
  try {
    await User.deleteAddress(req.params.id, req.user.profileId);
    res.json({ success: true, message: 'Adresse supprimée' });
  } catch (error) {
    logger.error('Delete address error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Referral system
router.get('/referral', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const referralData = await User.getReferralData(req.user.profileId);
    res.json({ success: true, ...referralData });
  } catch (error) {
    logger.error('Get referral error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Get subscription
router.get('/subscription', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const subscription = await User.getActiveSubscription(req.user.profileId);
    res.json({ success: true, subscription });
  } catch (error) {
    logger.error('Get subscription error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Cancel subscription
router.post('/subscription/cancel', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    await User.cancelSubscription(req.user.profileId);

    logger.info(`Subscription cancelled for client ${req.user.id}`);

    res.json({ success: true, message: 'Abonnement annulé' });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;