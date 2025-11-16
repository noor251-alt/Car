// backend/services/EmailService.js
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: `"CarCare" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);

      return info;
    } catch (error) {
      logger.error('Send email error:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email');
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    const subject = 'Bienvenue sur CarCare ! 🚗';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Bienvenue sur CarCare</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Bonjour ${user.firstName} ${user.lastName} !</h2>
          
          <p>Nous sommes ravis de vous accueillir sur CarCare, votre service de lavage automobile à domicile.</p>
          
          ${user.role === 'client' ? `
            <h3>Avec CarCare, vous pouvez :</h3>
            <ul>
              <li>Réserver un lavage en quelques clics</li>
              <li>Suivre l'agent en temps réel</li>
              <li>Profiter d'un abonnement premium avantageux</li>
              <li>Parrainer vos amis et gagner des réductions</li>
            </ul>
            
            <p>Votre code de parrainage : <strong>${user.referralCode}</strong></p>
          ` : `
            <h3>Commencez dès maintenant :</h3>
            <ul>
              <li>Complétez votre profil agent</li>
              <li>Activez votre disponibilité</li>
              <li>Acceptez vos premières missions</li>
              <li>Gagnez de l'argent en toute flexibilité</li>
            </ul>
          `}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}" 
               style="background: #667eea; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Ouvrir l'application
            </a>
          </div>
          
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          
          <p>À bientôt !<br>L'équipe CarCare</p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 CarCare. Tous droits réservés.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send booking confirmation
   */
  async sendBookingConfirmation(booking, client) {
    const subject = `Confirmation de réservation #${booking.booking_number}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #667eea; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Réservation confirmée ✓</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Bonjour ${client.firstName},</h2>
          
          <p>Votre réservation a été confirmée avec succès !</p>
          
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3>Détails de la réservation</h3>
            <p><strong>Numéro :</strong> ${booking.booking_number}</p>
            <p><strong>Type de lavage :</strong> ${this.getWashTypeName(booking.wash_type)}</p>
            <p><strong>Date :</strong> ${new Date(booking.scheduled_date).toLocaleDateString('fr-FR')}</p>
            <p><strong>Heure :</strong> ${booking.scheduled_time}</p>
            <p><strong>Adresse :</strong> ${booking.address.address_line1}, ${booking.address.city}</p>
            <p><strong>Véhicule :</strong> ${booking.vehicle.make} ${booking.vehicle.model}</p>
            <p><strong>Prix :</strong> ${booking.price} TND</p>
          </div>
          
          <p>Un agent sera bientôt assigné à votre réservation. Vous recevrez une notification.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}/bookings/${booking.id}" 
               style="background: #667eea; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Voir ma réservation
            </a>
          </div>
          
          <p>Merci de votre confiance !<br>L'équipe CarCare</p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 CarCare. Tous droits réservés.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(client.email, subject, html);
  }

  /**
   * Send payment receipt
   */
  async sendPaymentReceipt(payment, client, booking) {
    const subject = `Reçu de paiement - ${payment.transaction_id}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Paiement confirmé ✓</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Reçu de paiement</h2>
          
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Transaction ID :</strong> ${payment.transaction_id}</p>
            <p><strong>Date :</strong> ${new Date(payment.payment_date).toLocaleString('fr-FR')}</p>
            <p><strong>Montant :</strong> ${payment.amount} TND</p>
            <p><strong>Méthode :</strong> ${payment.payment_method}</p>
            <p><strong>Statut :</strong> <span style="color: #10b981;">Payé</span></p>
          </div>
          
          ${booking ? `
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3>Détails de la réservation</h3>
              <p><strong>Numéro :</strong> ${booking.booking_number}</p>
              <p><strong>Type :</strong> ${this.getWashTypeName(booking.wash_type)}</p>
              <p><strong>Date :</strong> ${new Date(booking.scheduled_date).toLocaleDateString('fr-FR')}</p>
            </div>
          ` : ''}
          
          <p>Conservez ce reçu pour vos dossiers.</p>
          
          <p>Merci !<br>L'équipe CarCare</p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 CarCare. Tous droits réservés.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(client.email, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(user, resetToken) {
    const subject = 'Réinitialisation de votre mot de passe';
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #667eea; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Réinitialisation du mot de passe</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Bonjour ${user.firstName},</h2>
          
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          
          <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #667eea; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          
          <p>Ce lien est valable pendant 1 heure.</p>
          
          <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          
          <p>L'équipe CarCare</p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 CarCare. Tous droits réservés.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  getWashTypeName(type) {
    const types = {
      exterior: 'Lavage Extérieur',
      classic: 'Lavage Classique',
      deep: 'Lavage Profondeur'
    };
    return types[type] || type;
  }
}

module.exports = new EmailService();