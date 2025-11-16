// backend/socket/locationHandlers.js
const db = require('../config/database');

module.exports = (io, socket) => {
  /**
   * Update agent location
   */
  socket.on('update-agent-location', async (data) => {
    try {
      const agentId = socket.userId;
      const { bookingId, latitude, longitude, heading, speed } = data;

      // Update agent location in database
      await db.query(
        `UPDATE users 
        SET current_latitude = ?, 
            current_longitude = ?,
            last_location_update = NOW()
        WHERE id = ?`,
        [latitude, longitude, agentId]
      );

      // If bookingId provided, broadcast to client
      if (bookingId) {
        const [bookings] = await db.query(
          'SELECT client_id FROM bookings WHERE id = ?',
          [bookingId]
        );

        if (bookings.length > 0) {
          const clientId = bookings[0].client_id;

          // Send location update to client
          io.to(`user-${clientId}`).emit('agent-location-update', {
            bookingId: bookingId,
            latitude: latitude,
            longitude: longitude,
            heading: heading,
            speed: speed,
          });
        }
      }

      // Broadcast to admin dashboard
      io.to('admin-room').emit('agent-location-update', {
        agentId: agentId,
        latitude: latitude,
        longitude: longitude,
        heading: heading,
        speed: speed,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Update agent location error:', error);
    }
  });

  /**
   * Get nearby agents
   */
  socket.on('get-nearby-agents', async (data, callback) => {
    try {
      const { latitude, longitude, radius = 5000 } = data; // radius in meters

      // Query nearby agents using Haversine formula
      const [agents] = await db.query(
        `SELECT 
          id, 
          first_name, 
          last_name,
          current_latitude as latitude,
          current_longitude as longitude,
          status,
          (
            6371000 * acos(
              cos(radians(?)) * 
              cos(radians(current_latitude)) * 
              cos(radians(current_longitude) - radians(?)) + 
              sin(radians(?)) * 
              sin(radians(current_latitude))
            )
          ) AS distance
        FROM users
        WHERE role = 'agent'
        AND status = 'available'
        AND current_latitude IS NOT NULL
        AND current_longitude IS NOT NULL
        HAVING distance < ?
        ORDER BY distance ASC
        LIMIT 10`,
        [latitude, longitude, latitude, radius]
      );

      if (callback) {
        callback({ agents });
      }
    } catch (error) {
      console.error('Get nearby agents error:', error);
      if (callback) {
        callback({ error: 'Error fetching nearby agents' });
      }
    }
  });

  /**
   * Track agent route
   */
  socket.on('start-route-tracking', async (data) => {
    try {
      const agentId = socket.userId;
      const { bookingId } = data;

      // Create route tracking record
      await db.query(
        `INSERT INTO route_tracking (booking_id, agent_id, started_at)
        VALUES (?, ?, NOW())`,
        [bookingId, agentId]
      );

      socket.join(`route-${bookingId}`);
    } catch (error) {
      console.error('Start route tracking error:', error);
    }
  });

  socket.on('stop-route-tracking', async (data) => {
    try {
      const { bookingId } = data;

      // Update route tracking record
      await db.query(
        `UPDATE route_tracking 
        SET ended_at = NOW()
        WHERE booking_id = ? 
        AND ended_at IS NULL`,
        [bookingId]
      );

      socket.leave(`route-${bookingId}`);
    } catch (error) {
      console.error('Stop route tracking error:', error);
    }
  });

  socket.on('save-route-point', async (data) => {
    try {
      const { bookingId, latitude, longitude, speed, heading } = data;

      // Save route point
      await db.query(
        `INSERT INTO route_points (booking_id, latitude, longitude, speed, heading)
        VALUES (?, ?, ?, ?, ?)`,
        [bookingId, latitude, longitude, speed, heading]
      );
    } catch (error) {
      console.error('Save route point error:', error);
    }
  });
};