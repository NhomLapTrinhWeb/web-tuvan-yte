const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_booking'
  });

  console.log('Connected to database');

  try {
    // Drop tables với foreign keys
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    console.log('Dropping old tables...');
    await connection.query('DROP TABLE IF EXISTS time_slots');
    await connection.query('DROP TABLE IF EXISTS schedules');
    await connection.query('DROP TABLE IF EXISTS posts');
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Tables dropped successfully!');
    console.log('Please restart server to let Sequelize recreate tables with correct schema.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

fixDatabase();
