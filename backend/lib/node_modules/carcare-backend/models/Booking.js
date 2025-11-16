// backend/models/Booking.js
const { pool } = require('../config/database');

class Booking {
  static async create(bookingData) {
    const {
      clientId,
      vehicleId,
      addressId,
      washType,
      scheduledDate,
      scheduledTime,
      price,
      specialInstructions,
      isUrgent,
      urgentFee
    } = bookingData;

    const bookingNumber = this.generateBookingNumber();

    const query = `
      INSERT INTO bookings (
        booking_number, client_id, vehicle_id, address_id, wash_type,
        scheduled_date, scheduled_time, price, special_instructions,
        is_urgent, urgent_fee, status
      )
      VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, \$11, 'pending')
      RETURNING *
    `;

    const values = [
      bookingNumber, clientId, vehicleId, addressId, washType,
      scheduledDate, scheduledTime, price, specialInstructions,
      isUrgent, urgentFee || 0
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT b.*,
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'phone', u.phone
        ) as client,
        json_build_object(
          'id', v.id,
          'make', v.make,
          'model', v.model,
          'color', v.color,
          'license_plate', v.license_plate
        ) as vehicle,
        json_build_object(
          'id', a.id,
          'address_line1', a.address_line1,
          'city', a.city,
          'latitude', a.latitude,
          'longitude', a.longitude
        ) as address,
        CASE WHEN b.agent_id IS NOT NULL THEN
          json_build_object(
            'id', ag.user_id,
            'first_name', au.first_name,
            'last_name', au.last_name,
            'phone', au.phone,
            'rating', ap.rating
          )
        ELSE NULL END as agent
      FROM bookings b
      JOIN client_profiles cp ON b.client_id = cp.id
      JOIN users u ON cp.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN addresses a ON b.address_id = a.id
      LEFT JOIN agent_profiles ap ON b.agent_id = ap.id
      LEFT JOIN users au ON ap.user_id = au.id
      WHERE b.id = \$1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAvailableForAgent(agentId, limit = 10) {
    const query = `
      SELECT b.*, 
        json_build_object(
          'address_line1', a.address_line1,
          'city', a.city,
          'latitude', a.latitude,
          'longitude', a.longitude
        ) as address,
        json_build_object(
          'make', v.make,
          'model', v.model
        ) as vehicle
      FROM bookings b
      JOIN addresses a ON b.address_id = a.id
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.status = 'pending' 
        AND b.scheduled_date >= CURRENT_DATE
      ORDER BY b.created_at DESC
      LIMIT \$1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  static async assignAgent(bookingId, agentId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get agent commission rate
      const agentQuery = 'SELECT commission_rate FROM agent_profiles WHERE id = \$1';
      const agentResult = await client.query(agentQuery, [agentId]);
      const commissionRate = agentResult.rows[0].commission_rate;

      // Update booking
      const updateQuery = `
        UPDATE bookings 
        SET agent_id = \$1, status = 'accepted', updated_at = CURRENT_TIMESTAMP
        WHERE id = \$2 AND status = 'pending'
        RETURNING *
      `;
      const result = await client.query(updateQuery, [agentId, bookingId]);

      if (result.rows.length === 0) {
        throw new Error('Booking not available');
      }

      const booking = result.rows[0];

      // Calculate commission and earnings
      const commission = (booking.price * commissionRate) / 100;
      const agentEarnings = booking.price - commission;

      // Update booking with earnings
      await client.query(
        'UPDATE bookings SET commission = \$1, agent_earnings = \$2 WHERE id = \$3',
        [commission, agentEarnings, bookingId]
      );

      await client.query('COMMIT');
      return { ...booking, commission, agent_earnings: agentEarnings };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateStatus(bookingId, status, additionalData = {}) {
    const timestamp = status === 'in_progress' ? 'started_at' : 
                     status === 'completed' ? 'completed_at' : null;

    let query = `UPDATE bookings SET status = \$1, updated_at = CURRENT_TIMESTAMP`;
    const values = [status];
    let paramCount = 2;

    if (timestamp) {
      query += `, ${timestamp} = CURRENT_TIMESTAMP`;
    }

    if (additionalData.beforePhotos) {
      query += `, before_photos = $${paramCount}`;
      values.push(JSON.stringify(additionalData.beforePhotos));
      paramCount++;
    }

    if (additionalData.afterPhotos) {
      query += `, after_photos = $${paramCount}`;
      values.push(JSON.stringify(additionalData.afterPhotos));
      paramCount++;
    }

    query += ` WHERE id = $${paramCount} RETURNING *`;
    values.push(bookingId);

    const result = await pool.query(query, values);

    // If completed, update statistics
    if (status === 'completed') {
      await this.updateCompletionStats(result.rows[0]);
    }

    return result.rows[0];
  }

  static async updateCompletionStats(booking) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update client stats
      await client.query(
        `UPDATE client_profiles 
         SET total_bookings = total_bookings + 1,
             total_spent = total_spent + \$1,
             loyalty_points = loyalty_points + \$2
         WHERE id = $3`,
        [booking.price, Math.floor(booking.price), booking.client_id]
      );

      // Update agent stats
      await client.query(
        `UPDATE agent_profiles 
         SET total_bookings = total_bookings + 1,
             total_earnings = total_earnings + \$1
         WHERE id = $2`,
        [booking.agent_earnings, booking.agent_id]
      );

      // Record agent earning
      await client.query(
        `INSERT INTO agent_earnings (agent_id, booking_id, amount, commission_rate)
         VALUES (\$1, \$2, \$3, \$4)`,
        [booking.agent_id, booking.id, booking.agent_earnings, 
         (booking.commission / booking.price) * 100]
      );

      // Update client tier
      await this.updateClientTier(client, booking.client_id);

      // Update agent level
      await this.updateAgentLevel(client, booking.agent_id);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateClientTier(client, clientId) {
    const result = await client.query(
      'SELECT total_bookings FROM client_profiles WHERE id = \$1',
      [clientId]
    );
    
    const totalBookings = result.rows[0].total_bookings;
    let tier = 'bronze';
    
    if (totalBookings >= 50) tier = 'gold';
    else if (totalBookings >= 20) tier = 'silver';

    await client.query(
      'UPDATE client_profiles SET tier = \$1 WHERE id = \$2',
      [tier, clientId]
    );
  }

  static async updateAgentLevel(client, agentId) {
    const result = await client.query(
      `SELECT total_bookings, rating, total_reviews 
       FROM agent_profiles WHERE id = $1`,
      [agentId]
    );
    
    const { total_bookings, rating, total_reviews } = result.rows[0];
    let level = 'beginner';
    
    if (total_bookings >= 100 && rating >= 4.5 && total_reviews >= 50) {
      level = 'expert';
    } else if (total_bookings >= 50 && rating >= 4.0) {
      level = 'advanced';
    } else if (total_bookings >= 20 && rating >= 3.5) {
      level = 'intermediate';
    }

    await client.query(
      'UPDATE agent_profiles SET level = \$1 WHERE id = \$2',
      [level, agentId]
    );
  }

  static generateBookingNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `CC${timestamp}${random}`;
  }

  static async getClientBookings(clientId, status = null) {
    let query = `
      SELECT b.*,
        json_build_object(
          'make', v.make,
          'model', v.model
        ) as vehicle,
        CASE WHEN b.agent_id IS NOT NULL THEN
          json_build_object(
            'first_name', u.first_name,
            'last_name', u.last_name,
            'rating', ap.rating
          )
        ELSE NULL END as agent
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      LEFT JOIN agent_profiles ap ON b.agent_id = ap.id
      LEFT JOIN users u ON ap.user_id = u.id
      WHERE b.client_id = \$1
    `;

    const values = [clientId];

    if (status) {
      query += ` AND b.status = $2`;
      values.push(status);
    }

    query += ` ORDER BY b.scheduled_date DESC, b.scheduled_time DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getAgentBookings(agentId, status = null) {
    let query = `
      SELECT b.*,
        json_build_object(
          'first_name', u.first_name,
          'last_name', u.last_name,
          'phone', u.phone
        ) as client,
        json_build_object(
          'make', v.make,
          'model', v.model,
          'color', v.color
        ) as vehicle,
        json_build_object(
          'address_line1', a.address_line1,
          'city', a.city,
          'latitude', a.latitude,
          'longitude', a.longitude
        ) as address
      FROM bookings b
      JOIN client_profiles cp ON b.client_id = cp.id
      JOIN users u ON cp.user_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN addresses a ON b.address_id = a.id
      WHERE b.agent_id = \$1
    `;

    const values = [agentId];

    if (status) {
      query += ` AND b.status = $2`;
      values.push(status);
    }

    query += ` ORDER BY b.scheduled_date DESC, b.scheduled_time DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }
}

module.exports = Booking;