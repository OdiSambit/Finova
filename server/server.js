require('dotenv').config();
const app = require('./app');
const pool = require('./db/pool');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Database connected successfully');

    const initSqlPath = path.join(__dirname, 'db', 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    await pool.query(initSql);
    console.log('Database tables initialized');

    app.listen(PORT, () => {
      console.log(`Finova server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
