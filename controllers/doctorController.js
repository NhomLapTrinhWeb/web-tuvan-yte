const { Doctor, User, Specialty, Department, Review } = require('../models');
const { Op } = require('sequelize');

class DoctorController {
  // GET /doctors - Danh sách bác sĩ với filter và pagination
  async index(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 12;
      const offset = (page - 1) * limit;
      
      // Build where clause
      const where = {
        is_active: true,
        is_approved: true
      };
      
      // Filter by specialty
      if (req.query.specialty) {
        where.specialty_id = req.query.specialty;
      }
      
      // Filter by department
      if (req.query.department) {
        where.department_id = req.query.department;
      }
      
      // Search by name
      let userWhere = {};
      if (req.query.search) {
        userWhere = {
          full_name: {
            [Op.like]: `%${req.query.search}%`
          }
        };
      }
      
      // Get doctors with pagination
      const { count, rows: doctors } = await Doctor.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'avatar'],
            where: Object.keys(userWhere).length > 0 ? userWhere : undefined
          },
          {
            model: Specialty,
            as: 'specialty',
            attributes: ['id', 'name', 'slug', 'icon']
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name', 'slug']
          }
        ],
        limit,
        offset,
        order: [['rating', 'DESC']],
        distinct: true
      });
      
      // Get all specialties for filter dropdown
      const specialties = await Specialty.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']]
      });
      
      // Get all departments for filter dropdown
      const departments = await Department.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']]
      });
      
      const totalPages = Math.ceil(count / limit);
      
      res.render('doctors/index', {
        pageTitle: 'Đội Ngũ Bác Sĩ',
        doctors,
        specialties,
        departments,
        currentPage: page,
        totalPages,
        totalDoctors: count,
        currentPath: req.path,
        filters: {
          specialty: req.query.specialty || '',
          department: req.query.department || '',
          search: req.query.search || ''
        }
      });
    } catch (error) {
      console.error('Error in DoctorController.index:', error);
      res.status(500).send('Không thể tải danh sách bác sĩ');
    }
  }
  
  // GET /doctors/:id - Chi tiết bác sĩ
  async show(req, res) {
    try {
      const doctorId = req.params.id;
      
      // Get doctor details
      const doctor = await Doctor.findOne({
        where: { user_id: doctorId, is_active: true, is_approved: true },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'avatar', 'phone']
          },
          {
            model: Specialty,
            as: 'specialty',
            attributes: ['id', 'name', 'slug', 'description', 'icon']
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name', 'slug', 'location']
          }
        ]
      });
      
      if (!doctor) {
        return res.status(404).send('Không tìm thấy bác sĩ');
      }
      
      // Get reviews with pagination
      const reviewPage = parseInt(req.query.review_page) || 1;
      const reviewLimit = 5;
      const reviewOffset = (reviewPage - 1) * reviewLimit;
      
      const { count: reviewCount, rows: reviews } = await Review.findAndCountAll({
        where: { doctor_id: doctorId, is_approved: true },
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'full_name', 'avatar']
          }
        ],
        limit: reviewLimit,
        offset: reviewOffset,
        order: [['created_at', 'DESC']]
      });
      
      const totalReviewPages = Math.ceil(reviewCount / reviewLimit);
      
      // Calculate rating distribution
      const ratingStats = await Review.findAll({
        where: { doctor_id: doctorId, is_approved: true },
        attributes: [
          'rating',
          [Doctor.sequelize.fn('COUNT', Doctor.sequelize.col('id')), 'count']
        ],
        group: ['rating'],
        raw: true
      });
      
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratingStats.forEach(stat => {
        ratingDistribution[stat.rating] = parseInt(stat.count);
      });
      
      res.render('doctors/show', {
        pageTitle: doctor.user.full_name,
        doctor,
        reviews,
        reviewCount,
        currentReviewPage: reviewPage,
        totalReviewPages,
        ratingDistribution,
        currentPath: req.path
      });
    } catch (error) {
      console.error('Error in DoctorController.show:', error);
      res.status(500).send('Không thể tải thông tin bác sĩ');
    }
  }
}

module.exports = new DoctorController();
