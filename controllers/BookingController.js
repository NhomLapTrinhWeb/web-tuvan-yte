/**
 * BOOKING CONTROLLER
 * Handle appointment booking flow: Select Doctor → Pick Time → Fill Info → Confirm
 */

const { Doctor, User, Specialty, Department, TimeSlot, Appointment, Patient, sequelize } = require('../models');
const { Op } = require('sequelize');

class BookingController {
  /**
   * STEP 1: GET /appointments/book - Select Doctor
   */
  async selectDoctor(req, res) {
    try {
      const { specialty_id, department_id } = req.query;
      
      const whereClause = {
        is_approved: true,
        is_active: true
      };
      
      if (specialty_id) whereClause.specialty_id = specialty_id;
      if (department_id) whereClause.department_id = department_id;

      const doctors = await Doctor.findAll({
        where: whereClause,
        include: [
          { 
            model: User, 
            as: 'user', 
            attributes: ['id', 'full_name', 'avatar', 'email'] 
          },
          { 
            model: Specialty, 
            as: 'specialty', 
            attributes: ['id', 'name', 'slug'] 
          },
          { 
            model: Department, 
            as: 'department', 
            attributes: ['id', 'name'],
            required: false 
          }
        ],
        order: [['rating', 'DESC']]
      });

      const specialties = await Specialty.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']]
      });

