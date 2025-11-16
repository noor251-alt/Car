// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Compte désactivé' });
    }

    // Get profile ID based on role
    let profileId = null;
    if (user.role === 'client') {
      const profile = await User.getClientProfileId(user.id);
      profileId = profile.id;
    } else if (user.role === 'agent') {
      const profile = await User.getAgentProfileId(user.id);
      profileId = profile.id;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      profileId
    };
    req.token = token;

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token invalide' });
  }
};