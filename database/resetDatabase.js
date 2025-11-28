// Script drop và tạo lại database hoàn toàn mới
const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetDatabase() {
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

    // Drop database nếu tồn tại
    console.log(`\n🗑️  Đang xóa database '${dbName}' (nếu tồn tại)...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' đã được xóa!`);

    // Tạo database mới
    console.log(`\n🔄 Đang tạo database mới '${dbName}'...`);
    await connection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' đã được tạo mới!`);

    console.log('\n🎉 Hoàn tất! Bây giờ chạy: npm run db:create');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  resetDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = resetDatabase;