      res.render('appointments/select-doctor', {
        pageTitle: 'Chọn Bác sĩ',
        currentPath: req.path,
        doctors,
        specialties,
        selectedSpecialty: specialty_id || null,
        user: req.user || null
      });

    } catch (error) {
      console.error('Select doctor error:', error);
      res.status(500).send('Lỗi tải danh sách bác sĩ');
    }
  }

  /**
   * STEP 2: GET /appointments/book/:doctorId - Pick Time Slot
   */
  async selectTimeSlot(req, res) {
    try {
      const { doctorId } = req.params;
      const selectedDate = req.query.date || new Date().toISOString().split('T')[0];

      // Get doctor info
      const doctor = await Doctor.findByPk(doctorId, {
        include: [
          { model: User, as: 'user', attributes: ['full_name', 'avatar'] },
          { model: Specialty, as: 'specialty', attributes: ['name'] }
        ]
      });

      if (!doctor || !doctor.is_approved) {
        return res.status(404).send('Bác sĩ không tồn tại hoặc chưa được phê duyệt');
      }

      // Get available time slots for next 7 days
      const today = new Date();
      const next7Days = new Date(today);
      next7Days.setDate(next7Days.getDate() + 7);

      const timeSlots = await TimeSlot.findAll({
        where: {
          doctor_id: doctorId,
          date: {
            [Op.between]: [today.toISOString().split('T')[0], next7Days.toISOString().split('T')[0]]
          },
          is_available: true,
          is_active: true
        },
        order: [['date', 'ASC'], ['start_time', 'ASC']]
      });

      // Group slots by date
      const slotsByDate = timeSlots.reduce((acc, slot) => {
        const dateKey = slot.date;
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(slot);
        return acc;
      }, {});

      res.render('appointments/select-timeslot', {
        pageTitle: 'Chọn Giờ Khám',
        currentPath: req.path,
        doctor,
        slotsByDate,
        selectedDate,
        user: req.user || null
      });

    } catch (error) {
      console.error('Select timeslot error:', error);
      res.status(500).send('Lỗi tải lịch khám');
    }
  }

  /**
   * STEP 3: GET /appointments/book/:doctorId/confirm - Fill Patient Info
   */
  async confirmBooking(req, res) {
    try {
      const { doctorId } = req.params;
      const { slot_id } = req.query;

      if (!slot_id) {
        return res.redirect(`/appointments/book/${doctorId}`);
      }

      // Verify slot availability
      const timeSlot = await TimeSlot.findByPk(slot_id);
      if (!timeSlot || !timeSlot.hasAvailability()) {
        return res.status(400).send('Lịch khám không còn khả dụng');
      }

      // Get doctor info
      const doctor = await Doctor.findByPk(doctorId, {
        include: [
          { model: User, as: 'user', attributes: ['full_name', 'avatar'] },
          { model: Specialty, as: 'specialty', attributes: ['name'] }
        ]
      });

      // Get patient info if logged in
      let patientInfo = null;
      if (req.user && req.user.role === 'patient') {
        const patient = await Patient.findOne({
          where: { user_id: req.user.id },
          include: [{ model: User, as: 'user' }]
        });
        patientInfo = patient;
      }

      res.render('appointments/confirm-booking', {
        pageTitle: 'Xác Nhận Đặt Lịch',
        currentPath: req.path,
        doctor,
        timeSlot,
        patientInfo,
        user: req.user || null
      });

    } catch (error) {
      console.error('Confirm booking error:', error);
      res.status(500).send('Lỗi xác nhận đặt lịch');
    }
  }

  /**
   * STEP 4: POST /appointments/book - Create Appointment
   */
  async createAppointment(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { 
        doctor_id, 
        slot_id, 
        patient_name, 
        patient_phone, 
        patient_email,
        patient_dob,
        patient_gender,
        reason,
        symptoms,
        appointment_type 
      } = req.body;

      // Validate required fields
      if (!doctor_id || !slot_id || !patient_name || !patient_phone) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
        });
      }

      // Verify time slot
      const timeSlot = await TimeSlot.findByPk(slot_id);
      if (!timeSlot || !timeSlot.hasAvailability()) {
        return res.status(400).json({
          success: false,
          message: 'Lịch khám không còn khả dụng'
        });
      }

      // Get or create patient
      let patientId = req.user ? req.user.id : null;

      if (!patientId) {
        // Create guest user/patient
        const guestUser = await User.create({
          email: patient_email || `guest_${Date.now()}@temp.com`,
          password: Math.random().toString(36),
          full_name: patient_name,
          phone: patient_phone,
          role: 'patient',
          is_verified: false
        }, { transaction });

        await Patient.create({
          user_id: guestUser.id,
          date_of_birth: patient_dob,
          gender: patient_gender
        }, { transaction });

        patientId = guestUser.id;
      }

      // Get doctor user_id
      const doctor = await Doctor.findByPk(doctor_id);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Create appointment
      const consultationFee = doctor.consultation_price || 200000;
      
      const appointment = await Appointment.create({
        patient_id: patientId,
        doctor_id: doctor.user_id,
        appointment_date: timeSlot.date,
        time_slot: `${timeSlot.start_time}-${timeSlot.end_time}`,
        appointment_type: appointment_type || 'online',
        reason,
        symptoms,
        status: 'pending',
        amount: consultationFee,
        consultation_fee: consultationFee,
        is_paid: false,
        payment_status: 'pending'
      }, { transaction });

      // Book the time slot
      await timeSlot.book();

      await transaction.commit();

      // TODO: Send confirmation email

      res.json({
        success: true,
        message: 'Đặt lịch thành công!',
        data: {
          appointment_id: appointment.id,
          doctor_name: doctor.user ? doctor.user.full_name : 'N/A',
          appointment_date: appointment.appointment_date,
          time_slot: appointment.time_slot
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Create appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi tạo lịch hẹn',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /appointments/my-appointments - View user's appointments
   */
  async myAppointments(req, res) {
    try {
      if (!req.user) {
        return res.redirect('/login?redirect=/appointments/my-appointments');
      }

      const whereClause = req.user.role === 'doctor' 
        ? { doctor_id: req.user.id }
        : { patient_id: req.user.id };

      const appointments = await Appointment.findAll({
        where: whereClause,
        include: [
          { 
            model: User, 
            as: 'patient', 
            attributes: ['full_name', 'phone', 'email'] 
          },
          { 
            model: User, 
            as: 'doctor', 
            attributes: ['full_name', 'avatar'],
            include: [{
              model: Doctor,
              as: 'doctorProfile',
              include: [{ model: Specialty, as: 'specialty' }]
            }]
          }
        ],
        order: [['appointment_date', 'DESC'], ['time_slot', 'DESC']]
      });

      res.render('appointments/my-appointments', {
        pageTitle: 'Lịch Hẹn Của Tôi',
        currentPath: req.path,
        appointments,
        userRole: req.user.role,
        user: req.user
      });

    } catch (error) {
      console.error('My appointments error:', error);
      res.status(500).send('Lỗi tải lịch hẹn');
    }
  }

  /**
   * POST /appointments/:id/cancel - Cancel appointment
   */
  async cancelAppointment(req, res) {
    try {
      const { id } = req.params;
      const { cancellation_reason } = req.body;

      const appointment = await Appointment.findByPk(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Lịch hẹn không tồn tại'
        });
      }

      // Check permission
      if (appointment.patient_id !== req.user.id && appointment.doctor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền hủy lịch hẹn này'
        });
      }

      // Check if can cancel
      if (['completed', 'cancelled'].includes(appointment.status)) {
        return res.status(400).json({
          success: false,
          message: 'Không thể hủy lịch hẹn này'
        });
      }

      // Update appointment
      await appointment.update({
        status: 'cancelled',
        cancelled_by: req.user.id,
        cancellation_reason,
        cancelled_at: new Date()
      });

      // Release time slot
      const [slotStart] = appointment.time_slot.split('-');
      const timeSlot = await TimeSlot.findOne({
        where: {
          doctor_id: appointment.doctor_id,
          date: appointment.appointment_date,
          start_time: slotStart
        }
      });

      if (timeSlot) {
        await timeSlot.release();
      }

      res.json({
        success: true,
        message: 'Đã hủy lịch hẹn thành công'
      });

    } catch (error) {
      console.error('Cancel appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hủy lịch hẹn'
      });
    }
  }
}

module.exports = new BookingController();
