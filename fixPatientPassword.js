const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs'); // Hoặc require('bcrypt') nếu máy bạn lỗi
require('dotenv').config();

async function fixPatientPassword() {
    let connection;
    try {
        console.log('🔌 Đang kết nối database...');

        // Cấu hình kết nối (Lấy từ .env)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'hospital_booking'
        });

        // 1. Tạo mã hóa cho mật khẩu "123456"
        const newPassword = '123456';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 2. Cập nhật cho tài khoản patient1
        const email = 'patient1@example.com';

        console.log(`🔄 Đang đặt lại mật khẩu cho: ${email}`);
        const [rows] = await connection.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        if (rows.affectedRows > 0) {
            console.log('✅ THÀNH CÔNG! Mật khẩu đã được đổi thành: 123456');
            console.log('👉 Hãy thử đăng nhập lại ngay!');
        } else {
            console.log('❌ LỖI: Không tìm thấy email này trong database.');
        }

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

fixPatientPassword();