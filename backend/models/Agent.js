// backend/models/Agent.js
const { pool } = require('../config/database');

class Agent {
  /**
   * Get agent profile
   */
  static async getProfile(userId) {
    const query = `
      SELECT ap.*, u.first_name, u.last_name, u.email, u.phone, u.profile_image
      FROM agent_profiles ap
      JOIN users u ON ap.user_id = u.id
      WHERE u.id = \$1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Update agent profile
   */
  static async updateProfile(agentId, updateData) {
    const { bio, licenseNumber, vehicleInfo } = updateData;

    const query = `
      UPDATE agent_profiles
      SET bio = COALESCE(\$1, bio),
          license_number = COALESCE(\$2, license_number),
          vehicle_info = COALESCE(\$3, vehicle_info)
      WHERE id = \$4
      RETURNING *
    `;

    const values = [
      bio,
      licenseNumber,
      vehicleInfo ? JSON.stringify(vehicleInfo) : null,
      agentId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update availability
   */
  static async updateAvailability(agentId, available) {
    const query = `
      UPDATE agent_profiles
      SET availability_status = \$1
      WHERE id = \$2
      RETURNING *
    `;

    const result = await pool.query(query, [available, agentId]);
    return result.rows[0];
  }

  /**
   * Update location
   */
  static async updateLocation(agentId, latitude, longitude) {
    const query = `
      UPDATE agent_profiles
      SET current_latitude = \$1,
          current_longitude = \$2
      WHERE id = \$3
    `;

    await pool.query(query, [latitude, longitude, agentId]);
  }

  /**
   * Set preferred zones
   */
  static async setPreferredZones(agentId, zones) {
    const query = `
      UPDATE agent_profiles
      SET preferred_zones = \$1
      WHERE id = \$2
      RETURNING *
    `;

    const result = await pool.query(query, [JSON.stringify(zones), agentId]);
    return result.rows[0];
  }

  /**
   * Get earnings
   */
  static async getEarnings(agentId, period = 'month') {
    let dateFilter;
    
    switch (period) {
      case 'today':
        dateFilter = `AND ae.created_at >= CURRENT_DATE`;
        break;
      case 'week':
        dateFilter = `AND ae.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
        break;
      case 'month':
        dateFilter = `AND ae.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
        break;
      case 'year':
        dateFilter = `AND ae.created_at >= CURRENT_DATE - INTERVAL '1 year'`;
        break;
      default:
        dateFilter = '';
    }

    const query = `
      SELECT 
        COUNT(*) as total_bookings,
        SUM(ae.amount) as total_earnings,
        SUM(ae.tip_amount) as total_tips,
        AVG(ae.amount) as avg_earning
      FROM agent_earnings ae
      WHERE ae.agent_id = \$1
      ${dateFilter}
    `;

    const result = await pool.query(query, [agentId]);
    return result.rows[0];
  }

  /**
   * Get earnings history
   */
  static async getEarningsHistory(agentId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const query = `
      SELECT ae.*,
        json_build_object(
          'booking_number', b.booking_number,
          'wash_type', b.wash_type,
          'completed_at', b.completed_at
        ) as booking
      FROM agent_earnings ae
      JOIN bookings b ON ae.booking_id = b.id
      WHERE ae.agent_id = \$1
      ORDER BY ae.created_at DESC
      LIMIT \$2 OFFSET \$3
    `;

    const countQuery = `
      SELECT COUNT(*) FROM agent_earnings WHERE agent_id = \$1
    `;

    const [earningsResult, countResult] = await Promise.all([
      pool.query(query, [agentId, limit, offset]),
      pool.query(countQuery, [agentId])
    ]);

    return {
      earnings: earningsResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  /**
   * Get statistics
   */
  static async getStatistics(agentId) {
    const query = `
      SELECT 
        ap.total_bookings,
        ap.total_earnings,
        ap.rating,
        ap.total_reviews,
        ap.level,
        (
          SELECT COUNT(*) 
          FROM bookings 
          WHERE agent_id = ap.id 
            AND status = 'completed'
            AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
        ) as monthly_bookings,
        (
          SELECT SUM(agent_earnings)
          FROM bookings
          WHERE agent_id = ap.id
            AND status = 'completed'
            AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
        ) as monthly_earnings,
        (
          SELECT AVG(rating)
          FROM reviews
          WHERE agent_id = ap.id
            AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        ) as monthly_rating
      FROM agent_profiles ap
      WHERE ap.id = \$1
    `;

    const result = await pool.query(query, [agentId]);
    return result.rows[0];
  }

  /**
   * Get reviews
   */
  static async getReviews(agentId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const query = `
      SELECT r.*,
        json_build_object(
          'first_name', u.first_name,
          'last_name', u.last_name,
          'profile_image', u.profile_image
        ) as client,
        json_build_object(
          'booking_number', b.booking_number,
          'wash_type', b.wash_type
        ) as booking
      FROM reviews r
      JOIN client_profiles cp ON r.client_id = cp.id
      JOIN users u ON cp.user_id = u.id
      JOIN bookings b ON r.booking_id = b.id
      WHERE r.agent_id = \$1
      ORDER BY r.created_at DESC
      LIMIT \$2 OFFSET \$3
    `;

    const countQuery = `
      SELECT COUNT(*) FROM reviews WHERE agent_id = \$1
    `;

    const [reviewsResult, countResult] = await Promise.all([
      pool.query(query, [agentId, limit, offset]),
      pool.query(countQuery, [agentId])
    ]);

    return {
      reviews: reviewsResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  /**
   * Respond to review
   */
  static async respondToReview(reviewId, agentId, response) {
    // Verify review belongs to agent
    const verifyQuery = `
      SELECT * FROM reviews WHERE id = \$1 AND agent_id = \$2
    `;
    
    const verifyResult = await pool.query(verifyQuery, [reviewId, agentId]);
    
    if (verifyResult.rows.length === 0) {
      throw new Error('Review not found');
    }

    const query = `
      UPDATE reviews
      SET response = \$1
      WHERE id = \$2
      RETURNING *
    `;

    const result = await pool.query(query, [response, reviewId]);
    return result.rows[0];
  }
}

module.exports = Agent;