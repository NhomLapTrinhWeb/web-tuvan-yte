// Script tạo database MySQL (chỉ chạy 1 lần đầu tiên)
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabaseIfNotExists() {
  let connection;
  
  try {
    console.log('🔄 Đang kết nối MySQL server...');
    
    // KẾT NỐI: Đã thêm dòng PORT ở dưới để nhận diện cổng 3307
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306, // <--- ĐÃ SỬA: Thêm dòng này
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Kết nối MySQL thành công!');

    const dbName = process.env.DB_NAME || 'hospital_booking';

    // Tạo database nếu chưa tồn tại
    console.log(`\n🔄 Đang tạo database '${dbName}'...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' đã sẵn sàng!`);

    console.log('\n🎉 Hoàn tất! Bạn có thể chạy: npm run db:create');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error('\nℹ️  Hãy kiểm tra:');
    console.error('   - MySQL server đã chạy chưa?');
    console.error('   - Thông tin trong file .env đúng chưa (đặc biệt là DB_PORT)?');
    console.error('   - User có quyền CREATE DATABASE không?');
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Chạy nếu được gọi trực tiếp
if (require.main === module) {
  createDatabaseIfNotExists()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = createDatabaseIfNotExists;