// Seed dữ liệu specialties (chuyên khoa)
const { Specialty } = require('../models');

const specialtiesData = [
  {
    name: 'Nội tổng quát',
    slug: 'noi-tong-quat',
    description: 'Chẩn đoán và điều trị các bệnh nội khoa như tim mạch, tiêu hóa, hô hấp, tiết niệu...',
    icon: 'heart-pulse',
    is_active: true
  },
  {
    name: 'Tim mạch',
    slug: 'tim-mach',
    description: 'Chuyên khoa về các bệnh lý tim mạch, huyết áp, nhồi máu cơ tim, rối loạn nhịp tim...',
    icon: 'heart',
    is_active: true
  },
  {
    name: 'Da liễu',
    slug: 'da-lieu',
    description: 'Điều trị các bệnh về da, mụn trứng cá, viêm da, nấm da, zona, chàm...',
    icon: 'droplet',
    is_active: true
  },
  {
    name: 'Tiêu hóa',
    slug: 'tieu-hoa',
    description: 'Chuyên khoa về dạ dày, ruột, gan, mật, tụy và các bệnh lý tiêu hóa...',
    icon: 'activity',
    is_active: true
  },
  {
    name: 'Tai Mũi Họng',
    slug: 'tai-mui-hong',
    description: 'Điều trị các bệnh về tai, mũi, họng, viêm amidan, viêm xoang, viêm tai giữa...',
    icon: 'ear',
    is_active: true
  },
  {
    name: 'Mắt',
    slug: 'mat',
    description: 'Khám và điều trị các bệnh về mắt, cận thị, viễn thị, đục thủy tinh thể, tăng nhãn áp...',
    icon: 'eye',
    is_active: true
  },
  {
    name: 'Răng Hàm Mặt',
    slug: 'rang-ham-mat',
    description: 'Nha khoa tổng quát, nhổ răng, trám răng, làm răng giả, chỉnh nha...',
    icon: 'smile',
    is_active: true
  },
  {
    name: 'Sản phụ khoa',
    slug: 'san-phu-khoa',
    description: 'Khám thai, theo dõi thai kỳ, điều trị các bệnh phụ khoa, vô sinh...',
    icon: 'baby',
    is_active: true
  },
  {
    name: 'Nhi khoa',
    slug: 'nhi-khoa',
    description: 'Chăm sóc sức khỏe trẻ em, tiêm chủng, khám bệnh, tư vấn dinh dưỡng...',
    icon: 'baby-carriage',
    is_active: true
  },
  {
    name: 'Thần kinh',
    slug: 'than-kinh',
    description: 'Điều trị đau đầu, đau dây thần kinh, tai biến mạch máu não, Parkinson...',
    icon: 'brain',
    is_active: true
  },
  {
    name: 'Cơ xương khớp',
    slug: 'co-xuong-khop',
    description: 'Điều trị viêm khớp, gai cột sống, đau lưng, thoát vị đĩa đệm...',
    icon: 'bone',
    is_active: true
  },
  {
    name: 'Tâm thần',
    slug: 'tam-than',
    description: 'Tư vấn và điều trị các vấn đề tâm lý, trầm cảm, lo âu, stress...',
    icon: 'brain-circuit',
    is_active: true
  },
  {
    name: 'Hô hấp',
    slug: 'ho-hap',
    description: 'Điều trị hen suyễn, viêm phế quản, viêm phổi, COPD...',
    icon: 'wind',
    is_active: true
  },
  {
    name: 'Thận - Tiết niệu',
    slug: 'than-tiet-nieu',
    description: 'Điều trị sỏi thận, viêm đường tiết niệu, suy thận, u bàng quang...',
    icon: 'droplets',
    is_active: true
  },
  {
    name: 'Nội tiết',
    slug: 'noi-tiet',
    description: 'Điều trị đái tháo đường, bệnh tuyến giáp, rối loạn hormone...',
    icon: 'thermometer',
    is_active: true
  }
];

async function seedSpecialties() {
  try {
    console.log('🔄 Đang seed specialties...');

    for (const specialty of specialtiesData) {
      await Specialty.findOrCreate({
        where: { slug: specialty.slug },
        defaults: specialty
      });
    }

    console.log(`✅ Đã seed ${specialtiesData.length} specialties thành công!`);
  } catch (error) {
    console.error('❌ Lỗi khi seed specialties:', error.message);
    throw error;
  }
}

module.exports = seedSpecialties;

// Chạy nếu được gọi trực tiếp
if (require.main === module) {
  const { sequelize } = require('../models');
  seedSpecialties()
    .then(() => sequelize.close())
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
