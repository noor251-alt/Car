-- ============================================
-- CarCare - Base de données complète
-- Version: 1.0
-- Date: 2025
-- ============================================

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS carcare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE carcare_db;

-- ============================================
-- TABLE: users
-- Description: Table principale des utilisateurs (clients, agents, admins)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('client', 'agent', 'admin') DEFAULT 'client',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  profile_image VARCHAR(500),
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  
  -- Status and verification
  status ENUM('active', 'inactive', 'suspended', 'available', 'busy', 'offline') DEFAULT 'active',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP NULL,
  verification_documents JSON,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  
  -- Location tracking (for agents)
  current_latitude DECIMAL(10, 8) NULL,
  current_longitude DECIMAL(11, 8) NULL,
  last_location_update TIMESTAMP NULL,
  
  -- Ratings and reviews
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  
  -- Financial
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  has_active_subscription BOOLEAN DEFAULT FALSE,
  
  -- Suspension info
  suspension_reason TEXT NULL,
  suspended_at TIMESTAMP NULL,
  suspended_by INT NULL,
  
  -- Security
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP NULL,
  last_login TIMESTAMP NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (suspended_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_rating (rating),
  INDEX idx_user_location (current_latitude, current_longitude),
  FULLTEXT INDEX idx_user_search (first_name, last_name, email, phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: addresses
-- Description: Adresses des utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  label VARCHAR(50), -- 'home', 'work', 'other'
  street_address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Tunisia',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_addresses (user_id),
  INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: vehicles
-- Description: Véhicules des clients
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  color VARCHAR(50),
  license_plate VARCHAR(50) UNIQUE,
  vehicle_type ENUM('sedan', 'suv', 'truck', 'van', 'sports', 'luxury') DEFAULT 'sedan',
  photos JSON, -- Array of photo URLs
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_vehicles (user_id),
  INDEX idx_license_plate (license_plate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: wash_types
-- Description: Types de lavage disponibles
-- ============================================
CREATE TABLE IF NOT EXISTS wash_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  duration_minutes INT NOT NULL, -- Durée estimée en minutes
  vehicle_multipliers JSON, -- Multiplicateurs de prix par type de véhicule
  features JSON, -- Liste des caractéristiques incluses
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_active (is_active),
  INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer les types de lavage par défaut
INSERT INTO wash_types (name, slug, description, base_price, duration_minutes, vehicle_multipliers, features, display_order) VALUES
('Lavage Extérieur Basique', 'basic_exterior', 'Lavage extérieur rapide et efficace', 15.00, 30, 
 '{"sedan": 1.0, "suv": 1.2, "truck": 1.3, "van": 1.3, "sports": 1.1, "luxury": 1.4}',
 '["Lavage de la carrosserie", "Nettoyage des vitres", "Séchage"]', 1),

('Lavage Extérieur Complet', 'complete_exterior', 'Lavage extérieur approfondi avec lustrage', 25.00, 45,
 '{"sedan": 1.0, "suv": 1.2, "truck": 1.3, "van": 1.3, "sports": 1.1, "luxury": 1.4}',
 '["Lavage de la carrosserie", "Nettoyage des vitres", "Lustrage", "Pneus brillants", "Séchage"]', 2),

('Nettoyage Intérieur', 'interior', 'Nettoyage complet de l\'intérieur du véhicule', 30.00, 60,
 '{"sedan": 1.0, "suv": 1.2, "truck": 1.2, "van": 1.3, "sports": 1.0, "luxury": 1.3}',
 '["Aspiration complète", "Nettoyage des sièges", "Tableau de bord", "Vitres intérieures", "Désodorisation"]', 3),

('Lavage Complet', 'complete', 'Lavage extérieur et intérieur complet', 45.00, 90,
 '{"sedan": 1.0, "suv": 1.2, "truck": 1.3, "van": 1.3, "sports": 1.1, "luxury": 1.4}',
 '["Lavage extérieur complet", "Nettoyage intérieur complet", "Lustrage", "Pneus brillants", "Désodorisation"]', 4),

('Lavage Premium', 'premium', 'Service premium avec traitement professionnel', 70.00, 120,
 '{"sedan": 1.0, "suv": 1.2, "truck": 1.3, "van": 1.3, "sports": 1.2, "luxury": 1.5}',
 '["Tout du lavage complet", "Polish de la carrosserie", "Traitement céramique", "Nettoyage du moteur", "Protection anti-pluie"]', 5)
ON DUPLICATE KEY UPDATE name = name;

-- ============================================
-- TABLE: bookings
-- Description: Réservations de services
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- Relationships
  client_id INT NOT NULL,
  agent_id INT NULL,
  vehicle_id INT NULL,
  address_id INT NULL,
  wash_type_id INT NULL,
  
  -- Booking details
  wash_type VARCHAR(50), -- Kept for backward compatibility
  scheduled_time TIMESTAMP NOT NULL,
  notes TEXT,
  
  -- Status tracking
  status ENUM('pending', 'confirmed', 'en_route', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  cancellation_reason TEXT,
  cancelled_by INT NULL,
  
  -- Timestamps for status changes
  confirmed_at TIMESTAMP NULL,
  en_route_at TIMESTAMP NULL,
  service_started_at TIMESTAMP NULL,
  service_completed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  agent_earnings DECIMAL(10, 2) DEFAULT 0,
  platform_earnings DECIMAL(10, 2) DEFAULT 0,
  
  -- Payment
  payment_method ENUM('cash', 'card', 'mobile') DEFAULT 'cash',
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  payment_id VARCHAR(255),
  
  -- Service completion
  before_photos JSON,
  after_photos JSON,
  vehicle_photos JSON,
  completion_notes TEXT,
  
  -- Rating and review
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  reviewed_at TIMESTAMP NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL,
  FOREIGN KEY (wash_type_id) REFERENCES wash_types(id) ON DELETE SET NULL,
  FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_booking_number (booking_number),
  INDEX idx_client_bookings (client_id, created_at),
  INDEX idx_agent_bookings (agent_id, scheduled_time),
  INDEX idx_status (status),
  INDEX idx_scheduled_time (scheduled_time),
  INDEX idx_bookings_agent_status (agent_id, status),
  INDEX idx_bookings_agent_date (agent_id, scheduled_time),
  INDEX idx_bookings_status_date (status, scheduled_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: notifications
-- Description: Notifications pour les utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  message TEXT NOT NULL,
  data JSON, -- Additional data for the notification
  action_url VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  bulk_notification_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_notifications (user_id, is_read, created_at),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: bulk_notifications
-- Description: Notifications envoyées en masse
-- ============================================
CREATE TABLE IF NOT EXISTS bulk_notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('info', 'success', 'warning', 'promotion', 'urgent') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500),
  image_url VARCHAR(500),
  recipient_type VARCHAR(50) NOT NULL,
  recipient_count INT NOT NULL,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  delivery_type ENUM('immediate', 'scheduled') DEFAULT 'immediate',
  scheduled_at TIMESTAMP NULL,
  send_push BOOLEAN DEFAULT TRUE,
  send_email BOOLEAN DEFAULT FALSE,
  send_sms BOOLEAN DEFAULT FALSE,
  status ENUM('processing', 'scheduled', 'completed', 'failed') DEFAULT 'processing',
  error_message TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key for bulk notifications
ALTER TABLE notifications 
ADD FOREIGN KEY (bulk_notification_id) REFERENCES bulk_notifications(id) ON DELETE SET NULL;

-- ============================================
-- TABLE: push_tokens
-- Description: Tokens pour les notifications push
-- ============================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  device_type ENUM('ios', 'android', 'web') NOT NULL,
  device_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_token (user_id, token),
  INDEX idx_active_tokens (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: agent_earnings
-- Description: Historique des gains des agents
-- ============================================
CREATE TABLE IF NOT EXISTS agent_earnings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  agent_id INT NOT NULL,
  booking_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  status ENUM('pending', 'processing', 'paid', 'cancelled') DEFAULT 'pending',
  payment_date DATE NULL,
  payment_method VARCHAR(50) NULL,
  payout_id INT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  INDEX idx_agent_earnings (agent_id, created_at),
  INDEX idx_status_earnings (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: payouts
-- Description: Paiements effectués aux agents
-- ============================================
CREATE TABLE IF NOT EXISTS payouts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  agent_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  booking_count INT NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  processed_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_agent_payouts (agent_id, created_at),
  INDEX idx_status_payouts (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add payout_id to agent_earnings
ALTER TABLE agent_earnings ADD FOREIGN KEY (payout_id) REFERENCES payouts(id) ON DELETE SET NULL;

-- ============================================
-- TABLE: route_tracking
-- Description: Suivi des trajets des agents
-- ============================================
CREATE TABLE IF NOT EXISTS route_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  agent_id INT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NULL,
  total_distance DECIMAL(10, 2) NULL,
  total_duration INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_booking_tracking (booking_id),
  INDEX idx_agent_tracking (agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: route_points
-- Description: Points GPS des trajets
-- ============================================
CREATE TABLE IF NOT EXISTS route_points (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2) NULL,
  heading DECIMAL(5, 2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  INDEX idx_booking_points (booking_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: booking_issues
-- Description: Problèmes signalés sur les réservations
-- ============================================
CREATE TABLE IF NOT EXISTS booking_issues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  reported_by INT NOT NULL,
  issue_type ENUM('client_absent', 'wrong_address', 'difficult_access', 'payment_issue', 'other') NOT NULL,
  description TEXT,
  status ENUM('pending', 'resolved', 'escalated') DEFAULT 'pending',
  resolved_at TIMESTAMP NULL,
  resolved_by INT NULL,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_booking_issues (booking_id),
  INDEX idx_status_issues (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: activity_logs
-- Description: Journaux d'activité du système
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  user_id INT NULL,
  metadata JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_activity_type (type),
  INDEX idx_activity_date (created_at),
  INDEX idx_activity_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: settings
-- Description: Paramètres de l'application
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  `key` VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer les paramètres par défaut
INSERT INTO settings (`key`, value, description, category) VALUES
('agent_commission_rate', '0.70', 'Taux de commission des agents (70%)', 'financial'),
('platform_fee', '0.30', 'Frais de plateforme (30%)', 'financial'),
('cancellation_fee_rate', '0.20', 'Taux de frais d\'annulation (20%)', 'financial'),
('max_cancellation_time', '2', 'Heures maximum avant réservation pour annuler sans frais', 'booking'),
('min_booking_notice', '2', 'Heures minimum de préavis pour une réservation', 'booking'),
('max_agent_distance', '20', 'Distance maximale (km) pour l\'affectation d\'agent', 'booking'),
('app_version', '1.0.0', 'Version de l\'application', 'general'),
('maintenance_mode', 'false', 'Mode maintenance activé/désactivé', 'general'),
('support_email', 'support@carcare.tn', 'Email du support', 'contact'),
('support_phone', '+216 12 345 678', 'Téléphone du support', 'contact')
ON DUPLICATE KEY UPDATE value = value;

-- ============================================
-- TABLE: scheduled_jobs
-- Description: Tâches programmées
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(50) NOT NULL,
  data JSON NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  
  INDEX idx_scheduled (scheduled_at, status),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: promo_codes
-- Description: Codes promo et réductions
-- ============================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2) NULL,
  usage_limit INT NULL,
  usage_count INT DEFAULT 0,
  user_limit INT DEFAULT 1, -- Nombre d'utilisations par utilisat