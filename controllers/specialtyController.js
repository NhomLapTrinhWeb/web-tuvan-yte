const { Specialty, Doctor, User, Department } = require('../models');

const specialtyController = {
  /**
   * GET /specialties - Web view: List all specialties
   */
  async index(req, res) {
    try {
      // Get all active specialties with doctor count
      const specialties = await Specialty.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']]
      });
      
      // Count doctors for each specialty
      const specialtiesWithCount = await Promise.all(
        specialties.map(async (specialty) => {
          const doctorCount = await Doctor.count({
            where: {
              specialty_id: specialty.id,
              is_active: true,
              is_approved: true
            }
          });
          return {
            ...specialty.toJSON(),
            doctorCount
          };
        })
      );
      
      res.render('specialties/index', {
        pageTitle: 'Chuyên Khoa',
        specialties: specialtiesWithCount,
        currentPath: req.path
      });
    } catch (error) {
      console.error('Error in SpecialtyController.index:', error);
      res.status(500).send('Không thể tải danh sách chuyên khoa');
    }
  },

  /**
   * GET /specialties/:slug - Web view: Specialty detail with doctors
   */
  async show(req, res) {
    try {
      const slug = req.params.slug;
      
      // Get specialty details
      const specialty = await Specialty.findOne({
        where: { slug, is_active: true }
      });
      
      if (!specialty) {
        return res.status(404).send('Không tìm thấy chuyên khoa');
      }
      
      // Get all doctors in this specialty with pagination
      const page = parseInt(req.query.page) || 1;
      const limit = 12;
      const offset = (page - 1) * limit;
      
      const { count, rows: doctors } = await Doctor.findAndCountAll({
        where: {
          specialty_id: specialty.id,
          is_active: true,
          is_approved: true
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'avatar']
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
      
      const totalPages = Math.ceil(count / limit);
      
      res.render('specialties/show', {
        pageTitle: specialty.name,
        specialty,
        doctors,
        currentPage: page,
        totalPages,
        totalDoctors: count,
        currentPath: req.path
      });
    } catch (error) {
      console.error('Error in SpecialtyController.show:', error);
      res.status(500).send('Không thể tải thông tin chuyên khoa');
    }
  },
  
  // === API METHODS BELOW ===
  /**
   * Get all specialties
   */
  async getAllSpecialties(req, res) {
    try {
      const { is_active = true } = req.query;

      const where = {};
      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      }

      const specialties = await Specialty.findAll({
        where,
        attributes: ['id', 'name', 'slug', 'description', 'image', 'is_active'],
        order: [['name', 'ASC']]
      });

      // Count doctors for each specialty
      const specialtiesWithCount = await Promise.all(
        specialties.map(async (specialty) => {
          const doctorCount = await Doctor.count({
            where: {
              specialty_id: specialty.id,
              is_approved: true
            }
          });

          return {
            ...specialty.toJSON(),
            doctor_count: doctorCount
          };
        })
      );

      return res.json({
        success: true,
        data: specialtiesWithCount
      });
    } catch (error) {
      console.error('Get all specialties error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Get specialty detail
   */
  async getSpecialtyDetail(req, res) {
    try {
      const { id } = req.params;

      const specialty = await Specialty.findByPk(id);

      if (!specialty) {
        return res.status(404).json({
          success: false,
          message: 'Specialty not found'
        });
      }

      // Count doctors
      const doctorCount = await Doctor.count({
        where: {
          specialty_id: id,
          is_approved: true
        }
      });

      return res.json({
        success: true,
        data: {
          ...specialty.toJSON(),
          doctor_count: doctorCount
        }
      });
    } catch (error) {
      console.error('Get specialty detail error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Create specialty (Admin only)
   */
  async createSpecialty(req, res) {
    try {
      const { name, slug, description, is_active = true } = req.body;

      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          message: 'Name and slug are required'
        });
      }

      // Check if slug already exists
      const existingSpecialty = await Specialty.findOne({ where: { slug } });
      if (existingSpecialty) {
        return res.status(409).json({
          success: false,
          message: 'Specialty with this slug already exists'
        });
      }

      let imagePath = null;
      if (req.file) {
        imagePath = `/uploads/specialties/${req.file.filename}`;
      }

      const specialty = await Specialty.create({
        name,
        slug,
        description,
        image: imagePath,
        is_active
      });

      return res.status(201).json({
        success: true,
        message: 'Specialty created successfully',
        data: specialty
      });
    } catch (error) {
      console.error('Create specialty error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Update specialty (Admin only)
   */
  async updateSpecialty(req, res) {
    try {
      const { id } = req.params;
      const { name, slug, description, is_active } = req.body;

      const specialty = await Specialty.findByPk(id);
      if (!specialty) {
        return res.status(404).json({
          success: false,
          message: 'Specialty not found'
        });
      }

      // Check if new slug conflicts with another specialty
      if (slug && slug !== specialty.slug) {
        const existingSpecialty = await Specialty.findOne({ where: { slug } });
        if (existingSpecialty) {
          return res.status(409).json({
            success: false,
            message: 'Specialty with this slug already exists'
          });
        }
      }

      let imagePath = specialty.image;
      if (req.file) {
        imagePath = `/uploads/specialties/${req.file.filename}`;
      }

      await specialty.update({
        name: name || specialty.name,
        slug: slug || specialty.slug,
        description: description !== undefined ? description : specialty.description,
        image: imagePath,
        is_active: is_active !== undefined ? is_active : specialty.is_active
      });

      return res.json({
        success: true,
        message: 'Specialty updated successfully',
        data: specialty
      });
    } catch (error) {
      console.error('Update specialty error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Delete specialty (Admin only)
   */
  async deleteSpecialty(req, res) {
    try {
      const { id } = req.params;

      const specialty = await Specialty.findByPk(id);
      if (!specialty) {
        return res.status(404).json({
          success: false,
          message: 'Specialty not found'
        });
      }

      // Check if any doctors are using this specialty
      const doctorCount = await Doctor.count({
        where: { specialty_id: id }
      });

      if (doctorCount > 0) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete specialty with associated doctors'
        });
      }

      await specialty.destroy();

      return res.json({
        success: true,
        message: 'Specialty deleted successfully'
      });
    } catch (error) {
      console.error('Delete specialty error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Toggle specialty status (Admin only)
   */
  async toggleStatus(req, res) {
    try {
      const { id } = req.params;

      const specialty = await Specialty.findByPk(id);
      if (!specialty) {
        return res.status(404).json({
          success: false,
          message: 'Specialty not found'
        });
      }

      await specialty.update({
        is_active: !specialty.is_active
      });

      return res.json({
        success: true,
        message: `Specialty ${specialty.is_active ? 'activated' : 'deactivated'} successfully`,
        data: specialty
      });
    } catch (error) {
      console.error('Toggle specialty status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = specialtyController;
