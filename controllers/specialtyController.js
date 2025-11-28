const { Specialty, Doctor, User } = require('../models');

const specialtyController = {
  // 1. Hiển thị danh sách chuyên khoa
  index: async (req, res) => {
    try {
      const specialties = await Specialty.findAll({
        order: [['name', 'ASC']]
      });

      res.render('specialties/index', {
        pageTitle: 'Các Chuyên Khoa',
        specialties
      });
    } catch (error) {
      console.error('Get specialties error:', error);
      res.status(500).send('Không thể tải danh sách chuyên khoa: ' + error.message);
    }
  },

  // 2. Hiển thị chi tiết 1 chuyên khoa (kèm danh sách bác sĩ thuộc khoa đó)
  show: async (req, res) => {
    try {
      const { slug } = req.params;

      const specialty = await Specialty.findOne({
        where: { slug },
        include: [
          {
            model: Doctor,
            as: 'doctors',
            where: { is_approved: true },
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['full_name', 'avatar'],
                where: { is_active: true }
              }
            ],
            required: false // Vẫn hiện chuyên khoa dù chưa có bác sĩ nào
          }
        ]
      });

      if (!specialty) {
        return res.status(404).render('errors/404', { pageTitle: 'Không tìm thấy chuyên khoa' });
      }

      res.render('specialties/show', {
        pageTitle: `Khoa ${specialty.name}`,
        specialty
      });

    } catch (error) {
      console.error('Get specialty detail error:', error);
      res.status(500).send('Lỗi server');
    }
  }
};

module.exports = specialtyController;