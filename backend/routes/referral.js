// backend/routes/referral.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const db = require('../config/database');
const crypto = require('crypto');

/**
 * Generate unique referral code
 */
function generateReferralCode() {
  return 'CC' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * @route   GET /api/referral/data
 * @desc    Get user referral data
 * @access  Private
 */
router.get('/data', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's referral code
    let [users] = await db.query(
      'SELECT referral_code, has_used_referral FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    let user = users[0];

    // Generate referral code if not exists
    if (!user.referral_code) {
      const referralCode = generateReferralCode();
      await db.query(
        'UPDATE users SET referral_code = ? WHERE id = ?',
        [referralCode, userId]
      );
      user.referral_code = referralCode;
    }

    // Get referral statistics
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_referrals,
        SUM(CASE WHEN status = 'completed' THEN reward_amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN status = 'completed' AND is_used = 0 THEN reward_amount ELSE 0 END) as available_credit
      FROM referrals
      WHERE referrer_id = ?`,
      [userId]
    );

    // Get recent referrals
    const [referrals] = await db.query(
      `SELECT 
        r.*,
        CONCAT(u.first_name, ' ', u.last_name) as referred_user_name
      FROM referrals r
      JOIN users u ON r.referred_id = u.id
      WHERE r.referrer_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10`,
      [userId]
    );

    res.json({
      referral_code: user.referral_code,
      has_used_referral: user.has_used_referral,
      total_referrals: stats[0].total_referrals || 0,
      total_earned: stats[0].total_earned || 0,
      available_credit: stats[0].available_credit || 0,
      referrals: referrals,
    });
  } catch (error) {
    console.error('Get referral data error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/referral/apply
 * @desc    Apply referral code
 * @access  Private
 */
router.post(
  '/apply',
  [
    auth,
    body('code').notEmpty().trim().toUpperCase(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { code } = req.body;
      const userId = req.user.id;

      // Check if user has already used a referral code
      const [currentUser] = await db.query(
        'SELECT has_used_referral FROM users WHERE id = ?',
        [userId]
      );

      if (currentUser[0].has_used_referral) {
        return res.status(400).json({
          message: 'Vous avez déjà utilisé un code de parrainage',
        });
      }

      // Find referrer by code
      const [referrer] = await db.query(
        'SELECT id FROM users WHERE referral_code = ? AND id != ?',
        [code, userId]
      );

      if (referrer.length === 0) {
        return res.status(404).json({
          message: 'Code de parrainage invalide',
        });
      }

      const referrerId = referrer[0].id;

      // Create referral record
      await db.query(
        `INSERT INTO referrals (
          referrer_id, referred_id, reward_amount, status
        ) VALUES (?, ?, ?, ?)`,
        [referrerId, userId, 10, 'pending']
      );

      // Mark user as having used referral
      await db.query(
        'UPDATE users SET has_used_referral = 1 WHERE id = ?',
        [userId]
      );

      // Add credit to both users (pending until first booking)
      await db.query(
        `INSERT INTO user_credits (user_id, amount, type, status, description)
        VALUES 
        (?, 10, 'referral_bonus', 'pending', 'Bonus de bienvenue'),
        (?, 10, 'referral_reward', 'pending', 'Récompense de parrainage')`,
        [userId, referrerId]
      );

      // Send notifications
      // TODO: Implement notification service

      res.json({
        success: true,
        message: 'Code de parrainage appliqué avec succès',
      });
    } catch (error) {
      console.error('Apply referral code error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * @route   GET /api/referral/history
 * @desc    Get referral history
 * @access  Private
 */
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const [referrals] = await db.query(
      `SELECT 
        r.*,
        CONCAT(u.first_name, ' ', u.last_name) as referred_user_name,
        u.created_at as user_joined_date
      FROM referrals r
      JOIN users u ON r.referred_id = u.id
      WHERE r.referrer_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [total] = await db.query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?',
      [userId]
    );

    res.json({
      referrals: referrals,
      pagination: {
        page: page,
        limit: limit,
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Get referral history error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Complete referral when referred user makes first booking
 */
async function completeReferral(userId) {
  try {
    // Find pending referral for this user
    const [referrals] = await db.query(
      'SELECT * FROM referrals WHERE referred_id = ? AND status = ?',
      [userId, 'pending']
    );

    if (referrals.length === 0) {
      return;
    }

    const referral = referrals[0];

    // Update referral status
    await db.query(
      'UPDATE referrals SET status = ?, completed_at = NOW() WHERE id = ?',
      ['completed', referral.id]
    );

    // Activate credits
    await db.query(
      `UPDATE user_credits 
      SET status = 'active' 
      WHERE user_id IN (?, ?) 
      AND type IN ('referral_bonus', 'referral_reward') 
      AND status = 'pending'`,
      [userId, referral.referrer_id]
    );

    return true;
  } catch (error) {
    console.error('Complete referral error:', error);
    return false;
  }
}

module.exports = router;
module.exports.completeReferral = completeReferral;