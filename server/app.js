const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const transferRoutes = require('./routes/transfers');
const investmentRoutes = require('./routes/investments');
const goalRoutes = require('./routes/goals');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const watchlistRoutes = require('./routes/watchlist');
const profileRoutes = require('./routes/profile');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

/* -----------------------------
   CORS
----------------------------- */

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

/* -----------------------------
   Health Check
----------------------------- */

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'finova-api',
    environment: process.env.NODE_ENV || 'development',
  });
});

/* -----------------------------
   Middleware
----------------------------- */

app.use(express.json({ limit: '10mb' }));

/* -----------------------------
   Rate Limiting
----------------------------- */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 1000,
  message: {
    error: 'Too many requests, please try again later.',
  },
});

app.use(limiter);

/* -----------------------------
   API Routes
----------------------------- */

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/profile', profileRoutes);

/* -----------------------------
   404 Handler
----------------------------- */

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
  });
});

/* -----------------------------
   Global Error Handler
----------------------------- */

app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);

  res.status(500).json({
    error: 'Internal server error',
  });
});

module.exports = app;