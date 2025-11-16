// backend/services/earningsCalculator.js
const db = require('../config/database');
const { createNotification } = require('./pushNotifications');
const logger = require('../utils/logger');

class EarningsCalculator {
  /**
   * Calculate earnings for completed booking
   */
  async calculateBookingEarnings(bookingId) {
    try {
      const [bookings] = await db.query(
        'SELECT * FROM bookings WHERE id = ?',
        [bookingId]
      );

      if (bookings.length === 0) {
        throw new Error('Booking not found');
      }

      const booking = bookings[0];

      // Get commission rate
      const [settings] = await db.query(
        'SELECT value FROM settings WHERE `key` = "agent_commission_rate"'
      );

      const commissionRate = settings.length > 0 
        ? parseFloat(settings[0].value) 
        : 0.70;

      const agentEarnings = booking.price * commissionRate;
      const platformEarnings = booking.price * (1 - commissionRate);

      return {
        agentEarnings: parseFloat(agentEarnings.toFixed(2)),
        platformEarnings: parseFloat(platformEarnings.toFixed(2)),
        commissionRate: commissionRate,
      };
    } catch (error) {
      console.error('Calculate booking earnings error:', error);
      throw error;
    }
  }

  /**
   * Process weekly payouts
   */
  async processWeeklyPayouts() {
    try {
      // Get all agents with pending earnings
      const [agents] = await db.query(
        `SELECT 
          agent_id,
          SUM(amount) as total_amount,
          COUNT(*) as booking_count
        FROM agent_earnings
        WHERE status = 'pending'
        AND YEARWEEK(created_at) < YEARWEEK(NOW())
        GROUP BY agent_id
        HAVING total_amount > 0`
      );

      for (const agent of agents) {
        // Create payout record
        const [result] = await db.query(
          `INSERT INTO payouts 
          (agent_id, amount, booking_count, status, period_start, period_end)
          SELECT 
            agent_id,
            SUM(amount),
            COUNT(*),
            'pending',
            MIN(created_at),
            MAX(created_at)
          FROM agent_earnings
          WHERE agent_id = ? 
          AND status = 'pending'
          AND YEARWEEK(created_at) < YEARWEEK(NOW())`,
          [agent.agent_id]
        );

        const payoutId = result.insertId;

        // Update earnings status
        await db.query(
          `UPDATE agent_earnings 
          SET status = 'processing',
              payout_id = ?
          WHERE agent_id = ? 
          AND status = 'pending'
          AND YEARWEEK(created_at) < YEARWEEK(NOW())`,
          [payoutId, agent.agent_id]
        );

        // Notify agent
        await createNotification(
          agent.agent_id,
          'payout_processing',
          `Votre paiement de ${agent.total_amount.toFixed(2)} TND est en cours de traitement`,
          {
            payout_id: payoutId,
            amount: agent.total_amount,
          }
        );
      }

      logger.info(`Versements traités pour ${agents.length} agents`);
      return agents.length;
    } catch (error) {
      console.error('Process weekly payouts error:', error);
      throw error;
    }
  }

  /**
   * Get agent earnings summary
   */
  async getAgentEarningsSummary(agentId, startDate, endDate) {
    try {
      const [summary] = await db.query(
        `SELECT 
          COUNT(*) as total_bookings,
          SUM(amount) as total_earnings,
          AVG(amount) as avg_earnings,
          MIN(amount) as min_earnings,
          MAX(amount) as max_earnings,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
        FROM agent_earnings
        WHERE agent_id = ?
        AND created_at BETWEEN ? AND ?`,
        [agentId, startDate, endDate]
      );

      return summary[0];
    } catch (error) {
      console.error('Get agent earnings summary error:', error);
      throw error;
    }
  }
}

module.exports = new EarningsCalculator();