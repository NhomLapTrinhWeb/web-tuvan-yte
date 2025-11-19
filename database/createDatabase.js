// Script tạo database & sync models
const { sequelize, User, Patient, Doctor, Specialty, Appointment, Transaction, Review, Notification, MedicalRecord, Message } = require('../models');

async function createDatabase() {
  try {
    console.log('🔄 Đang kết nối database...');
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công!');

    console.log('\n🔄 Đang đồng bộ models...');
    
    // Sync all models với force: false (không xóa dữ liệu cũ)
    // Sử dụng alter: true để cập nhật schema mà không mất dữ liệu
    await sequelize.sync({ alter: true });
    
    console.log('✅ Đồng bộ models thành công!');
    console.log('\n📋 Danh sách tables đã tạo:');
    console.log('  ✓ users');
    console.log('  ✓ patients');
    console.log('  ✓ doctors');
    console.log('  ✓ specialties');
    console.log('  ✓ appointments');
    console.log('  ✓ transactions');
    console.log('  ✓ reviews');
    console.log('  ✓ notifications');
    console.log('  ✓ medical_records');
    console.log('  ✓ messages');

    console.log('\n🎉 Database đã sẵn sàng!');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  createDatabase();
}

module.exports = createDatabase;
