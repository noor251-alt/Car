// backend/routes/payments.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const paymeeService = require('../services/paymee');
const db = require('../config/database');

/**
 * @route   POST /api/payments/initiate
 * @desc    Initiate payment
 * @access  Private
 */
router.post(
  '/initiate',
  [
    auth,
    body('type').isIn(['booking', 'subscription']),
    body('method').isIn(['paymee', 'd17', 'cash']),
    body('amount').isFloat({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, method, amount, bookingId, plan } = req.body;
      const userId = req.user.id;

      // Get user details
      const [users] = await db.query(
        'SELECT first_name, last_name, email, phone FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      const user = users[0];

      // Create payment record
      const orderId = `${type.toUpperCase()}-${Date.now()}-${userId}`;

      const [paymentResult] = await db.query(
        `INSERT INTO payments (
          user_id, booking_id, subscription_plan, 
          amount, payment_method, status, order_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          type === 'booking' ? bookingId : null,
          type === 'subscription' ? plan : null,
          amount,
          method,
          'pending',
          orderId,
        ]
      );

      const paymentId = paymentResult.insertId;

      if (method === 'cash') {
        // Update booking payment status to pending (will be paid to agent)
        if (type === 'booking' && bookingId) {
          await db.query(
            'UPDATE bookings SET payment_status = ? WHERE id = ?',
            ['pending', bookingId]
          );
        }

        return res.json({
          success: true,
          message: 'Paiement en espèces confirmé',
        });
      }

      // Paymee or D17 payment
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

      const paymentData = {
        description: `CarCare - ${type === 'booking' ? 'Réservation' : 'Abonnement'}`,
        amount: amount,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        orderId: orderId,
        returnUrl: `${baseUrl}/api/payments/callback/success/${paymentId}`,
        cancelUrl: `${baseUrl}/api/payments/callback/cancel/${paymentId}`,
        webhookUrl: `${baseUrl}/api/payments/webhook`,
      };

      let paymentResponse;

      if (method === 'paymee') {
        paymentResponse = await paymeeService.initiatePayment(paymentData);
      } else if (method === 'd17') {
        // Implement D17 payment logic
        // Similar to Paymee
      }

      // Update payment record with payment token
      await db.query(
        'UPDATE payments SET payment_token = ? WHERE id = ?',
        [paymentResponse.token, paymentId]
      );

      res.json({
        success: true,
        paymentUrl: paymentResponse.payment_url,
        paymentToken: paymentResponse.token,
      });
    } catch (error) {
      console.error('Initiate payment error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * @route   GET /api/payments/callback/success/:paymentId
 * @desc    Payment success callback
 * @access  Public
 */
router.get('/callback/success/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { token } = req.query;

    // Get payment details
    const [payments] = await db.query(
      'SELECT * FROM payments WHERE id = ?',
      [paymentId]
    );

    if (payments.length === 0) {
      return res.redirect(`carcare://payment/failure`);
    }

    const payment = payments[0];

    // Verify payment with Paymee
    const paymentStatus = await paymeeService.checkPaymentStatus(token);

    if (paymentStatus.data.status === 'paid') {
      // Update payment status
      await db.query(
        'UPDATE payments SET status = ?, paid_at = NOW() WHERE id = ?',
        ['completed', paymentId]
      );

      // Update booking or subscription
      if (payment.booking_id) {
        await db.query(
          'UPDATE bookings SET payment_status = ? WHERE id = ?',
          ['paid', payment.booking_id]
        );
      } else if (payment.subscription_plan) {
        // Create or update subscription
        await createSubscription(payment.user_id, payment.subscription_plan);
      }

      // Redirect to success page in app
      res.redirect(`carcare://payment/success?paymentId=${paymentId}`);
    } else {
      res.redirect(`carcare://payment/failure`);
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    res.redirect(`carcare://payment/failure`);
  }
});

/**
 * @route   GET /api/payments/callback/cancel/:paymentId
 * @desc    Payment cancel callback
 * @access  Public
 */
router.get('/callback/cancel/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    await db.query(
      'UPDATE payments SET status = ? WHERE id = ?',
      ['cancelled', paymentId]
    );

    res.redirect(`carcare://payment/cancel`);
  } catch (error) {
    console.error('Payment cancel error:', error);
    res.redirect(`carcare://payment/failure`);
  }
});

/**
 * @route   POST /api/payments/webhook
 * @desc    Payment webhook from Paymee
 * @access  Public
 */
router.post('/webhook', async (req, res) => {
  try {
    const { payment_token, status } = req.body;

    // Find payment by token
    const [payments] = await db.query(
      'SELECT * FROM payments WHERE payment_token = ?',
      [payment_token]
    );

    if (payments.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = payments[0];

    // Update payment status
    const paymentStatus = status === 'paid' ? 'completed' : 'failed';
    await db.query(
      'UPDATE payments SET status = ?, paid_at = NOW() WHERE id = ?',
      [paymentStatus, payment.id]
    );

    if (status === 'paid') {
      // Update booking or subscription
      if (payment.booking_id) {
        await db.query(
          'UPDATE bookings SET payment_status = ? WHERE id = ?',
          ['paid', payment.booking_id]
        );
      } else if (payment.subscription_plan) {
        await createSubscription(payment.user_id, payment.subscription_plan);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/payments/history
 * @desc    Get user payment history
 * @access  Private
 */
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [payments] = await db.query(
      `SELECT 
        p.*,
        b.booking_number,
        b.wash_type
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json({ payments });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Helper function to create subscription
async function createSubscription(userId, plan) {
  const plans = {
    monthly: { washes: 4, duration: 1, price: 80 },
    quarterly: { washes: 12, duration: 3, price: 210 },
    annual: { washes: 48, duration: 12, price: 720 },
  };

  const planDetails = plans[plan];
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + planDetails.duration);

  const [result] = await db.query(
    `INSERT INTO subscriptions (
      user_id, plan, monthly_washes, washes_remaining,
      start_date, next_billing_date, status
    ) VALUES (?, ?, ?, ?, NOW(), ?, ?)
    ON DUPLICATE KEY UPDATE
      plan = VALUES(plan),
      monthly_washes = VALUES(monthly_washes),
      washes_remaining = washes_remaining + VALUES(washes_remaining),
      next_billing_date = VALUES(next_billing_date),
      status = VALUES(status)`,
    [userId, plan, planDetails.washes, planDetails.washes, endDate, 'active']
  );

  return result;
}

module.exports = router;