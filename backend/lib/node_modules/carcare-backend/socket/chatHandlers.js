const logger = require('../utils/logger');

// backend/socket/chatHandlers.js
module.exports = (io, socket, db) => {
  // Join booking chat room
  socket.on('join-booking', (bookingId) => {
    socket.join(`booking-${bookingId}`);
    logger.info(`Utilisateur ${socket.userId} a rejoint le chat de la réservation ${bookingId}`);
  });

  // Leave booking chat room
  socket.on('leave-booking', (bookingId) => {
    socket.leave(`booking-${bookingId}`);
    logger.info(`Utilisateur ${socket.userId} a quitté le chat de la réservation ${bookingId}`);
  });

  // Send message
  socket.on('send-message', (message) => {
    // Broadcast to all users in the booking room except sender
    socket.to(`booking-${message.booking_id}`).emit('new-message', message);
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(`booking-${data.bookingId}`).emit('user-typing', {
      bookingId: data.bookingId,
      userId: data.userId,
    });
  });

  // Stop typing indicator
  socket.on('stop-typing', (data) => {
    socket.to(`booking-${data.bookingId}`).emit('user-stopped-typing', {
      bookingId: data.bookingId,
      userId: data.userId,
    });
  });

  // Mark messages as read
  socket.on('mark-messages-read', (data) => {
    socket.to(`booking-${data.bookingId}`).emit('messages-read', {
      bookingId: data.bookingId,
      userId: data.userId,
    });
  });
};