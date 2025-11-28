/**
 * HOME CONTROLLER
 * Xử lý logic cho trang chủ
 */

const { Specialty, Doctor, Post, User, Department } = require('../models');

class HomeController {
  /**
   * GET / - Trang chủ
   */
  async index(req, res) {
    try {
      // 1. Lấy danh sách chuyên khoa
      // (Tạm bỏ where is_active để tránh lỗi nếu bảng chưa có cột này)
      const specialties = await Specialty.findAll({
        order: [['name', 'ASC']],
        limit: 15
      });

      // 2. Lấy danh sách bác sĩ
      const doctors = await Doctor.findAll({
        where: {
          is_approved: true
          // ❌ Đã xóa dòng is_active: true ở đây vì bảng doctors không có cột này
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'avatar', 'email'],
            where: { is_active: true } // ✅ Chuyển check active vào đây (check tài khoản User)
          },
          { model: Specialty, as: 'specialty', attributes: ['id', 'name', 'slug'] },
          { model: Department, as: 'department', attributes: ['id', 'name'], required: false }
        ],
        // ❌ Bỏ sort theo rating/experience vì chưa có cột
        order: [['created_at', 'DESC']],
        limit: 8
      });

      // 3. Lấy bài viết
      const posts = await Post.findAll({
        where: { status: 'published' },
        include: [
          { model: User, as: 'author', attributes: ['id', 'full_name', 'avatar'] }
        ],
        order: [['created_at', 'DESC']],
        limit: 6
      });

      res.render('home/index', {
        pageTitle: 'Trang chủ - Hospital Portal',
        seoDescription: 'Hệ thống tư vấn và đặt lịch khám bệnh trực tuyến hàng đầu',
        seoKeywords: 'bệnh viện, tư vấn y tế, đặt lịch khám, bác sĩ, chuyên khoa, sức khỏe',
        specialties,
        doctors,
        posts,
        currentPath: req.path
      });

    } catch (error) {
      console.error('❌ Error in HomeController.index:', error);
      res.status(500).send('Internal Server Error: ' + error.message);
    }
  }

  /**
   * GET /about - Trang giới thiệu
   */
  async about(req, res) {
    try {
      res.render('home/about', {
        pageTitle: 'Giới thiệu - Hospital Portal',
        currentPath: req.path
      });
    } catch (error) {
      res.status(500).send('Internal Server Error');
    }
  }

  /**
   * GET /contact - Trang liên hệ
   */
  async contact(req, res) {
    try {
      res.render('home/contact', {
        pageTitle: 'Liên hệ - Hospital Portal',
        currentPath: req.path
      });
    } catch (error) {
      res.status(500).send('Internal Server Error');
    }
  }
}

module.exports = new HomeController();