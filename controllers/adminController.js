const { User, Patient, Doctor, Appointment, Transaction, Review, Specialty, Post } = require('../models');
const EmailService = require('../services/EmailService');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

const adminController = {
  /**
   * Get dashboard statistics
   */
  async getDashboard(req, res) {
    try {
      // Count users by role
      const totalUsers = await User.count();
      const totalPatients = await Patient.count();
      const totalDoctors = await Doctor.count();
      const totalAppointments = await Appointment.count();
      const totalPosts = await Post.count();

      res.render('admin/dashboard', {
        title: 'Dashboard',
        totalUsers,
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalPosts
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).send('Internal server error');
    }
  },

    // Hàm hiển thị trang danh sách người dùng
    showUsersList(req, res) {
      res.render('admin/users/index', {
        title: 'Quản Lý Người Dùng'
      });
    },

    // ... (bên dưới hàm showUsersList)

    // Hàm hiển thị trang danh sách bác sĩ
    showDoctorsList(req, res) {
    res.render('admin/doctors/index', {
      title: 'Quản Lý Bác Sĩ'
    });
    },

  // ... (bên dưới hàm showDoctorsList)

    // Hàm hiển thị trang danh sách lịch hẹn
    showAppointmentsList(req, res) {
    res.render('admin/appointments/index', {
    title: 'Quản Lý Lịch Hẹn'
    });
    },

  /**
   * Get all users with filters
   */
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, role = null, is_active = null, search = null } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (role) where.role = role;
      if (is_active !== null) where.is_active = is_active === 'true';
      if (search) {
        where[Op.or] = [
          { full_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.json({
        success: true,
        data: rows,
        metadata: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Toggle user active status
   */
  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({
        is_active: !user.is_active
      });

      return res.json({
        success: true,
        message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
        data: user
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Change user role (promote to doctor / demote to patient)
   */
  async changeUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Validate role
      if (!['doctor', 'patient'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role không hợp lệ. Chỉ chấp nhận: doctor, patient'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      // Không cho phép thay đổi role của admin
      if (user.role === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không thể thay đổi role của Admin'
        });
      }

      // Nếu role hiện tại đã là role mới thì không cần thay đổi
      if (user.role === role) {
        return res.json({
          success: true,
          message: `Người dùng đã có role ${role === 'doctor' ? 'Bác sĩ' : 'Bệnh nhân'}`
        });
      }

      // Bắt đầu transaction
      const transaction = await User.sequelize.transaction();

      try {
        // CẤP QUYỀN BÁC SĨ: patient -> doctor
        if (role === 'doctor') {
          // 1. Kiểm tra xem đã có Doctor record chưa
          let doctor = await Doctor.findOne({ where: { user_id: id }, transaction });
          
          if (!doctor) {
            // 2. Lấy specialty mặc định (specialty đầu tiên trong database)
            const defaultSpecialty = await Specialty.findOne({ transaction });
            
            // 3. Tạo Doctor record mới
            doctor = await Doctor.create({
              user_id: id,
              specialty_id: defaultSpecialty ? defaultSpecialty.id : null,
              license_number: `LICENSE-${id}-${Date.now()}`, // Số giấy phép tạm
              bio: 'Thông tin bác sĩ đang được cập nhật...',
              consultation_fee: 200000, // Phí tư vấn mặc định
              experience_years: 0,
              is_approved: true // Admin cấp quyền thì auto approve
            }, { transaction });
          } else {
            // Nếu đã có Doctor record, chỉ cần approve lại
            await doctor.update({ is_approved: true }, { transaction });
          }

          // 4. Cập nhật role của user và thêm prefix "BS. " vào tên
          let newFullName = user.full_name;
          if (!user.full_name.startsWith('BS. ')) {
            newFullName = 'BS. ' + user.full_name;
          }
          await user.update({ 
            role: 'doctor',
            full_name: newFullName
          }, { transaction });
        }
        
        // HỦY QUYỀN BÁC SĨ: doctor -> patient
        else if (role === 'patient') {
          // 1. Kiểm tra xem đã có Patient record chưa
          let patient = await Patient.findOne({ where: { user_id: id }, transaction });
          
          if (!patient) {
            // 2. Tạo Patient record mới
            patient = await Patient.create({
              user_id: id,
              date_of_birth: null,
              gender: null,
              address: null,
              blood_type: null,
              allergies: null,
              medical_history: null
            }, { transaction });
          }

          // 3. Soft delete Doctor record (không xóa để giữ lịch sử)
          const doctor = await Doctor.findOne({ where: { user_id: id }, transaction });
          if (doctor) {
            await doctor.update({ is_approved: false }, { transaction });
          }

          // 4. Cập nhật role của user và xóa prefix "BS. " khỏi tên
          let newFullName = user.full_name;
          if (user.full_name.startsWith('BS. ')) {
            newFullName = user.full_name.replace('BS. ', '');
          }
          await user.update({ 
            role: 'patient',
            full_name: newFullName
          }, { transaction });
        }

        // Commit transaction
        await transaction.commit();

        return res.json({
          success: true,
          message: role === 'doctor' 
            ? `Đã cấp quyền Bác sĩ cho "${user.full_name}"` 
            : `Đã chuyển "${user.full_name}" thành Bệnh nhân`
        });

      } catch (err) {
        await transaction.rollback();
        throw err;
      }

    } catch (error) {
      console.error('Change user role error:', error);
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra: ' + error.message
      });
    }
  },

  /**
   * Get all doctors with filters
   */
  async getDoctors(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        specialty_id = null,
        is_approved = null,
        search = null
      } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (specialty_id) where.specialty_id = specialty_id;
      if (is_approved !== null) where.is_approved = is_approved === 'true';

      const include = [
        { model: Specialty, as: 'specialty' },
        { model: User, as: 'user', attributes: { exclude: ['password'] } }
      ];

      if (search) {
        include[1].where = {
          [Op.or]: [
            { full_name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } }
          ]
        };
      }

      const { count, rows } = await Doctor.findAndCountAll({
        where,
        include,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.json({
        success: true,
        data: rows,
        metadata: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get doctors error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Approve/Reject doctor
   */
  async approveDoctor(req, res) {
    try {
      const { id } = req.params;
      const { is_approved } = req.body;

      const doctor = await Doctor.findByPk(id, {
        include: [{ model: User, as: 'user' }]
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      await doctor.update({
        is_approved,
        approval_date: is_approved ? new Date() : null
      });

      // Send email notification
      await EmailService.sendDoctorApprovalEmail(doctor.user, is_approved);

      return res.json({
        success: true,
        message: `Doctor ${is_approved ? 'approved' : 'rejected'} successfully`,
        data: doctor
      });
    } catch (error) {
      console.error('Approve doctor error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
     * Get all appointments (Đã sửa lỗi Alias 'as')
     */
    async getAppointments(req, res) {
      try {
        const {
          page = 1,
          limit = 20,
          status = null,
          date_from = null,
          date_to = null
        } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;
        if (date_from && date_to) {
          where.appointment_date = {
            [Op.between]: [date_from, date_to]
          };
        }

        console.log('--- Đang lấy danh sách Lịch hẹn (Fixed Alias)... ---');

        const { count, rows } = await Appointment.findAndCountAll({
          where,
          include: [
            {
                model: Patient,
                // 👇 SỬA Ở ĐÂY: Thêm "as: 'user'" để khớp với model
                include: [{ model: User, as: 'user', attributes: ['full_name', 'phone'] }]
            },
            {
                model: Doctor,
                include: [
                    // 👇 SỬA Ở ĐÂY: Thêm "as: 'user'"
                    { model: User, as: 'user', attributes: ['full_name'] },
                    // 👇 SỬA Ở ĐÂY: Thêm "as: 'specialty'" (vì trong model Doctor có as: specialty)
                    { model: Specialty, as: 'specialty', attributes: ['name'] }
                ]
            }
          ],
          order: [['appointment_date', 'DESC'], ['time_slot', 'DESC']],
          limit: parseInt(limit),
          offset: parseInt(offset)
        });

        console.log(`✅ Lấy thành công ${count} lịch hẹn!`);

        return res.json({
          success: true,
          data: rows,
          metadata: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            total_pages: Math.ceil(count / limit)
          }
        });
      } catch (error) {
        console.error('🔥 LỖI GET APPOINTMENTS:', error);
        return res.status(500).json({
          success: false,
          message: 'Lỗi server: ' + error.message
        });
      }
    },

  /**
   * Get all transactions
   */
  async getTransactions(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status = null,
        payment_method = null
      } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (payment_method) where.payment_method = payment_method;

      const { count, rows } = await Transaction.findAndCountAll({
        where,
        include: [
          {
            model: Appointment,
            as: 'appointment',
            include: ['patient', 'doctor']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.json({
        success: true,
        data: rows,
        metadata: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Get all reviews
   */
  async getReviews(req, res) {
    try {
      const { page = 1, limit = 20, rating = null } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (rating) where.rating = parseInt(rating);

      const { count, rows } = await Review.findAndCountAll({
        where,
        include: [
          { model: Patient, as: 'patient', include: [{ model: User, as: 'user' }] },
          { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user' }] },
          { model: Appointment, as: 'appointment' }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.json({
        success: true,
        data: rows,
        metadata: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get reviews error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Delete review (Admin only)
   */
  async deleteReview(req, res) {
    try {
      const { id } = req.params;

      const review = await Review.findByPk(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      await review.destroy();

      return res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      console.error('Delete review error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Create admin user
   */
  async createAdmin(req, res) {
    try {
      const { email, password, full_name, phone } = req.body;

      // Check if email exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin user
      const admin = await User.create({
        email,
        password: hashedPassword,
        full_name,
        phone,
        role: 'admin',
        is_active: true,
        is_verified: true,
        email_verified_at: new Date()
      });

      return res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: {
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name
        }
      });
    } catch (error) {
      console.error('Create admin error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * POST MANAGEMENT
   */

  // Get all posts
  async getPosts(req, res) {
    try {
      const { page = 1, limit = 20, status, category, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (category) where.category = category;
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { summary: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Post.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'full_name', 'email']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.json({
        success: true,
        data: rows,
        metadata: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get posts error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Show create post form
  async showCreatePostForm(req, res) {
    res.render('admin/posts/create', {
      title: 'Tạo Bài Viết Mới'
    });
  },

  // Show edit post form
  async showEditPostForm(req, res) {
    try {
      const { id } = req.params;
      const post = await Post.findByPk(id);

      if (!post) {
        return res.status(404).send('Post not found');
      }

      res.render('admin/posts/edit', {
        title: 'Chỉnh Sửa Bài Viết',
        post
      });
    } catch (error) {
      console.error('Show edit post error:', error);
      res.status(500).send('Internal server error');
    }
  },

  // Show posts list
  async showPostsList(req, res) {
    res.render('admin/posts/index', {
      title: 'Quản Lý Bài Viết'
    });
  },

  // Create new post
  async createPost(req, res) {
    try {
      const {
        title,
        slug,
        summary,
        content,
        status,
        category,
        tags,
        meta_title,
        meta_description,
        meta_keywords
      } = req.body;

      // Generate slug if not provided
      let finalSlug = slug;
      if (!finalSlug) {
        finalSlug = title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }

      // Handle thumbnail upload
      let thumbnailUrl = null;
      if (req.file) {
        thumbnailUrl = `/uploads/${req.file.filename}`;
      }

      // Create post
      const post = await Post.create({
        title,
        slug: finalSlug,
        summary,
        content,
        thumbnail: thumbnailUrl,
        category,
        tags,
        status: status || 'draft',
        author_id: req.user.id,
        meta_title,
        meta_description,
        meta_keywords,
        published_at: status === 'published' ? new Date() : null
      });

      return res.json({
        success: true,
        message: 'Post created successfully',
        data: post
      });
    } catch (error) {
      console.error('Create post error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create post'
      });
    }
  },

  // Update post
  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        slug,
        summary,
        content,
        status,
        category,
        tags,
        meta_title,
        meta_description,
        meta_keywords
      } = req.body;

      const post = await Post.findByPk(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      // Handle thumbnail upload
      let thumbnailUrl = post.thumbnail;
      if (req.file) {
        thumbnailUrl = `/uploads/${req.file.filename}`;
      }

      // Update post
      await post.update({
        title,
        slug: slug || post.slug,
        summary,
        content,
        thumbnail: thumbnailUrl,
        category,
        tags,
        status: status || post.status,
        meta_title,
        meta_description,
        meta_keywords,
        published_at: status === 'published' && !post.published_at ? new Date() : post.published_at
      });

      return res.json({
        success: true,
        message: 'Post updated successfully',
        data: post
      });
    } catch (error) {
      console.error('Update post error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update post'
      });
    }
  },

  // Delete post
  async deletePost(req, res) {
    try {
      const { id } = req.params;

      const post = await Post.findByPk(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      await post.destroy();

      return res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Delete post error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete post'
      });
    }
  },

  // Upload image for CKEditor
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            message: 'No file uploaded'
          }
        });
      }

      const imageUrl = `/uploads/${req.file.filename}`;

      // CKEditor expects this format
      return res.json({
        url: imageUrl
      });
    } catch (error) {
      console.error('Upload image error:', error);
      return res.status(500).json({
        error: {
          message: 'Failed to upload image'
        }
      });
    }
  }
};

module.exports = adminController;
