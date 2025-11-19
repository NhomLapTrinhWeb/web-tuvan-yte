/**
 * DATABASE MIGRATION - Add missing fields to appointments table
 * Run this to update existing database structure
 */

const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('Starting migration...');

    // Add missing columns to appointments table
    await sequelize.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(500) DEFAULT NULL COMMENT 'Link Zoom/Google Meet cho online',
      ADD COLUMN IF NOT EXISTS meeting_room_id VARCHAR(100) DEFAULT NULL COMMENT 'ID phòng video call',
      ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE COMMENT 'Đã gửi reminder chưa',
      ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP NULL COMMENT 'Thời gian xác nhận';
    `);

    console.log('✅ Migration completed successfully!');
    console.log('✅ Added fields: meeting_link, meeting_room_id, reminder_sent, confirmed_at');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
