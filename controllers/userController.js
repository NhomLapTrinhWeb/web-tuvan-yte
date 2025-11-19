const { User, Patient, Doctor } = require('../models');
const bcrypt = require('bcrypt');
const path = require('path');

const userController = {
  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      let user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get additional info based on role
      let additionalInfo = null;
      if (role === 'patient') {
        additionalInfo = await Patient.findOne({
          where: { user_id: userId }
        });
      } else if (role === 'doctor') {
        additionalInfo = await Doctor.findOne({
          where: { user_id: userId },
          include: ['specialty']
        });
      }

      return res.json({
        success: true,
        data: {
          ...user.toJSON(),
          profile: additionalInfo
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const role = req.user.role;
      const {
        full_name,
        phone,
        date_of_birth,
        gender,
        address,
        // Patient specific
        insurance_number,
        blood_type,
        allergies,
        medical_history,
        emergency_contact_name,
        emergency_contact_phone,
        // Doctor specific
        bio,
        experience_years,
        education,
        workplace,
        consultation_price
      } = req.body;

      // Update user basic info
      await User.update(
        { full_name, phone },
        { where: { id: userId } }
      );

      // Update role-specific info
      if (role === 'patient') {
        await Patient.update(
          {
            date_of_birth,
            gender,
            address,
            insurance_number,
            blood_type,
            allergies: allergies ? JSON.stringify(allergies) : null,
            medical_history,
            emergency_contact_name,
            emergency_contact_phone
          },
          { where: { user_id: userId } }
        );
      } else if (role === 'doctor') {
        await Doctor.update(
          {
            bio,
            experience_years,
            education,
            workplace,
            consultation_price
          },
          { where: { user_id: userId } }
        );
      }

      return res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Upload avatar
   */
  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const userId = req.user.id;
      const avatarPath = `/uploads/avatars/${req.file.filename}`;

      await User.update(
        { avatar: avatarPath },
        { where: { id: userId } }
      );

      return res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: { avatar: avatarPath }
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Change password
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { current_password, new_password } = req.body;

      // Validate input
      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
        });
      }

      // Get user with password
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(current_password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update password
      await user.update({ password: hashedPassword });

      return res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Delete account (soft delete)
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to delete account'
        });
      }

      // Verify password
      const user = await User.findByPk(userId);
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Password is incorrect'
        });
      }

      // Deactivate account
      await user.update({ is_active: false });

      return res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = userController;
