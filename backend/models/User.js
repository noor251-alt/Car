// backend/models/User.js
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { email, phone, password, firstName, lastName, role } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (email, phone, password_hash, first_name, last_name, role)
      VALUES (\$1, \$2, \$3, \$4, \$5, \$6)
      RETURNING id, email, phone, first_name, last_name, role, created_at
    `;
    
    const values = [email, phone, hashedPassword, firstName, lastName, role];
    const result = await pool.query(query, values);
    
    // Create profile based on role
    if (role === 'client') {
      await this.createClientProfile(result.rows[0].id);
    } else if (role === 'agent') {
      await this.createAgentProfile(result.rows[0].id);
    }
    
    return result.rows[0];
  }

  static async createClientProfile(userId) {
    const referralCode = this.generateReferralCode();
    const query = `
      INSERT INTO client_profiles (user_id, referral_code)
      VALUES (\$1, \$2)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, referralCode]);
    return result.rows[0];
  }

  static async createAgentProfile(userId) {
    const query = `
      INSERT INTO agent_profiles (user_id)
      VALUES (\$1)
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = \$1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT u.*, 
        CASE 
          WHEN u.role = 'client' THEN json_build_object(
            'id', cp.id,
            'tier', cp.tier,
            'total_bookings', cp.total_bookings,
            'loyalty_points', cp.loyalty_points,
            'referral_code', cp.referral_code
          )
          WHEN u.role = 'agent' THEN json_build_object(
            'id', ap.id,
            'level', ap.level,
            'rating', ap.rating,
            'total_reviews', ap.total_reviews,
            'availability_status', ap.availability_status
          )
        END as profile
      FROM users u
      LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
      LEFT JOIN agent_profiles ap ON u.id = ap.user_id AND u.role = 'agent'
      WHERE u.id = \$1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateFCMToken(userId, fcmToken) {
    const query = 'UPDATE users SET fcm_token = \$1 WHERE id = \$2';
    await pool.query(query, [fcmToken, userId]);
  }

  static generateReferralCode() {
    return 'CC' + Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  static async updateLastLogin(userId) {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = \$1';
    await pool.query(query, [userId]);
  }
  // backend/models/User.js - Méthodes supplémentaires à ajouter

// ... (code existant)

  /**
   * Update profile
   */
  static async updateProfile(userId, updateData) {
    const { firstName, lastName, phone } = updateData;

    const query = `
      UPDATE users
      SET first_name = COALESCE(\$1, first_name),
          last_name = COALESCE(\$2, last_name),
          phone = COALESCE(\$3, phone),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = \$4
      RETURNING *
    `;

    const result = await pool.query(query, [firstName, lastName, phone, userId]);
    return result.rows[0];
  }

  /**
   * Update profile image
   */
  static async updateProfileImage(userId, imageUrl) {
    const query = `
      UPDATE users
      SET profile_image = \$1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = \$2
      RETURNING *
    `;

    const result = await pool.query(query, [imageUrl, userId]);
    return result.rows[0];
  }

  /**
   * Update password
   */
  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const query = `
      UPDATE users
      SET password_hash = \$1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = \$2
    `;

    await pool.query(query, [hashedPassword, userId]);
  }

  /**
   * Get client profile
   */
  static async getClientProfile(userId) {
    const query = `
      SELECT cp.*, u.email, u.phone, u.first_name, u.last_name, u.profile_image,
        (SELECT COUNT(*) FROM vehicles WHERE client_id = cp.id) as vehicles_count,
        (SELECT COUNT(*) FROM addresses WHERE client_id = cp.id) as addresses_count,
        (SELECT COUNT(*) FROM subscriptions WHERE client_id = cp.id AND status = 'active') as has_subscription
      FROM client_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE u.id = \$1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Get vehicles
   */
  static async getVehicles(clientId) {
    const query = `
      SELECT * FROM vehicles
      WHERE client_id = \$1
      ORDER BY is_default DESC, created_at DESC
    `;

    const result = await pool.query(query, [clientId]);
    return result.rows;
  }

  /**
   * Add vehicle
   */
  static async addVehicle(clientId, vehicleData) {
    const { make, model, year, color, licensePlate, isDefault } = vehicleData;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // If this is default, unset other defaults
      if (isDefault) {
        await client.query(
          'UPDATE vehicles SET is_default = false WHERE client_id = \$1',
          [clientId]
        );
      }

      const query = `
        INSERT INTO vehicles (client_id, make, model, year, color, license_plate, is_default)
        VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7)
        RETURNING *
      `;

      const result = await client.query(query, [
        clientId, make, model, year, color, licensePlate, isDefault || false
      ]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update vehicle
   */
  static async updateVehicle(vehicleId, clientId, updateData) {
    const { make, model, year, color, licensePlate, isDefault } = updateData;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (isDefault) {
        await client.query(
          'UPDATE vehicles SET is_default = false WHERE client_id = \$1',
          [clientId]
        );
      }

      const query = `
        UPDATE vehicles
        SET make = COALESCE(\$1, make),
            model = COALESCE(\$2, model),
            year = COALESCE(\$3, year),
            color = COALESCE(\$4, color),
            license_plate = COALESCE(\$5, license_plate),
            is_default = COALESCE(\$6, is_default)
        WHERE id = \$7 AND client_id = \$8
        RETURNING *
      `;

      const result = await client.query(query, [
        make, model, year, color, licensePlate, isDefault, vehicleId, clientId
      ]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete vehicle
   */
  static async deleteVehicle(vehicleId, clientId) {
    const query = 'DELETE FROM vehicles WHERE id = \$1 AND client_id = \$2';
    await pool.query(query, [vehicleId, clientId]);
  }

  /**
   * Get addresses
   */
  static async getAddresses(clientId) {
    const query = `
      SELECT * FROM addresses
      WHERE client_id = \$1
      ORDER BY is_default DESC, created_at DESC
    `;

    const result = await pool.query(query, [clientId]);
    return result.rows;
  }

  /**
   * Add address
   */
  static async addAddress(clientId, addressData) {
    const {
      label,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      latitude,
      longitude,
      isDefault
    } = addressData;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (isDefault) {
        await client.query(
          'UPDATE addresses SET is_default = false WHERE client_id = \$1',
          [clientId]
        );
      }

      const query = `
        INSERT INTO addresses (
          client_id, label, address_line1, address_line2, city,
          postal_code, latitude, longitude, is_default
        )
        VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9)
        RETURNING *
      `;

      const result = await client.query(query, [
        clientId, label, addressLine1, addressLine2, city,
        postalCode, latitude, longitude, isDefault || false
      ]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update address
   */
  static async updateAddress(addressId, clientId, updateData) {
    const { label, addressLine1, addressLine2, city, postalCode, isDefault } = updateData;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (isDefault) {
        await client.query(
          'UPDATE addresses SET is_default = false WHERE client_id = \$1',
          [clientId]
        );
      }

      const query = `
        UPDATE addresses
        SET label = COALESCE(\$1, label),
            address_line1 = COALESCE(\$2, address_line1),
            address_line2 = COALESCE(\$3, address_line2),
            city = COALESCE(\$4, city),
            postal_code = COALESCE(\$5, postal_code),
            is_default = COALESCE(\$6, is_default)
        WHERE id = \$7 AND client_id = \$8
        RETURNING *
      `;

      const result = await client.query(query, [
        label, addressLine1, addressLine2, city, postalCode,
        isDefault, addressId, clientId
      ]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete address
   */
  static async deleteAddress(addressId, clientId) {
    const query = 'DELETE FROM addresses WHERE id = \$1 AND client_id = \$2';
    await pool.query(query, [addressId, clientId]);
  }

  /**
   * Get referral data
   */
  static async getReferralData(clientId) {
    const query = `
      SELECT 
        cp.referral_code,
        (SELECT COUNT(*) FROM referrals WHERE referrer_id = cp.user_id) as total_referrals,
        (SELECT COUNT(*) FROM referrals WHERE referrer_id = cp.user_id AND is_claimed = true) as claimed_referrals,
        (SELECT COALESCE(SUM(bonus_amount), 0) FROM referrals WHERE referrer_id = cp.user_id AND is_claimed = true) as total_bonus
      FROM client_profiles cp
      WHERE cp.id = \$1
    `;

    const result = await pool.query(query, [clientId]);
    return result.rows[0];
  }

  /**
   * Handle referral
   */
  static async handleReferral(newUserId, referralCode) {
    const query = `
      INSERT INTO referrals (referrer_id, referred_id, bonus_amount)
      SELECT cp.user_id, \$1, \$2
      FROM client_profiles cp
      WHERE cp.referral_code = \$3
      RETURNING *
    `;

    const bonusAmount = parseFloat(process.env.REFERRAL_BONUS || 5);
    
    const result = await pool.query(query, [
      newUserId,
      bonusAmount,
      referralCode.toUpperCase()
    ]);

    return result.rows[0];
  }

  /**
   * Get active subscription
   */
  static async getActiveSubscription(clientId) {
    const query = `
      SELECT * FROM subscriptions
      WHERE client_id = \$1
        AND status = 'active'
        AND end_date >= CURRENT_DATE
      ORDER BY end_date DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [clientId]);
    return result.rows[0];
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(clientId) {
    const query = `
      UPDATE subscriptions
      SET status = 'cancelled',
          auto_renew = false,
          cancelled_at = CURRENT_TIMESTAMP
      WHERE client_id = \$1
        AND status = 'active'
    `;

    await pool.query(query, [clientId]);
  }

  /**
   * Get client profile ID
   */
  static async getClientProfileId(userId) {
    const query = 'SELECT id FROM client_profiles WHERE user_id = \$1';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Get agent profile ID
   */
  static async getAgentProfileId(userId) {
    const query = 'SELECT id FROM agent_profiles WHERE user_id = \$1';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

// Fin du fichier User.js
}

module.exports = User;