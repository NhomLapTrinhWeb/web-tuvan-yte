// Controller lịch hẹn
const { Appointment, Doctor, Patient, User, Schedule, sequelize } = require('../models');
const { Op } = require('sequelize');
const AppointmentService = require('../services/AppointmentService');
const PaymentService = require('../services/PaymentService');
const NotificationService = require('../services/NotificationService');

/**
 * @route POST /api/v1/appointments
 * @desc Create new appointment (For Patient)
 * @access Private (Patient)
 */
exports.createAppointment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { doctor_id, appointment_date, time_slot, appointment_type, reason, symptoms } = req.body;
    const patientId = req.user.patientId; // From auth middleware

    // 1. Validate doctor exists and is approved
    const doctor = await Doctor.findOne({
      where: { id: doctor_id, is_approved: true },
      include: [{ model: User, where: { is_active: true } }]
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Bác sĩ không tồn tại hoặc chưa được duyệt'
      });
    }

    // 2. Check if time slot is available
    const isAvailable = await AppointmentService.checkTimeSlotAvailability(
      doctor_id,
      appointment_date,
      time_slot
    );

    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'Khung giờ này đã được đặt. Vui lòng chọn giờ khác.',
        code: 'TIME_SLOT_UNAVAILABLE'
      });
    }

    // 3. Create appointment
    const appointment = await Appointment.create({
      patient_id: patientId,
      doctor_id,
      appointment_date,
      time_slot,
      appointment_type,
      reason,
      symptoms,
      status: 'pending'
    }, { transaction });

    // 4. Create payment transaction
    const payment = await PaymentService.createTransaction({
      appointment_id: appointment.id,
      amount: doctor.consultation_price,
      payment_method: req.body.payment_method || 'vnpay'
    }, { transaction });

    // 5. Send notification to doctor
    await NotificationService.sendNotification({
      user_id: doctor.user_id,
      title: 'Lịch hẹn mới',
      message: `Bạn có lịch hẹn mới vào ${appointment_date} lúc ${time_slot}`,
      type: 'appointment',
      related_id: appointment.id
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Đặt lịch thành công',
      data: {
        appointment: {
          id: appointment.id,
          appointment_date: appointment.appointment_date,
          time_slot: appointment.time_slot,
          status: appointment.status,
          doctor: {
            id: doctor.id,
            full_name: doctor.User.full_name
          }
        },
        payment: {
          transaction_id: payment.id,
          amount: payment.amount,
          payment_url: payment.payment_url,
          qr_code: payment.qr_code
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi đặt lịch',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route GET /api/v1/appointments/my
 * @desc Get patient's appointments
 * @access Private (Patient)
 */
exports.getMyAppointments = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { patient_id: patientId };
    if (status !== 'all') {
      whereClause.status = status;
    }

    const { count, rows: appointments } = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Doctor,
          include: [{ model: User, attributes: ['full_name', 'avatar'] }]
        }
      ],
      order: [['appointment_date', 'DESC'], ['time_slot', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: appointments,
      metadata: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách lịch hẹn'
    });
  }
};

/**
 * @route GET /api/v1/appointments/:id
 * @desc Get appointment detail
 * @access Private
 */
exports.getAppointmentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await AppointmentService.getAppointmentDetail(id, req.user);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    res.json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('Get appointment detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

/**
 * @route POST /api/v1/appointments/:id/cancel
 * @desc Cancel appointment
 * @access Private
 */
exports.cancelAppointment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const result = await AppointmentService.cancelAppointment(
      id,
      req.user.id,
      cancellation_reason,
      transaction
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Hủy lịch hẹn thành công',
      data: result
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Cancel appointment error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Có lỗi xảy ra khi hủy lịch hẹn'
    });
  }
};

/**
 * @route POST /api/v1/appointments/:id/confirm
 * @desc Confirm appointment (For Doctor)
 * @access Private (Doctor)
 */
exports.confirmAppointment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const doctorId = req.user.doctorId;

    const appointment = await Appointment.findOne({
      where: { id, doctor_id: doctorId, status: 'pending' }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn hoặc lịch hẹn đã được xử lý'
      });
    }

    // Generate meeting link for online appointments
    let meetingLink = null;
    if (appointment.appointment_type === 'online') {
      meetingLink = await AppointmentService.generateMeetingLink(appointment.id);
      appointment.meeting_link = meetingLink;
      appointment.meeting_room_id = `room-${appointment.id}`;
    }

    appointment.status = 'confirmed';
    appointment.confirmed_at = new Date();
    await appointment.save({ transaction });

    // Notify patient
    await NotificationService.sendNotification({
      user_id: appointment.Patient.user_id,
      title: 'Lịch hẹn được xác nhận',
      message: `Lịch hẹn của bạn đã được bác sĩ xác nhận`,
      type: 'appointment',
      related_id: appointment.id
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Xác nhận lịch hẹn thành công',
      data: {
        meeting_link: meetingLink
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Confirm appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

/**
 * @route POST /api/v1/appointments/:id/reject
 * @desc Reject appointment (For Doctor)
 * @access Private (Doctor)
 */
exports.rejectAppointment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const doctorId = req.user.doctorId;

    const appointment = await Appointment.findOne({
      where: { id, doctor_id: doctorId, status: 'pending' }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellation_reason = reason;
    appointment.cancelled_by = req.user.id;
    appointment.cancelled_at = new Date();
    await appointment.save({ transaction });

    // Process refund if paid
    const transaction_record = await Transaction.findOne({
      where: { appointment_id: id, status: 'paid' }
    });

    if (transaction_record) {
      await PaymentService.processRefund(transaction_record.id, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Đã từ chối lịch hẹn'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Reject appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

/**
 * @route GET /api/v1/appointments/doctor/my
 * @desc Get doctor's appointments
 * @access Private (Doctor)
 */
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.doctorId;
    const { date, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { doctor_id: doctorId };
    
    if (date) {
      whereClause.appointment_date = date;
    }
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const { count, rows: appointments } = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          include: [{ model: User, attributes: ['full_name', 'phone', 'avatar'] }]
        }
      ],
      order: [['appointment_date', 'ASC'], ['time_slot', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: appointments,
      metadata: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });

  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

// Legacy methods for web views (keep for backward compatibility)
exports.create = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({ where: { is_active: true } });
    res.render('appointments/booking', { doctors });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.store = async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot, reason } = req.body;
    const userId = req.session.userId;

    await Appointment.create({
      userId,
      doctorId,
      appointmentDate,
      timeSlot,
      reason
    });

    res.redirect('/appointments/history');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.history = async (req, res) => {
  try {
    const userId = req.session.userId;
    const appointments = await Appointment.findAll({
      where: { userId },
      include: [Doctor],
      order: [['appointmentDate', 'DESC']]
    });

    res.render('appointments/history', { appointments });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};
