require('dotenv').config();

const app = require('./app');
const pool = require('./db/pool');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully');

    // Initialize database tables
    const initSqlPath = path.join(__dirname, 'db', 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    await pool.query(initSql);

    console.log('✅ Database tables initialized');

    // Start Express server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Finova server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Failed to start Finova server');
    console.error('Error:', error.message);

    if (error.code) {
      console.error('PostgreSQL error code:', error.code);
    }

    if (error.detail) {
      console.error('PostgreSQL detail:', error.detail);
    }

    if (error.hint) {
      console.error('PostgreSQL hint:', error.hint);
    }

    process.exit(1);
  }
};

startServer();