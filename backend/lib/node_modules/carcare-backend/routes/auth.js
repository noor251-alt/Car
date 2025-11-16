// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../utils/logger');

// Register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('phone').isMobilePhone('any'),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').isIn(['client', 'agent'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, phone, password, firstName, lastName, role, referralCode } = req.body;

      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }

      // Create user
      const user = await User.create({
        email,
        phone,
        password,
        firstName,
        lastName,
        role
      });

      // Handle referral
      if (referralCode && role === 'client') {
        await User.handleReferral(user.id, referralCode);
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      logger.info(`New user registered: ${user.email}`);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ message: 'Erreur lors de l\'inscription' });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, fcmToken } = req.body;

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Identifiants invalides' });
      }

      // Check status
      if (user.status !== 'active') {
        return res.status(403).json({ message: 'Compte désactivé' });
      }

      // Verify password
      const isValidPassword = await User.comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Identifiants invalides' });
      }

      // Update FCM token if provided
      if (fcmToken) {
        await User.updateFCMToken(user.id, fcmToken);
      }

      // Update last login
      await User.updateLastLogin(user.id);

      // Generate token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      // Get full user profile
      const fullUser = await User.findById(user.id);

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        token,
        user: {
          id: fullUser.id,
          email: fullUser.email,
          firstName: fullUser.first_name,
          lastName: fullUser.last_name,
          phone: fullUser.phone,
          role: fullUser.role,
          profile: fullUser.profile,
          profileImage: fullUser.profile_image
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
  }
);

// Get current user
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        profile: user.profile,
        profileImage: user.profile_image
      }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Refresh token
router.post('/refresh-token', require('../middleware/auth'), async (req, res) => {
  try {
    const token = jwt.sign(
      { id: req.user.id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({ success: true, token });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ message: 'Erreur lors du rafraîchissement du token' });
  }
});

module.exports = router;