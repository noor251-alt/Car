const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const { connectDB, connectRedis } = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const scheduledNotifications = require('./services/scheduledNotifications');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bookingRoutes = require('./routes/bookings');
const agentRoutes = require('./routes/agents');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);

// Configuration CORS sécurisée
const corsOptions = {
  origin: function (origin, callback) {
    // En développement local, autoriser les connexions sans origin (mobile apps)
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Liste des origines autorisées
    const allowedOrigins = process.env.FRONTEND_URL ? 
      process.env.FRONTEND_URL.split(',').map(url => url.trim()) : 
      [];
    
    // Autoriser les origines configurées
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // En production, refuser les origines non autorisées
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error('Non autorisé par la politique CORS'), false);
    }
    
    // En développement, être plus permissif mais logger
    logger.warn(`Origine non configurée mais autorisée en développement: ${origin}`);
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions
});

// Start scheduled notifications service
scheduledNotifications.start();

// Middleware de sécurité renforcé
app.use(helmet({
  crossOriginEmbedderPolicy: false // Nécessaire pour certaines fonctionnalités mobiles
}));

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting plus strict
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Plus permissif en développement
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Rate limiting plus strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 tentatives de connexion par IP
  message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);

// Make io accessible to routes
app.set('io', io);

// Middleware de logging des requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Error handling
app.use(errorHandler);

// Socket.IO connection
io.on('connection', (socket) => {
  logger.info(`Nouvelle connexion client: ${socket.id}`);
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    logger.info(`Socket ${socket.id} a rejoint la room ${roomId}`);
  });

  socket.on('location-update', (data) => {
    io.to(data.bookingId).emit('agent-location', data);
  });

  socket.on('disconnect', () => {
    logger.info(`Client déconnecté: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    await connectRedis();
    
    server.listen(PORT, () => {
      logger.info(`Serveur démarré sur le port ${PORT}`);
      logger.info(`Environnement: ${process.env.NODE_ENV}`);
      logger.info(`Origines CORS autorisées: ${process.env.FRONTEND_URL || 'Aucune configurée'}`);
    });
  } catch (error) {
    logger.error('Échec du démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, io };