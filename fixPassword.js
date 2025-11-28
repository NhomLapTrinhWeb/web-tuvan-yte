const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs'); // Hoặc require('bcrypt') nếu code bạn dùng bcrypt
require('dotenv').config();

async function fixAdminPassword() {
    let connection;
    try {
        console.log('🔌 Đang kết nối database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306, // Đảm bảo nhận đúng port 3307
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'hospital_booking'
        });

        // 1. Mã hóa mật khẩu mới là "123456"
        const newPassword = '123456';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 2. Cập nhật vào database
        console.log(`🔄 Đang đổi mật khẩu cho admin@hospital.vn thành: ${newPassword}`);
        const [rows] = await connection.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, 'admin@hospital.vn']
        );

        if (rows.affectedRows > 0) {
            console.log('✅ THÀNH CÔNG! Mật khẩu Admin đã được reset.');
            console.log('👉 Hãy đăng nhập lại với: admin@hospital.vn / 123456');
        } else {
            console.log('❌ KHÔNG TÌM THẤY EMAIL ADMIN! Có thể bạn cần chạy lại seed.');
        }

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

fixAdminPassword();