/**
 * HOME CONTROLLER
 * Xử lý logic cho trang chủ: hiển thị specialties, featured doctors, latest posts
 */

const { Specialty, Doctor, Post, User, Department } = require('../models');

class HomeController {
  /**
   * GET / - Trang chủ
   * Hiển thị slider, stats, specialties, featured doctors, latest posts
   */
  async index(req, res) {
    try {
      // Fetch all data with proper aliases
      const specialties = await Specialty.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']],
        limit: 15
      });

      const doctors = await Doctor.findAll({
        where: { 
          is_approved: true,
          is_active: true 
        },
        include: [
          { model: User, as: 'user', attributes: ['id', 'full_name', 'avatar', 'email'] },
          { model: Specialty, as: 'specialty', attributes: ['id', 'name', 'slug'] },
          { model: Department, as: 'department', attributes: ['id', 'name'], required: false }
        ],
        order: [['rating', 'DESC'], ['experience_years', 'DESC']],
        limit: 8
      });

      const posts = await Post.findAll({
        where: { status: 'published' },
        include: [
          { model: User, as: 'author', attributes: ['id', 'full_name', 'avatar'] }
        ],
        order: [['published_at', 'DESC'], ['created_at', 'DESC']],
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
      console.error(error.stack);
      res.status(500).send('Internal Server Error');
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
      console.error('❌ Error in HomeController.about:', error);
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
      console.error('❌ Error in HomeController.contact:', error);
      res.status(500).send('Internal Server Error');
    }
  }
}

module.exports = new HomeController();
