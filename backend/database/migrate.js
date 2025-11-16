// Migration script pour initialiser la base de données CarCare
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const logger = require('../utils/logger');

class DatabaseMigrator {
  constructor() {
    this.client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: 'postgres', // Se connecter à la base système d'abord
    });
  }

  async createDatabaseIfNotExists() {
    try {
      await this.client.connect();
      
      // Vérifier si la base de données existe
      const result = await this.client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [process.env.DB_NAME || 'carcare_db']
      );

      if (result.rows.length === 0) {
        // Créer la base de données
        await this.client.query(`CREATE DATABASE ${process.env.DB_NAME || 'carcare_db'}`);
        logger.info(`Base de données ${process.env.DB_NAME || 'carcare_db'} créée avec succès`);
      } else {
        logger.info(`Base de données ${process.env.DB_NAME || 'carcare_db'} existe déjà`);
      }

      await this.client.end();
    } catch (error) {
      logger.error('Erreur lors de la création de la base de données:', error);
      throw error;
    }
  }

  async runMigrations() {
    // Se connecter à la base de données de l'application
    const appClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'carcare_db',
    });

    try {
      await appClient.connect();
      logger.info('Connexion à la base de données établie');

      // Lire et adapter le schéma SQL (MySQL vers PostgreSQL)
      const schemaPath = path.join(__dirname, 'schema.sql');
      let schema = fs.readFileSync(schemaPath, 'utf8');

      // Adaptations pour PostgreSQL
      schema = this.adaptSchemaForPostgreSQL(schema);

      // Exécuter le schéma adapté
      await appClient.query(schema);
      logger.info('Schéma de base de données appliqué avec succès');

      // Insérer des données de test si nécessaire
      await this.insertSampleData(appClient);

      await appClient.end();
      logger.info('Migration terminée avec succès');

    } catch (error) {
      logger.error('Erreur lors de la migration:', error);
      throw error;
    }
  }

  adaptSchemaForPostgreSQL(schema) {
    // Supprimer les commandes MySQL spécifiques
    schema = schema.replace(/CREATE DATABASE.*?;/gi, '');
    schema = schema.replace(/USE .*?;/gi, '');
    schema = schema.replace(/CHARACTER SET.*?COLLATE.*?;/gi, ';');
    
    // Remplacer AUTO_INCREMENT par SERIAL
    schema = schema.replace(/INT PRIMARY KEY AUTO_INCREMENT/gi, 'SERIAL PRIMARY KEY');
    schema = schema.replace(/AUTO_INCREMENT/gi, '');

    // Remplacer ENUM par VARCHAR avec contraintes CHECK
    schema = schema.replace(/ENUM\('([^']+)'(?:,\s*'([^']+)')*\)/gi, (match, ...values) => {
      const enumValues = match.match(/'([^']+)'/g).map(v => v.replace(/'/g, "''"));
      return `VARCHAR(50) CHECK (VALUE IN (${enumValues.join(', ')}))`;
    });

    // Remplacer BOOLEAN par BOOLEAN (déjà supporté par PostgreSQL)
    // Remplacer TIMESTAMP par TIMESTAMP
    schema = schema.replace(/TIMESTAMP NULL DEFAULT NULL/gi, 'TIMESTAMP DEFAULT NULL');

    // Remplacer TEXT par TEXT (déjà supporté)
    // Remplacer DECIMAL par DECIMAL (déjà supporté)

    return schema;
  }

  async insertSampleData(client) {
    try {
      // Vérifier si des données existent déjà
      const result = await client.query('SELECT COUNT(*) FROM users');
      const userCount = parseInt(result.rows[0].count);

      if (userCount === 0) {
        logger.info('Insertion des données exemple...');

        // Insérer un admin par défaut
        await client.query(`
          INSERT INTO users (email, password, role, first_name, last_name, phone, status, is_verified, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [
          'admin@carcare.com',
          '$2a$10$example_hashed_password', // Hash bcrypt de "admin123"
          'admin',
          'Admin',
          'CarCare',
          '+21612345678',
          'active',
          true
        ]);

        logger.info('Utilisateur admin créé: admin@carcare.com (mot de passe: admin123)');
      }
    } catch (error) {
      logger.warn('Erreur lors de l\'insertion des données exemple:', error.message);
    }
  }
}

async function migrate() {
  const migrator = new DatabaseMigrator();
  
  try {
    logger.info('Début de la migration de la base de données...');
    
    await migrator.createDatabaseIfNotExists();
    await migrator.runMigrations();
    
    logger.info('Migration terminée avec succès !');
    process.exit(0);
  } catch (error) {
    logger.error('Échec de la migration:', error);
    process.exit(1);
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  migrate();
}

module.exports = { DatabaseMigrator, migrate };