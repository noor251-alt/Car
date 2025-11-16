// backend/middleware/agentAuth.js
module.exports = function (req, res, next) {
  // Check if user is an agent
  if (req.user.role !== 'agent') {
    return res.status(403).json({
      message: 'Accès refusé. Réservé aux agents.',
    });
  }

  next();
};