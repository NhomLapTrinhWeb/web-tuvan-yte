const { User, Patient, sequelize } = require('./models');

async function fixPatientProfile() {
    try {
        console.log('🔌 Đang kết nối database...');

        // 1. Tìm tài khoản User của Mai
        const email = 'patient1@example.com';
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('❌ Lỗi: Không tìm thấy User ' + email);
            return;
        }
        console.log(`✅ Tìm thấy User: ${user.full_name} (ID: ${user.id})`);

        // 2. Xóa hồ sơ cũ bị lỗi (nếu có)
        console.log('🗑️ Đang xóa hồ sơ bệnh nhân cũ (để fix lỗi ID undefined)...');
        await Patient.destroy({ where: { user_id: user.id } });
        console.log('✅ Đã xóa hồ sơ cũ.');

        // 3. Tạo hồ sơ mới cứng
        console.log('🆕 Đang tạo hồ sơ mới...');
        const newPatient = await Patient.create({
            user_id: user.id,
            date_of_birth: '1995-01-01',
            gender: 'female',
            address: 'Hà Nội'
        });

        // 4. Kiểm tra lại kết quả
        console.log(`🎉 TẠO LẠI THÀNH CÔNG!`);
        console.log(`👉 User ID: ${newPatient.user_id}`);
        console.log(`👉 Patient ID: ${newPatient.id}`); // <--- Chỗ này phải hiện số thì mới được

        if (!newPatient.id) {
            console.log('⚠️ CẢNH BÁO: Patient ID vẫn bị undefined. Có thể lỗi do Model definition.');
        }

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
}

fixPatientProfile();