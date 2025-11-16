// backend/models/Admin.js
const { pool } = require('../config/database');

class Admin {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats() {
    const queries = {
      totalUsers: `
        SELECT COUNT(*) as count,
          COUNT(CASE WHEN role = 'client' THEN 1 END) as clients,
          COUNT(CASE WHEN role = 'agent' THEN 1 END) as agents
        FROM users
        WHERE status = 'active'
      `,
      
      totalBookings: `
        SELECT COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
        FROM bookings
      `,
      
      revenue: `
        SELECT 
          SUM(amount) as total_revenue,
          SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN amount ELSE 0 END) as monthly_revenue,
          SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN amount ELSE 0 END) as weekly_revenue
        FROM payments
        WHERE status = 'completed'
      `,
      
      activeSubscriptions: `
        SELECT COUNT(*) as count
        FROM subscriptions
        WHERE status = 'active'
      `,
      
      recentBookings: `
        SELECT b.*, 
          json_build_object(
            'first_name', uc.first_name,
            'last_name', uc.last_name
          ) as client,
          json_build_object(
            'first_name', ua.first_name,
            'last_name', ua.last_name
          ) as agent
        FROM bookings b
        JOIN client_profiles cp ON b.client_id = cp.id
        JOIN users uc ON cp.user_id = uc.id
        LEFT JOIN agent_profiles ap ON b.agent_id = ap.id
        LEFT JOIN users ua ON ap.user_id = ua.id
        ORDER BY b.created_at DESC
        LIMIT 10
      `,
      
      topAgents: `
        SELECT ap.*, u.first_name, u.last_name,
          COUNT(b.id) as bookings_count,
          AVG(r.rating) as avg_rating
        FROM agent_profiles ap
        JOIN users u ON ap.user_id = u.id
        LEFT JOIN bookings b ON ap.id = b.agent_id AND b.status = 'completed'
        LEFT JOIN reviews r ON ap.id = r.agent_id
        GROUP BY ap.id, u.id
        ORDER BY bookings_count DESC
        LIMIT 5
      `
    };

    const results = await Promise.all(
      Object.values(queries).map(query => pool.query(query))
    );

    return {
      users: results[0].rows[0],
      bookings: results[1].rows[0],
      revenue: results[2].rows[0],
      activeSubscriptions: parseInt(results[3].rows[0].count),
      recentBookings: results[4].rows,
      topAgents: results[5].rows
    };
  }

