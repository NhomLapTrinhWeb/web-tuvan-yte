const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs'); // Hoặc 'bcrypt' tùy máy bạn
require('dotenv').config();

async function fixDoctorPassword() {
    let connection;
    try {
        console.log('🔌 Đang kết nối database...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'hospital_booking'
        });

        // 1. Mã hóa mật khẩu '123456'
        const newPassword = '123456';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 2. Cập nhật cho tài khoản bác sĩ A
        const email = 'bs.nguyenvana@hospital.vn';

        console.log(`🔄 Đang đặt lại mật khẩu cho: ${email}`);
        const [rows] = await connection.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        if (rows.affectedRows > 0) {
            console.log('✅ THÀNH CÔNG! Mật khẩu bác sĩ đã đổi thành: 123456');
        } else {
            console.log('❌ LỖI: Không tìm thấy email bác sĩ này.');
        }

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

fixDoctorPassword();