// backend/models/Payment.js
const { pool } = require('../config/database');
const logger = require('../utils/logger');

class Payment {
  /**
   * Create payment record
   */
  static async create(paymentData) {
    const {
      bookingId,
      subscriptionId,
      clientId,
      amount,
      paymentMethod,
      paymeeToken,
      status = 'pending'
    } = paymentData;

    const query = `
      INSERT INTO payments (
        booking_id, subscription_id, client_id, amount,
        payment_method, paymee_token, status
      )
      VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7)
      RETURNING *
    `;

    const values = [
      bookingId || null,
      subscriptionId || null,
      clientId,
      amount,
      paymentMethod,
      paymeeToken,
      status
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update payment by token
   */
  static async updateByToken(token, updateData) {
    const { status, transactionId, paymentDate } = updateData;

    const query = `
      UPDATE payments
      SET status = \$1,
          transaction_id = \$2,
          payment_date = \$3
      WHERE paymee_token = \$4
      RETURNING *
    `;

    const values = [status, transactionId, paymentDate, token];
    const result = await pool.query(query, values);

    return result.rows[0];
  }

  /**
   * Get booking for payment
   */
  static async getBookingForPayment(bookingId) {
    const query = `
      SELECT b.*, cp.id as client_profile_id
      FROM bookings b
      JOIN client_profiles cp ON b.client_id = cp.id
      WHERE b.id = \$1
    `;

    const result = await pool.query(query, [bookingId]);
    return result.rows[0];
  }

  /**
   * Process booking payment
   */
  static async processBookingPayment(payment) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update booking payment status
      await client.query(
        `UPDATE bookings SET payment_status = 'paid' WHERE id = $1`,
        [payment.booking_id]
      );

      // Add loyalty points
      const points = Math.floor(payment.amount);
      await client.query(
        `UPDATE client_profiles 
         SET loyalty_points = loyalty_points + \$1
         WHERE id = $2`,
        [points, payment.client_id]
      );

      await client.query('COMMIT');
      
      logger.info(`Booking payment processed: ${payment.id}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process subscription payment
   */
  static async processSubscriptionPayment(payment) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create or renew subscription
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const subscriptionQuery = `
        INSERT INTO subscriptions (
          client_id, start_date, end_date, monthly_washes,
          washes_used, price, status
        )
        VALUES (\$1, \$2, \$3, 4, 0, \$4, 'active')
        ON CONFLICT (client_id) 
        WHERE status = 'active'
        DO UPDATE SET
          start_date = \$2,
          end_date = \$3,
          washes_used = 0,
          status = 'active'
        RETURNING *
      `;

      const subscription = await client.query(subscriptionQuery, [
        payment.client_id,
        startDate,
        endDate,
        payment.amount
      ]);

      // Link payment to subscription
      await client.query(
        `UPDATE payments SET subscription_id = \$1 WHERE id = $2`,
        [subscription.rows[0].id, payment.id]
      );

      await client.query('COMMIT');
      
      logger.info(`Subscription payment processed: ${payment.id}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get client payments
   */
  static async getClientPayments(clientId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const query = `
      SELECT p.*,
        CASE 
          WHEN p.booking_id IS NOT NULL THEN
            json_build_object(
              'booking_number', b.booking_number,
              'wash_type', b.wash_type,
              'scheduled_date', b.scheduled_date
            )
          ELSE NULL
        END as booking_details
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      WHERE p.client_id = \$1
      ORDER BY p.created_at DESC
      LIMIT \$2 OFFSET \$3
    `;

    const countQuery = `
      SELECT COUNT(*) FROM payments WHERE client_id = \$1
    `;

    const [paymentsResult, countResult] = await Promise.all([
      pool.query(query, [clientId, limit, offset]),
      pool.query(countQuery, [clientId])
    ]);

    return {
      payments: paymentsResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  /**
   * Verify promo code
   */
  static async verifyPromoCode(code) {
    const query = `
      SELECT * FROM promo_codes
      WHERE code = \$1
        AND is_active = true
        AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
        AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
        AND (max_uses IS NULL OR times_used < max_uses)
    `;

    const result = await pool.query(query, [code.toUpperCase()]);
    return result.rows[0];
  }

  /**
   * Apply promo code
   */
  static async applyPromoCode(code, amount) {
    const promo = await this.verifyPromoCode(code);

    if (!promo) {
      throw new Error('Code promo invalide ou expiré');
    }

    if (promo.min_purchase && amount < promo.min_purchase) {
      throw new Error(`Montant minimum requis: ${promo.min_purchase} TND`);
    }

    const discount = this.calculateDiscount(promo, amount);

    // Increment usage
    await pool.query(
      'UPDATE promo_codes SET times_used = times_used + 1 WHERE id = \$1',
      [promo.id]
    );

    return discount;
  }

  /**
   * Calculate discount
   */
  static calculateDiscount(promo, amount) {
    if (promo.discount_type === 'percentage') {
      return (amount * promo.discount_value) / 100;
    } else {
      return Math.min(promo.discount_value, amount);
    }
  }

  /**
   * Get payment by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM payments WHERE id = \$1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get payment statistics
   */
  static async getStatistics(period = 'month') {
    let dateFilter;
    
    switch (period) {
      case 'today':
        dateFilter = 'CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'CURRENT_DATE - INTERVAL \'30 days\'';
        break;
      case 'year':
        dateFilter = 'CURRENT_DATE - INTERVAL \'1 year\'';
        break;
      default:
        dateFilter = 'CURRENT_DATE - INTERVAL \'30 days\'';
    }

    const query = `
      SELECT
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments
      FROM payments
      WHERE created_at >= ${dateFilter}
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = Payment;