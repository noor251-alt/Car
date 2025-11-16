// backend/middleware/adminAuth.js
module.exports = function (req, res, next) {
  // Check if user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Accès refusé. Réservé aux administrateurs.',
    });
  }

  next();
};