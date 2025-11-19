// File seed data mẫu
const { sequelize, User, Doctor, Department, Category } = require('../models');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    
    console.log('Seeding departments...');
    const departments = await Department.bulkCreate([
      { name: 'Khoa Nội', description: 'Khám và điều trị các bệnh nội khoa' },
      { name: 'Khoa Ngoại', description: 'Khám và phẫu thuật các bệnh ngoại khoa' },
      { name: 'Khoa Sản', description: 'Chăm sóc sức khỏe phụ nữ và sản phụ' },
      { name: 'Khoa Nhi', description: 'Chăm sóc sức khỏe trẻ em' },
      { name: 'Khoa Tai Mũi Họng', description: 'Khám và điều trị bệnh tai mũi họng' }
    ]);
    
    console.log('Seeding users...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    const users = await User.bulkCreate([
      {
        fullName: 'Admin User',
        email: 'admin@hospital.com',
        password: hashedPassword,
        role: 'admin'
      },
      {
        fullName: 'Nguyễn Văn A',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user'
      }
    ]);
    
    console.log('Seeding doctors...');
    await Doctor.bulkCreate([
      {
        fullName: 'BS. Nguyễn Văn B',
        specialization: 'Nội tổng quát',
        degree: 'Thạc sĩ',
        experience: 10,
        bio: 'Bác sĩ có 10 năm kinh nghiệm trong lĩnh vực nội khoa',
        departmentId: departments[0].id
      },
      {
        fullName: 'BS. Trần Thị C',
        specialization: 'Ngoại tiêu hóa',
        degree: 'Tiến sĩ',
        experience: 15,
        bio: 'Bác sĩ chuyên về phẫu thuật tiêu hóa',
        departmentId: departments[1].id
      }
    ]);
    
    console.log('Seeding categories...');
    await Category.bulkCreate([
      { name: 'Tin tức y tế', slug: 'tin-tuc-y-te' },
      { name: 'Sức khỏe', slug: 'suc-khoe' },
      { name: 'Dinh dưỡng', slug: 'dinh-duong' }
    ]);
    
    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
