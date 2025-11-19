// Appointment Service - Business Logic for Booking System
const { Appointment, Doctor, Patient, Schedule, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class AppointmentService {
  /**
   * Check if a time slot is available for booking
   * @param {number} doctorId 
   * @param {string} date - Format: YYYY-MM-DD
   * @param {string} timeSlot - Format: HH:MM-HH:MM
   * @returns {Promise<boolean>}
   */
  static async checkTimeSlotAvailability(doctorId, date, timeSlot) {
    try {
      // Step 1: Check if doctor has schedule for this day
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();

      const schedule = await Schedule.findOne({
        where: {
          doctor_id: doctorId,
          day_of_week: dayOfWeek,
          is_available: true
        }
      });

      if (!schedule) {
        throw new Error('Bác sĩ không làm việc vào ngày này');
      }

      // Step 2: Check if time slot is within doctor's working hours
      const [slotStart, slotEnd] = timeSlot.split('-');
      const scheduleStart = schedule.start_time.substring(0, 5); // HH:MM
      const scheduleEnd = schedule.end_time.substring(0, 5);

      if (slotStart < scheduleStart || slotEnd > scheduleEnd) {
        throw new Error('Khung giờ không nằm trong lịch làm việc của bác sĩ');
      }

      // Step 3: Check if slot is already booked
      const existingAppointment = await Appointment.findOne({
        where: {
          doctor_id: doctorId,
          appointment_date: date,
          time_slot: timeSlot,
          status: {
            [Op.in]: ['pending', 'confirmed'] // Don't check cancelled/completed
          }
        }
      });

      if (existingAppointment) {
        return false; // Slot is taken
      }

      // Step 4: Check max patients per slot (if applicable)
      const appointmentsInSlot = await Appointment.count({
        where: {
          doctor_id: doctorId,
          appointment_date: date,
          time_slot: timeSlot,
          status: {
            [Op.in]: ['pending', 'confirmed']
          }
        }
      });

      if (appointmentsInSlot >= schedule.max_patients_per_slot) {
        return false; // Slot is full
      }

      return true; // Slot is available

    } catch (error) {
      console.error('Check availability error:', error);
      throw error;
    }
  }

  /**
   * Get available time slots for a doctor on a specific date
   * @param {number} doctorId 
   * @param {string} date 
   * @returns {Promise<Array>}
   */
  static async getAvailableSlots(doctorId, date) {
    try {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();

      // Get doctor's schedules for this day
      const schedules = await Schedule.findAll({
        where: {
          doctor_id: doctorId,
          day_of_week: dayOfWeek,
          is_available: true
        }
      });

      if (schedules.length === 0) {
        return [];
      }

      // Get all booked slots for this date
      const bookedAppointments = await Appointment.findAll({
        where: {
          doctor_id: doctorId,
          appointment_date: date,
          status: {
            [Op.in]: ['pending', 'confirmed']
          }
        },
        attributes: ['time_slot']
      });

      const bookedSlots = bookedAppointments.map(apt => apt.time_slot);

      // Generate all possible slots
      const allSlots = [];
      
      for (const schedule of schedules) {
        const slots = this.generateTimeSlots(
          schedule.start_time,
          schedule.end_time,
          schedule.slot_duration
        );

        const slotsWithAvailability = slots.map(slot => ({
          time_slot: slot,
          is_available: !bookedSlots.includes(slot)
        }));

        allSlots.push(...slotsWithAvailability);
      }

      return allSlots;

    } catch (error) {
      console.error('Get available slots error:', error);
      throw error;
    }
  }

  /**
   * Generate time slots between start and end time
   * @param {string} startTime - HH:MM:SS
   * @param {string} endTime - HH:MM:SS
   * @param {number} duration - minutes
   * @returns {Array<string>}
   */
  static generateTimeSlots(startTime, endTime, duration) {
    const slots = [];
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    for (let i = start; i < end; i += duration) {
      const slotStart = this.minutesToTime(i);
      const slotEnd = this.minutesToTime(i + duration);
      slots.push(`${slotStart}-${slotEnd}`);
    }

    return slots;
  }

  /**
   * Convert time string to minutes
   */
  static timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes to time string
   */
  static minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * Get appointment detail with all related data
   */
  static async getAppointmentDetail(appointmentId, user) {
    try {
      const appointment = await Appointment.findByPk(appointmentId, {
        include: [
          {
            model: Doctor,
            include: [
              { model: User, attributes: ['full_name', 'avatar', 'phone'] },
              { model: Specialty }
            ]
          },
          {
            model: Patient,
            include: [{ model: User, attributes: ['full_name', 'phone'] }]
          },
          { model: MedicalRecord },
          { model: Transaction }
        ]
      });

      if (!appointment) {
        return null;
      }

      // Authorization check
      if (user.role === 'patient' && appointment.patient_id !== user.patientId) {
        throw new Error('Không có quyền truy cập');
      }

      if (user.role === 'doctor' && appointment.doctor_id !== user.doctorId) {
        throw new Error('Không có quyền truy cập');
      }

      return appointment;

    } catch (error) {
      console.error('Get appointment detail error:', error);
      throw error;
    }
  }

  /**
   * Cancel appointment
   */
  static async cancelAppointment(appointmentId, userId, reason, transaction) {
    try {
      const appointment = await Appointment.findByPk(appointmentId, {
        include: [
          { model: Patient, include: [User] },
          { model: Doctor, include: [User] }
        ]
      });

      if (!appointment) {
        const error = new Error('Không tìm thấy lịch hẹn');
        error.statusCode = 404;
        throw error;
      }

      // Check if appointment can be cancelled
      if (appointment.status === 'completed') {
        const error = new Error('Không thể hủy lịch hẹn đã hoàn thành');
        error.statusCode = 400;
        throw error;
      }

      if (appointment.status === 'cancelled') {
        const error = new Error('Lịch hẹn đã được hủy trước đó');
        error.statusCode = 400;
        throw error;
      }

      // Check cancellation time (24 hours before)
      const appointmentDateTime = new Date(appointment.appointment_date);
      const [startTime] = appointment.time_slot.split('-');
      const [hours, minutes] = startTime.split(':');
      appointmentDateTime.setHours(hours, minutes);

      const now = new Date();
      const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);

      if (hoursUntilAppointment < 24) {
        const error = new Error('Chỉ có thể hủy lịch trước 24 giờ');
        error.statusCode = 400;
        throw error;
      }

      // Update appointment
      appointment.status = 'cancelled';
      appointment.cancellation_reason = reason;
      appointment.cancelled_by = userId;
      appointment.cancelled_at = new Date();
      await appointment.save({ transaction });

      // Process refund if paid
      const paymentTransaction = await Transaction.findOne({
        where: {
          appointment_id: appointmentId,
          status: 'paid'
        }
      });

      let refundInfo = null;
      if (paymentTransaction) {
        refundInfo = await PaymentService.processRefund(
          paymentTransaction.id,
          { transaction }
        );
      }

      // Send notifications
      await NotificationService.sendNotification({
        user_id: appointment.Patient.user_id,
        title: 'Lịch hẹn đã bị hủy',
        message: `Lịch hẹn của bạn vào ${appointment.appointment_date} đã bị hủy. ${reason}`,
        type: 'appointment',
        related_id: appointmentId
      }, { transaction });

      await NotificationService.sendNotification({
        user_id: appointment.Doctor.user_id,
        title: 'Lịch hẹn bị hủy',
        message: `Bệnh nhân đã hủy lịch hẹn vào ${appointment.appointment_date}`,
        type: 'appointment',
        related_id: appointmentId
      }, { transaction });

      return {
        refund_status: refundInfo ? 'processing' : null,
        refund_amount: refundInfo ? refundInfo.amount : null
      };

    } catch (error) {
      console.error('Cancel appointment error:', error);
      throw error;
    }
  }

  /**
   * Generate meeting link for online consultation
   */
  static async generateMeetingLink(appointmentId) {
    // Integration with video call service (ZegoCloud, Jitsi, etc.)
    // For now, return a placeholder
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    return `${baseUrl}/video-call/room-${appointmentId}`;
  }

  /**
   * Send appointment reminder
   */
  static async sendAppointmentReminder() {
    try {
      // Find appointments that are 1 hour away and reminder not sent
      const oneHourFromNow = new Date();
      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

      const appointments = await Appointment.findAll({
        where: {
          appointment_date: {
            [Op.eq]: oneHourFromNow.toISOString().split('T')[0]
          },
          status: 'confirmed',
          reminder_sent: false
        },
        include: [
          { model: Patient, include: [User] },
          { model: Doctor, include: [User] }
        ]
      });

      for (const appointment of appointments) {
        const [startTime] = appointment.time_slot.split('-');
        const appointmentDateTime = new Date(appointment.appointment_date);
        const [hours, minutes] = startTime.split(':');
        appointmentDateTime.setHours(hours, minutes);

        const timeDiff = appointmentDateTime - new Date();
        const minutesUntil = Math.floor(timeDiff / (1000 * 60));

        if (minutesUntil <= 60 && minutesUntil > 0) {
          // Send notification
          await NotificationService.sendNotification({
            user_id: appointment.Patient.user_id,
            title: 'Nhắc nhở lịch hẹn',
            message: `Lịch hẹn của bạn với ${appointment.Doctor.User.full_name} sẽ bắt đầu trong ${minutesUntil} phút`,
            type: 'reminder',
            related_id: appointment.id,
            action_url: appointment.meeting_link
          });

          await NotificationService.sendNotification({
            user_id: appointment.Doctor.user_id,
            title: 'Nhắc nhở lịch hẹn',
            message: `Bạn có lịch hẹn với bệnh nhân ${appointment.Patient.User.full_name} trong ${minutesUntil} phút`,
            type: 'reminder',
            related_id: appointment.id,
            action_url: appointment.meeting_link
          });

          // Mark reminder as sent
          appointment.reminder_sent = true;
          await appointment.save();
        }
      }

      console.log(`Sent ${appointments.length} appointment reminders`);

    } catch (error) {
      console.error('Send reminder error:', error);
    }
  }
}

module.exports = AppointmentService;
