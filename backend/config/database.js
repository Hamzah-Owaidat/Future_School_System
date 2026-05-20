// MySQL Database configuration
const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'futurschool',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test database connection
const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database Connected Successfully');
    connection.release();
    return pool;
  } catch (error) {
    console.error('❌ Database Connection Error:', error.message);
    process.exit(1);
  }
};

// Execute query helper function
const query = async (sql, params) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database Query Error:', error);
    throw error;
  }
};

module.exports = {
  pool,
  connectDB,
  query
};

