// Seed dữ liệu mẫu đầy đủ cho Hospital Portal
const bcrypt = require('bcrypt');
const { 
  User, Patient, Doctor, Specialty, Department, 
  Category, Post, Appointment 
} = require('../models');

async function seedAll() {
  try {
    console.log('🌱 Bắt đầu seed dữ liệu mẫu...\n');

    // ============================================
    // 1. SEED CATEGORIES (Danh mục tin tức)
    // ============================================
    console.log('📁 Seeding Categories...');
    const categories = await Category.bulkCreate([
      {
        name: 'Tin Y Tế',
        slug: 'tin-y-te',
        description: 'Tin tức y tế, nghiên cứu khoa học, y học hiện đại',
        icon: 'newspaper',
        display_order: 1,
        is_active: true
      },
      {
        name: 'Hoạt Động Bệnh Viện',
        slug: 'hoat-dong-benh-vien',
        description: 'Các hoạt động, sự kiện của bệnh viện',
        icon: 'hospital',
        display_order: 2,
        is_active: true
      },
      {
        name: 'Tư Vấn Sức Khỏe',
        slug: 'tu-van-suc-khoe',
        description: 'Chia sẻ kiến thức, mẹo chăm sóc sức khỏe',
        icon: 'heart-pulse',
        display_order: 3,
        is_active: true
      }
    ]);
    console.log(`✅ Đã tạo ${categories.length} categories\n`);

    // ============================================
    // 2. SEED DEPARTMENTS (Khoa)
    // ============================================
    console.log('🏥 Seeding Departments...');
    const departments = await Department.bulkCreate([
      {
        name: 'Khoa Răng Hàm Mặt',
        slug: 'khoa-rang-ham-mat',
        description: 'Chuyên khoa điều trị các bệnh lý về răng, hàm, mặt. Trang bị đầy đủ máy móc hiện đại, đội ngũ bác sĩ giàu kinh nghiệm.',
        image: '/uploads/departments/rang-ham-mat.jpg',
        icon: 'tooth',
        phone: '0901234567',
        email: 'ranghammat@hospital.vn',
        location: 'Tầng 2, Khu A',
        display_order: 1,
        is_active: true
      },
      {
        name: 'Khoa Chỉnh Nha',
        slug: 'khoa-chinh-nha',
        description: 'Chuyên niềng răng, chỉnh hình răng mặt, khắc phục răng móm, hô, lệch lạc. Áp dụng công nghệ niềng răng trong suốt Invisalign.',
        image: '/uploads/departments/chinh-nha.jpg',
        icon: 'smile',
        phone: '0901234568',
        email: 'chinhnha@hospital.vn',
        location: 'Tầng 3, Khu A',
        display_order: 2,
        is_active: true
      },
      {
        name: 'Khoa Nội Tổng Quát',
        slug: 'khoa-noi-tong-quat',
        description: 'Khám và điều trị các bệnh nội khoa: tim mạch, tiêu hóa, hô hấp, nội tiết. Trang bị máy siêu âm, XQ, xét nghiệm hiện đại.',
        image: '/uploads/departments/noi-khoa.jpg',
        icon: 'stethoscope',
        phone: '0901234569',
        email: 'noitongquat@hospital.vn',
        location: 'Tầng 4, Khu B',
        display_order: 3,
        is_active: true
      }
    ]);
    console.log(`✅ Đã tạo ${departments.length} departments\n`);

    // ============================================
    // 3. SEED USERS + DOCTORS (5 bác sĩ)
    // ============================================
    console.log('👨‍⚕️ Seeding Doctors...');
    
    // Lấy specialties đã có
    const specialties = await Specialty.findAll({ limit: 5 });
    
    const doctorsData = [
      {
        user: {
          email: 'bs.nguyenvana@hospital.vn',
          password: await bcrypt.hash('123456', 10),
          full_name: 'BS. Nguyễn Văn A',
          phone: '0912345001',
          avatar: '/uploads/doctors/doctor1.jpg',
          date_of_birth: '1980-05-15',
          gender: 'male',
          address: 'Hà Nội',
          role: 'doctor',
          is_verified: true,
          is_active: true
        },
        doctor: {
          specialty_id: specialties[0]?.id || 1,
          department_id: departments[0].id,
          license_number: 'BS-001-2024',
          education: 'Tiến sĩ - Đại học Y Hà Nội',
          experience_years: 15,
          bio: 'Bác sĩ có 15 năm kinh nghiệm trong lĩnh vực Răng Hàm Mặt. Chuyên trị các ca phức tạp về cấy ghép implant.',
          consultation_price: 300000,
          rating: 4.8,
          total_reviews: 156,
          total_appointments: 890,
          certificates: ['/uploads/certificates/cert1.jpg'],
          working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          working_hours: '08:00-17:00',
          consultation_duration: 30,
          is_approved: true,
          is_active: true
        }
      },
      {
        user: {
          email: 'bs.tranthib@hospital.vn',
          password: await bcrypt.hash('123456', 10),
          full_name: 'BS. Trần Thị B',
          phone: '0912345002',
          avatar: '/uploads/doctors/doctor2.jpg',
          date_of_birth: '1985-08-20',
          gender: 'female',
          address: 'TP.HCM',
          role: 'doctor',
          is_verified: true,
          is_active: true
        },
        doctor: {
          specialty_id: specialties[1]?.id || 2,
          department_id: departments[1].id,
          license_number: 'BS-002-2024',
          education: 'Thạc sĩ - Đại học Y Dược TP.HCM',
          experience_years: 10,
          bio: 'Chuyên gia niềng răng hàng đầu, đã thực hiện hơn 500 ca niềng răng thành công. Chứng chỉ Invisalign Provider.',
          consultation_price: 350000,
          rating: 4.9,
          total_reviews: 203,
          total_appointments: 654,
          certificates: ['/uploads/certificates/cert2.jpg'],
          working_days: ['monday', 'wednesday', 'friday', 'saturday'],
          working_hours: '09:00-18:00',
          consultation_duration: 45,
          is_approved: true,
          is_active: true
        }
      },
      {
        user: {
          email: 'bs.levanc@hospital.vn',
          password: await bcrypt.hash('123456', 10),
          full_name: 'BS. Lê Văn C',
          phone: '0912345003',
          avatar: '/uploads/doctors/doctor3.jpg',
          date_of_birth: '1978-12-10',
          gender: 'male',
          address: 'Đà Nẵng',
          role: 'doctor',
          is_verified: true,
          is_active: true
        },
        doctor: {
          specialty_id: specialties[2]?.id || 3,
          department_id: departments[2].id,
          license_number: 'BS-003-2024',
          education: 'Giáo sư - Đại học Y Hà Nội',
          experience_years: 25,
          bio: 'Giáo sư, Tiến sĩ chuyên khoa Nội Tổng Quát. Đầu ngành về Tim Mạch và Tiêu Hóa.',
          consultation_price: 500000,
          rating: 5.0,
          total_reviews: 312,
          total_appointments: 1250,
          certificates: ['/uploads/certificates/cert3.jpg', '/uploads/certificates/cert3b.jpg'],
          working_days: ['tuesday', 'thursday', 'saturday'],
          working_hours: '08:00-12:00',
          consultation_duration: 30,
          is_approved: true,
          is_active: true
        }
      },
      {
        user: {
          email: 'bs.phamthid@hospital.vn',
          password: await bcrypt.hash('123456', 10),
          full_name: 'BS. Phạm Thị D',
          phone: '0912345004',
          avatar: '/uploads/doctors/doctor4.jpg',
          date_of_birth: '1990-03-25',
          gender: 'female',
          address: 'Hải Phòng',
          role: 'doctor',
          is_verified: true,
          is_active: true
        },
        doctor: {
          specialty_id: specialties[3]?.id || 4,
          department_id: departments[0].id,
          license_number: 'BS-004-2024',
          education: 'Bác sĩ - Đại học Y Hải Phòng',
          experience_years: 7,
          bio: 'Bác sĩ trẻ, nhiệt huyết, chuyên điều trị thẩm mỹ răng. Tốt nghiệp loại Giỏi.',
          consultation_price: 250000,
          rating: 4.7,
          total_reviews: 89,
          total_appointments: 345,
          certificates: ['/uploads/certificates/cert4.jpg'],
          working_days: ['monday', 'tuesday', 'thursday', 'friday', 'saturday'],
          working_hours: '08:30-17:30',
          consultation_duration: 30,
          is_approved: true,
          is_active: true
        }
      },
      {
        user: {
          email: 'bs.hoangvane@hospital.vn',
          password: await bcrypt.hash('123456', 10),
          full_name: 'BS. Hoàng Văn E',
          phone: '0912345005',
          avatar: '/uploads/doctors/doctor5.jpg',
          date_of_birth: '1982-07-18',
          gender: 'male',
          address: 'Cần Thơ',
          role: 'doctor',
          is_verified: true,
          is_active: true
        },
        doctor: {
          specialty_id: specialties[4]?.id || 5,
          department_id: departments[1].id,
          license_number: 'BS-005-2024',
          education: 'Thạc sĩ - Đại học Y Cần Thơ',
          experience_years: 12,
          bio: 'Chuyên gia chỉnh nha cho trẻ em và người lớn. Phong cách tư vấn tận tâm, chu đáo.',
          consultation_price: 300000,
          rating: 4.6,
          total_reviews: 127,
          total_appointments: 567,
          certificates: ['/uploads/certificates/cert5.jpg'],
          working_days: ['monday', 'wednesday', 'thursday', 'saturday'],
          working_hours: '09:00-17:00',
          consultation_duration: 30,
          is_approved: true,
          is_active: true
        }
      }
    ];

    // Tạo users và doctors
    let doctorCount = 0;
    for (const data of doctorsData) {
      const user = await User.create(data.user);
      await Doctor.create({
        user_id: user.id,
        ...data.doctor
      });
      doctorCount++;
    }
    console.log(`✅ Đã tạo ${doctorCount} doctors\n`);

    // Cập nhật head_doctor cho departments
    const allDoctors = await Doctor.findAll({ include: ['user'] });
    if (allDoctors.length >= 3) {
      await departments[0].update({ head_doctor_id: allDoctors[0].user_id });
      await departments[1].update({ head_doctor_id: allDoctors[1].user_id });
      await departments[2].update({ head_doctor_id: allDoctors[2].user_id });
      console.log('✅ Đã gán Trưởng khoa cho các departments\n');
    }

    // ============================================
    // 4. SEED ADMIN USER
    // ============================================
    console.log('👤 Seeding Admin User...');
    const admin = await User.create({
      email: 'admin@hospital.vn',
      password: await bcrypt.hash('admin123', 10),
      full_name: 'Admin Hệ Thống',
      phone: '0900000000',
      avatar: '/uploads/admin/admin.jpg',
      role: 'admin',
      is_verified: true,
      is_active: true
    });
    console.log(`✅ Admin created: ${admin.email}\n`);

    // ============================================
    // 5. SEED POSTS (3 bài viết mẫu)
    // ============================================
    console.log('📝 Seeding Posts...');
    const posts = await Post.bulkCreate([
      {
        title: 'Tầm soát ung thư miễn phí cho 100 bệnh nhân đầu tiên',
        slug: 'tam-soat-ung-thu-mien-phi',
        content: `
          <h2>Chương trình tầm soát ung thư miễn phí</h2>
          <p>Nhân dịp kỷ niệm 20 năm thành lập, Bệnh viện Đa khoa tổ chức chương trình <strong>tầm soát ung thư miễn phí</strong> cho 100 bệnh nhân đầu tiên đăng ký.</p>
          
          <h3>Nội dung chương trình</h3>
          <ul>
            <li>Khám lâm sàng miễn phí</li>
            <li>Xét nghiệm máu miễn phí</li>
            <li>Siêu âm tổng quát miễn phí</li>
            <li>Tư vấn dinh dưỡng và lối sống lành mạnh</li>
          </ul>

          <h3>Thời gian và địa điểm</h3>
          <p><strong>Thời gian:</strong> 8h00 - 17h00, Thứ 7-8 (23-24/11/2025)</p>
          <p><strong>Địa điểm:</strong> Hội trường tầng 1, Bệnh viện Đa khoa</p>
          
          <p><em>Liên hệ hotline <strong>1900-xxxx</strong> để đăng ký tham gia!</em></p>
        `,
        excerpt: 'Bệnh viện tổ chức chương trình tầm soát ung thư miễn phí cho 100 bệnh nhân đầu tiên đăng ký nhân dịp kỷ niệm 20 năm thành lập.',
        thumbnail: '/uploads/posts/post1.jpg',
        category_id: categories[1].id,
        author_id: admin.id,
        views: 1250,
        is_featured: true,
        status: 'published',
        published_at: new Date(),
        seo_title: 'Tầm soát ung thư miễn phí - Bệnh viện Đa khoa',
        seo_description: 'Đăng ký ngay để được tầm soát ung thư miễn phí tại bệnh viện',
        seo_keywords: 'tầm soát ung thư, khám miễn phí, bệnh viện'
      },
      {
        title: '7 dấu hiệu cảnh báo bệnh tim mạch bạn không nên bỏ qua',
        slug: '7-dau-hieu-canh-bao-benh-tim-mach',
        content: `
          <h2>Nhận biết sớm các dấu hiệu bệnh tim mạch</h2>
          <p>Bệnh tim mạch là một trong những nguyên nhân gây tử vong hàng đầu. Việc nhận biết sớm các dấu hiệu cảnh báo có thể cứu sống bạn.</p>
          
          <h3>7 dấu hiệu cần lưu ý</h3>
          <ol>
            <li><strong>Đau ngực:</strong> Cảm giác đau tức, nặng ngực, đặc biệt khi gắng sức</li>
            <li><strong>Khó thở:</strong> Thở dốc, khó thở ngay cả khi nghỉ ngơi</li>
            <li><strong>Mệt mỏi bất thường:</strong> Cảm thấy kiệt sức không rõ nguyên nhân</li>
            <li><strong>Chóng mặt:</strong> Đầu quay, mất thăng bằng thường xuyên</li>
            <li><strong>Đau lan ra:</strong> Đau lan ra cánh tay trái, vai, cổ</li>
            <li><strong>Tim đập nhanh:</strong> Nhịp tim không đều, hồi hộp</li>
            <li><strong>Phù chân:</strong> Chân bàn chân sưng phù, đặc biệt vào buổi tối</li>
          </ol>

          <h3>Khi nào cần đi khám ngay?</h3>
          <p>Nếu bạn có 2 hoặc nhiều triệu chứng trên, hãy đến bệnh viện để được khám và tư vấn ngay. Đừng chủ quan với sức khỏe của mình!</p>
          
          <p><strong>Đặt lịch khám tim mạch:</strong> <a href="/dat-lich">Nhấn vào đây</a></p>
        `,
        excerpt: 'Nhận biết sớm 7 dấu hiệu cảnh báo bệnh tim mạch để bảo vệ sức khỏe của bạn và gia đình.',
        thumbnail: '/uploads/posts/post2.jpg',
        category_id: categories[2].id,
        author_id: admin.id,
        views: 3420,
        is_featured: true,
        status: 'published',
        published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        seo_title: '7 dấu hiệu cảnh báo bệnh tim mạch',
        seo_description: 'Tìm hiểu 7 dấu hiệu cảnh báo bệnh tim mạch để phát hiện và điều trị kịp thời',
        seo_keywords: 'bệnh tim mạch, dấu hiệu tim mạch, sức khỏe tim'
      },
      {
        title: 'Răng khôn mọc lệch: Nguyên nhân và cách xử lý',
        slug: 'rang-khon-moc-lech-nguyen-nhan-va-cach-xu-ly',
        content: `
          <h2>Tất tần tật về răng khôn mọc lệch</h2>
          <p>Răng khôn (răng số 8) thường mọc vào độ tuổi 17-25. Tuy nhiên, không phải ai cũng có đủ không gian để răng khôn mọc thẳng.</p>
          
          <h3>Nguyên nhân răng khôn mọc lệch</h3>
          <ul>
            <li>Hàm nhỏ, không đủ không gian</li>
            <li>Răng khôn mọc nghiêng, nằm ngang</li>
            <li>Yếu tố di truyền</li>
            <li>Răng mọc không đúng vị trí</li>
          </ul>

          <h3>Biểu hiện răng khôn mọc lệch</h3>
          <ul>
            <li>Đau, sưng nướu ở vị trí răng khôn</li>
            <li>Khó nhai, khó nuốt</li>
            <li>Hơi thở có mùi hôi</li>
            <li>Sốt nhẹ, đau đầu</li>
          </ul>

          <h3>Khi nào cần nhổ răng khôn?</h3>
          <p>Bác sĩ sẽ chỉ định nhổ răng khôn khi:</p>
          <ul>
            <li>Răng mọc lệch, chèn ép răng khác</li>
            <li>Gây viêm nhiễm, đau đớn</li>
            <li>Gây sâu răng, viêm nướu</li>
            <li>Ảnh hưởng đến cấu trúc hàm</li>
          </ul>

          <p><strong>Lưu ý:</strong> Việc nhổ răng khôn cần được thực hiện bởi bác sĩ có kinh nghiệm để tránh biến chứng.</p>
          
          <p><em>Đặt lịch khám răng khôn với các bác sĩ giàu kinh nghiệm tại bệnh viện: <a href="/dat-lich">Đặt lịch ngay</a></em></p>
        `,
        excerpt: 'Răng khôn mọc lệch gây đau và nhiều phiền toái. Tìm hiểu nguyên nhân và cách xử lý hiệu quả.',
        thumbnail: '/uploads/posts/post3.jpg',
        category_id: categories[0].id,
        author_id: admin.id,
        views: 2180,
        is_featured: true,
        status: 'published',
        published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        seo_title: 'Răng khôn mọc lệch - Nguyên nhân và cách xử lý',
        seo_description: 'Hướng dẫn chi tiết về răng khôn mọc lệch, nguyên nhân và phương pháp điều trị',
        seo_keywords: 'răng khôn, nhổ răng khôn, răng mọc lệch'
      }
    ]);
    console.log(`✅ Đã tạo ${posts.length} posts\n`);

    // ============================================
    // 6. SEED SAMPLE PATIENTS
    // ============================================
    console.log('👥 Seeding Sample Patients...');
    const patientsData = [
      {
        email: 'patient1@example.com',
        password: await bcrypt.hash('123456', 10),
        full_name: 'Nguyễn Thị Mai',
        phone: '0987654321',
        date_of_birth: '1995-03-20',
        gender: 'female',
        address: 'Hà Nội',
        role: 'patient',
        is_verified: true,
        is_active: true
      },
      {
        email: 'patient2@example.com',
        password: await bcrypt.hash('123456', 10),
        full_name: 'Trần Văn Nam',
        phone: '0987654322',
        date_of_birth: '1988-07-15',
        gender: 'male',
        address: 'TP.HCM',
        role: 'patient',
        is_verified: true,
        is_active: true
      }
    ];

    let patientCount = 0;
    for (const data of patientsData) {
      const user = await User.create(data);
      await Patient.create({
        user_id: user.id,
        blood_type: 'O+',
        allergies: 'Không',
        medical_history: 'Không có tiền sử bệnh lý'
      });
      patientCount++;
    }
    console.log(`✅ Đã tạo ${patientCount} patients\n`);

    console.log('🎉 HOÀN TẤT SEED DỮ LIỆU!\n');
    console.log('==========================================');
    console.log('📊 THỐNG KÊ:');
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Departments: ${departments.length}`);
    console.log(`   - Doctors: ${doctorCount}`);
    console.log(`   - Posts: ${posts.length}`);
    console.log(`   - Patients: ${patientCount}`);
    console.log(`   - Admin: 1`);
    console.log('==========================================\n');
    console.log('🔐 THÔNG TIN ĐĂNG NHẬP:');
    console.log('   Admin: admin@hospital.vn / admin123');
    console.log('   Bác sĩ 1: bs.nguyenvana@hospital.vn / 123456');
    console.log('   Bệnh nhân 1: patient1@example.com / 123456');
    console.log('==========================================\n');

  } catch (error) {
    console.error('❌ Lỗi khi seed data:', error);
    throw error;
  }
}

module.exports = seedAll;

// Chạy nếu được gọi trực tiếp
if (require.main === module) {
  const { sequelize } = require('../models');
  seedAll()
    .then(() => {
      console.log('✅ Seed hoàn tất!');
      sequelize.close();
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Seed thất bại:', err);
      process.exit(1);
    });
}
