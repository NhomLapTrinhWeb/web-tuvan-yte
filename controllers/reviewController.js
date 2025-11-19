const { Review, Appointment, Doctor, Patient, User } = require('../models');
const NotificationService = require('../services/NotificationService');
const { Op } = require('sequelize');

const reviewController = {
  /**
   * Create review (Patient only, after completed appointment)
   */
  async createReview(req, res) {
    try {
      const patientUserId = req.user.id;
      const { appointment_id, rating, comment, is_anonymous = false } = req.body;

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Get appointment
      const appointment = await Appointment.findByPk(appointment_id, {
        include: ['patient', 'doctor']
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Verify patient owns this appointment
      if (appointment.patient.user_id !== patientUserId) {
        return res.status(403).json({
          success: false,
          message: 'You can only review your own appointments'
        });
      }

      // Check if appointment is completed
      if (appointment.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'You can only review completed appointments'
        });
      }

      // Check if review already exists
      const existingReview = await Review.findOne({
        where: { appointment_id }
      });

      if (existingReview) {
        return res.status(409).json({
          success: false,
          message: 'You have already reviewed this appointment'
        });
      }

      // Create review
      const review = await Review.create({
        appointment_id,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        rating,
        comment,
        is_anonymous
      });

      // Update doctor rating
      await this.updateDoctorRating(appointment.doctor_id);

      // Send notification to doctor
      await NotificationService.notifyNewReview(review);

      return res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: review
      });
    } catch (error) {
      console.error('Create review error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Update review (Patient only)
   */
  async updateReview(req, res) {
    try {
      const patientUserId = req.user.id;
      const { id } = req.params;
      const { rating, comment, is_anonymous } = req.body;

      // Validate rating
      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Get review
      const review = await Review.findByPk(id, {
        include: [
          {
            model: Appointment,
            as: 'appointment',
            include: ['patient']
          }
        ]
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Verify patient owns this review
      if (review.appointment.patient.user_id !== patientUserId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own reviews'
        });
      }

      // Update review
      await review.update({
        rating: rating || review.rating,
        comment: comment !== undefined ? comment : review.comment,
        is_anonymous: is_anonymous !== undefined ? is_anonymous : review.is_anonymous
      });

      // Update doctor rating if rating changed
      if (rating && rating !== review.rating) {
        await this.updateDoctorRating(review.doctor_id);
      }

      return res.json({
        success: true,
        message: 'Review updated successfully',
        data: review
      });
    } catch (error) {
      console.error('Update review error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Delete review (Patient only)
   */
  async deleteReview(req, res) {
    try {
      const patientUserId = req.user.id;
      const { id } = req.params;

      const review = await Review.findByPk(id, {
        include: [
          {
            model: Appointment,
            as: 'appointment',
            include: ['patient']
          }
        ]
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Verify patient owns this review
      if (review.appointment.patient.user_id !== patientUserId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own reviews'
        });
      }

      const doctorId = review.doctor_id;

      // Delete review
      await review.destroy();

      // Update doctor rating
      await this.updateDoctorRating(doctorId);

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
   * Doctor responds to review
   */
  async respondToReview(req, res) {
    try {
      const doctorUserId = req.user.id;
      const { id } = req.params;
      const { response } = req.body;

      if (!response || response.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Response is required'
        });
      }

      // Get review
      const review = await Review.findByPk(id, {
        include: [
          {
            model: Doctor,
            as: 'doctor',
            include: [{ model: User, as: 'user' }]
          }
        ]
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Verify doctor owns this review
      if (review.doctor.user_id !== doctorUserId) {
        return res.status(403).json({
          success: false,
          message: 'You can only respond to your own reviews'
        });
      }

      // Update review with response
      await review.update({
        response,
        responded_at: new Date()
      });

      return res.json({
        success: true,
        message: 'Response added successfully',
        data: review
      });
    } catch (error) {
      console.error('Respond to review error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Get doctor reviews
   */
  async getDoctorReviews(req, res) {
    try {
      const { doctorId } = req.params;
      const { page = 1, limit = 20, rating = null } = req.query;
      const offset = (page - 1) * limit;

      const where = { doctor_id: doctorId };
      if (rating) {
        where.rating = parseInt(rating);
      }

      const { count, rows } = await Review.findAndCountAll({
        where,
        include: [
          {
            model: Patient,
            as: 'patient',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'full_name', 'avatar']
              }
            ]
          },
          {
            model: Appointment,
            as: 'appointment',
            attributes: ['id', 'appointment_date']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Mask patient names if anonymous
      const reviewsData = rows.map(review => {
        const reviewJson = review.toJSON();
        if (reviewJson.is_anonymous) {
          reviewJson.patient.user.full_name = 'Ẩn danh';
          reviewJson.patient.user.avatar = null;
        }
        return reviewJson;
      });

      return res.json({
        success: true,
        data: reviewsData,
        metadata: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get doctor reviews error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Helper: Update doctor rating average
   */
  async updateDoctorRating(doctorId) {
    try {
      const reviews = await Review.findAll({
        where: { doctor_id: doctorId }
      });

      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

      await Doctor.update(
        {
          rating_average: averageRating.toFixed(2),
          total_reviews: totalReviews
        },
        { where: { id: doctorId } }
      );

      return true;
    } catch (error) {
      console.error('Update doctor rating error:', error);
      return false;
    }
  }
};

module.exports = reviewController;