  /**
   * Get users with filters
   */
  static async getUsers(filters) {
    const { page, limit, role, status, search } = filters;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let values = [];
    let paramCount = 1;

    if (role) {
      whereConditions.push(`u.role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (status) {
      whereConditions.push(`u.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (search) {
      whereConditions.push(`(
        u.first_name ILIKE $${paramCount} OR 
        u.last_name ILIKE $${paramCount} OR 
        u.email ILIKE $${paramCount}
      )`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const query = `
      SELECT u.*,
        CASE 
          WHEN u.role = 'client' THEN
            json_build_object(
              'tier', cp.tier,
              'total_bookings', cp.total_bookings,
              'total_spent', cp.total_spent
            )
          WHEN u.role = 'agent' THEN
            json_build_object(
              'level', ap.level,
              'rating', ap.rating,
              'total_bookings', ap.total_bookings,
              'total_earnings', ap.total_earnings
            )
        END as profile_data
      FROM users u
      LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
      LEFT JOIN agent_profiles ap ON u.id = ap.user_id AND u.role = 'agent'
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) FROM users u ${whereClause}
    `;

    values.push(limit, offset);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, -2))
    ]);

    return {
      users: usersResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  /**
   * Get user details
   */
  static async getUserDetails(userId) {
    const query = `
      SELECT u.*,
        CASE 
          WHEN u.role = 'client' THEN
            json_build_object(
              'id', cp.id,
              'tier', cp.tier,
              'total_bookings', cp.total_bookings,
              'total_spent', cp.total_spent,
              'loyalty_points', cp.loyalty_points,
              'referral_code', cp.referral_code
            )
          WHEN u.role = 'agent' THEN
            json_build_object(
              'id', ap.id,
              'level', ap.level,
              'bio', ap.bio,
              'rating', ap.rating,
              'total_reviews', ap.total_reviews,
              'total_bookings', ap.total_bookings,
              'total_earnings', ap.total_earnings,
              'commission_rate', ap.commission_rate,
              'verified', ap.verified
            )
        END as profile
      FROM users u
      LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
      LEFT JOIN agent_profiles ap ON u.id = ap.user_id AND u.role = 'agent'
      WHERE u.id = \$1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Update user status
   */
  static async updateUserStatus(userId, status) {
    const query = `
      UPDATE users 
      SET status = \$1, updated_at = CURRENT_TIMESTAMP
      WHERE id = \$2
      RETURNING *
    `;

    const result = await pool.query(query, [status, userId]);
    return result.rows[0];
  }

  /**
   * Get bookings with filters
   */
  static async getBookings(filters) {
    const { page, limit, status, dateFrom, dateTo } = filters;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let values = [];
    let paramCount = 1;

    if (status) {
      whereConditions.push(`b.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (dateFrom) {
      whereConditions.push(`b.scheduled_date >= $${paramCount}`);
      values.push(dateFrom);
      paramCount++;
    }

    if (dateTo) {
      whereConditions.push(`b.scheduled_date <= $${paramCount}`);
      values.push(dateTo);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const query = `
      SELECT b.*,
        json_build_object(
          'first_name', uc.first_name,
          'last_name', uc.last_name,
          'email', uc.email
        ) as client,
        CASE WHEN b.agent_id IS NOT NULL THEN
          json_build_object(
            'first_name', ua.first_name,
            'last_name', ua.last_name,
            'email', ua.email
          )
        ELSE NULL END as agent
      FROM bookings b
      JOIN client_profiles cp ON b.client_id = cp.id
      JOIN users uc ON cp.user_id = uc.id
      LEFT JOIN agent_profiles ap ON b.agent_id = ap.id
      LEFT JOIN users ua ON ap.user_id = ua.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) FROM bookings b ${whereClause}
    `;

    values.push(limit, offset);

    const [bookingsResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, -2))
    ]);

    return {
      bookings: bookingsResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  /**
   * Get wash prices
   */
  static async getWashPrices() {
    const query = `
      SELECT * FROM wash_prices
      ORDER BY 
        CASE wash_type
          WHEN 'exterior' THEN 1
          WHEN 'classic' THEN 2
          WHEN 'deep' THEN 3
        END
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Update wash price
   */
  static async updateWashPrice(id, updateData) {
    const { basePrice, durationMinutes, description, features } = updateData;

    const query = `
      UPDATE wash_prices
      SET base_price = \$1,
          duration_minutes = \$2,
          description = \$3,
          features = \$4
      WHERE id = \$5
      RETURNING *
    `;

    const values = [
      basePrice,
      durationMinutes,
      description,
      JSON.stringify(features)
    , id];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get commission rates
   */
  static async getCommissionRates() {
    const query = `
      SELECT ap.*, u.first_name, u.last_name, u.email
      FROM agent_profiles ap
      JOIN users u ON ap.user_id = u.id
      ORDER BY ap.commission_rate DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Update agent commission
   */
  static async updateAgentCommission(agentId, commissionRate) {
    const query = `
      UPDATE agent_profiles
      SET commission_rate = \$1
      WHERE id = \$2
      RETURNING *
    `;

    const result = await pool.query(query, [commissionRate, agentId]);
    return result.rows[0];
  }

  /**
   * Get promo codes
   */
  static async getPromoCodes() {
    const query = `
      SELECT * FROM promo_codes
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Create promo code
   */
  static async createPromoCode(promoData) {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxUses,
      validFrom,
      validUntil
    } = promoData;

    const query = `
      INSERT INTO promo_codes (
        code, description, discount_type, discount_value,
        min_purchase, max_uses, valid_from, valid_until
      )
      VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8)
      RETURNING *
    `;

    const values = [
      code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minPurchase || null,
      maxUses || null,
      validFrom || null,
      validUntil || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete promo code
   */
  static async deletePromoCode(id) {
    const query = 'DELETE FROM promo_codes WHERE id = \$1';
    await pool.query(query, [id]);
  }

  /**
   * Get system settings
   */
  static async getSettings() {
    const query = 'SELECT * FROM settings';
    const result = await pool.query(query);
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    return settings;
  }

  /**
   * Update settings
   */
  static async updateSettings(settings) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const [key, value] of Object.entries(settings)) {
        await client.query(
          `INSERT INTO settings (key, value)
           VALUES (\$1, \$2)
           ON CONFLICT (key) DO UPDATE SET value = \$2, updated_at = CURRENT_TIMESTAMP`,
          [key, value.toString()]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get revenue report
   */
  static async getRevenueReport(options) {
    const { period, year, month } = options;

    let dateFilter = '';
    let groupBy = '';

    switch (period) {
      case 'day':
        dateFilter = `WHERE EXTRACT(YEAR FROM payment_date) = ${year} 
                      AND EXTRACT(MONTH FROM payment_date) = ${month}`;
        groupBy = `DATE(payment_date)`;
        break;
      case 'month':
        dateFilter = year ? `WHERE EXTRACT(YEAR FROM payment_date) = ${year}` : '';
        groupBy = `TO_CHAR(payment_date, 'YYYY-MM')`;
        break;
      case 'year':
        groupBy = `EXTRACT(YEAR FROM payment_date)`;
        break;
    }

    const query = `
      SELECT 
        ${groupBy} as period,
        COUNT(*) as total_payments,
        SUM(amount) as total_revenue,
        AVG(amount) as average_payment
      FROM payments
      WHERE status = 'completed'
      ${dateFilter}
      GROUP BY ${groupBy}
      ORDER BY period DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get agents report
   */
  static async getAgentsReport(period = 'month') {
    let dateFilter;
    
    switch (period) {
      case 'week':
        dateFilter = `AND b.completed_at >= CURRENT_DATE - INTERVAL '7 days'`;
        break;
      case 'month':
        dateFilter = `AND b.completed_at >= CURRENT_DATE - INTERVAL '30 days'`;
        break;
      case 'year':
        dateFilter = `AND b.completed_at >= CURRENT_DATE - INTERVAL '1 year'`;
        break;
      default:
        dateFilter = '';
    }

    const query = `
      SELECT 
        ap.id,
        u.first_name,
        u.last_name,
        ap.level,
        ap.rating,
        COUNT(b.id) as completed_bookings,
        SUM(b.agent_earnings) as total_earnings,
        AVG(r.rating) as avg_rating,
        COUNT(r.id) as total_reviews
      FROM agent_profiles ap
      JOIN users u ON ap.user_id = u.id
      LEFT JOIN bookings b ON ap.id = b.agent_id 
        AND b.status = 'completed'
        ${dateFilter}
      LEFT JOIN reviews r ON ap.id = r.agent_id
      GROUP BY ap.id, u.id
      ORDER BY completed_bookings DESC
      LIMIT 50
    `;

    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Admin;