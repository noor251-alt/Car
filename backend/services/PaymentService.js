// backend/services/PaymentService.js
const axios = require('axios');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.paymeeUrl = process.env.PAYMEE_URL;
    this.paymeeToken = process.env.PAYMEE_TOKEN;
  }

  /**
   * Create payment with Paymee
   */
  async createPayment(paymentData) {
    try {
      const {
        amount,
        bookingId,
        subscriptionId,
        clientId,
        type = 'booking',
        returnUrl,
        cancelUrl
      } = paymentData;

      const payload = {
        vendor: this.paymeeToken,
        amount: amount * 1000, // Paymee uses millimes
        note: type === 'subscription' ? 'Abonnement CarCare Premium' : `Réservation #${bookingId}`,
        first_name: paymentData.firstName || '',
        last_name: paymentData.lastName || '',
        email: paymentData.email || '',
        phone: paymentData.phone || '',
        return_url: returnUrl,
        cancel_url: cancelUrl,
        webhook_url: `${process.env.API_URL}/api/payments/callback/paymee`,
        order_id: bookingId || subscriptionId || `SUB-${Date.now()}`
      };

      const response = await axios.post(
        `${this.paymeeUrl}/api/v1/payments/create`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${this.paymeeToken}`
          }
        }
      );

      if (response.data.status) {
        logger.info(`Payment created: ${response.data.data.token}`);
        
        return {
          success: true,
          token: response.data.data.token,
          url: response.data.data.payment_url,
          orderId: response.data.data.order_id
        };
      } else {
        throw new Error(response.data.message || 'Erreur Paymee');
      }
    } catch (error) {
      logger.error('Paymee create payment error:', error.response?.data || error.message);
      throw new Error('Erreur lors de la création du paiement');
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(token) {
    try {
      const response = await axios.get(
        `${this.paymeeUrl}/api/v1/payments/${token}/check`,
        {
          headers: {
            'Authorization': `Token ${this.paymeeToken}`
          }
        }
      );

      if (response.data.status) {
        const paymentData = response.data.data;
        
        logger.info(`Payment verified: ${token} - Status: ${paymentData.payment_status}`);

        return {
          status: paymentData.payment_status === 'paid' ? 'success' : 'pending',
          amount: paymentData.amount / 1000, // Convert back to dinars
          transactionId: paymentData.transaction_id,
          orderId: paymentData.order_id,
          paymentDate: paymentData.payment_date,
          details: paymentData
        };
      } else {
        throw new Error('Paiement non trouvé');
      }
    } catch (error) {
      logger.error('Paymee verify payment error:', error.response?.data || error.message);
      throw new Error('Erreur lors de la vérification du paiement');
    }
  }

  /**
   * Process refund
   */
  async refundPayment(token, amount, reason) {
    try {
      const payload = {
        token: token,
        amount: amount * 1000, // Convert to millimes
        reason: reason
      };

      const response = await axios.post(
        `${this.paymeeUrl}/api/v1/payments/refund`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${this.paymeeToken}`
          }
        }
      );

      if (response.data.status) {
        logger.info(`Refund processed: ${token}`);
        
        return {
          success: true,
          refundId: response.data.data.refund_id,
          amount: amount,
          status: response.data.data.status
        };
      } else {
        throw new Error(response.data.message || 'Erreur de remboursement');
      }
    } catch (error) {
      logger.error('Paymee refund error:', error.response?.data || error.message);
      throw new Error('Erreur lors du remboursement');
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(token) {
    try {
      const response = await axios.get(
        `${this.paymeeUrl}/api/v1/payments/${token}`,
        {
          headers: {
            'Authorization': `Token ${this.paymeeToken}`
          }
        }
      );

      if (response.data.status) {
        return response.data.data;
      } else {
        throw new Error('Paiement non trouvé');
      }
    } catch (error) {
      logger.error('Get payment details error:', error.response?.data || error.message);
      throw new Error('Erreur lors de la récupération des détails');
    }
  }

  /**
   * Calculate fees
   */
  calculateFees(amount) {
    // Paymee fees: typically around 2.5% + fixed fee
    const percentageFee = amount * 0.025;
    const fixedFee = 0.3; // 300 millimes = 0.3 TND
    return percentageFee + fixedFee;
  }
}

module.exports = new PaymentService();