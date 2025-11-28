// Appointment Service - Business Logic for Booking System
const { Appointment, Doctor, Patient, Schedule, User, Specialty, MedicalRecord, Transaction, sequelize } = require('../models');
const { Op } = require('sequelize');

class AppointmentService {
  /**
   * Check if a time slot is available for booking
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
        // Có thể bác sĩ nghỉ ngày này, coi như không có slot
        return false;
      }

      // Step 2: Check if time slot is within doctor's working hours
      const [slotStart, slotEnd] = timeSlot.split('-');
      const scheduleStart = schedule.start_time.substring(0, 5); // HH:MM
      const scheduleEnd = schedule.end_time.substring(0, 5);

      if (slotStart < scheduleStart || slotEnd > scheduleEnd) {
        return false;
      }

      // Step 3: Check if slot is already booked
      const existingAppointment = await Appointment.findOne({
        where: {
          doctor_id: doctorId,
          appointment_date: date,
          time_slot: timeSlot,
          status: {
            [Op.in]: ['pending', 'confirmed']
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

      if (appointmentsInSlot >= (schedule.max_patients_per_slot || 1)) {
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
          schedule.slot_duration || 30
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

  static timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

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
              // 👇 SỬA LỖI: Thêm as: 'user'
              { model: User, as: 'user', attributes: ['full_name', 'avatar', 'phone'] },
              { model: Specialty, as: 'specialty' }
            ]
          },
          {
            model: Patient,
            // 👇 SỬA LỖI: Thêm as: 'user'
            include: [{ model: User, as: 'user', attributes: ['full_name', 'phone'] }]
          },
          { model: MedicalRecord, as: 'medicalRecord' },
          { model: Transaction, as: 'transaction' }
        ]
      });

      if (!appointment) {
        return null;
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
          // 👇 SỬA LỖI: Thêm as: 'user' cho cả 2 model
          { model: Patient, include: [{ model: User, as: 'user' }] },
          { model: Doctor, include: [{ model: User, as: 'user' }] }
        ]
      });

      if (!appointment) throw new Error('Không tìm thấy lịch hẹn');

      // Update appointment
      appointment.status = 'cancelled';
      appointment.cancellation_reason = reason;
      appointment.cancelled_by = userId;
      appointment.cancelled_at = new Date();
      await appointment.save({ transaction });

      return true;

    } catch (error) {
      console.error('Cancel appointment error:', error);
      throw error;
    }
  }

  /**
   * Send appointment reminder (CRON Job)
   */
  static async sendAppointmentReminder() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await Appointment.findAll({
        where: {
          appointment_date: {
            [Op.eq]: tomorrow.toISOString().split('T')[0]
          },
          status: 'confirmed'
        },
        include: [
          {
            model: Patient,
            // 👇 SỬA LỖI: Thêm as: 'user'
            include: [{ model: User, as: 'user', attributes: ['full_name', 'email'] }]
          },
          {
            model: Doctor,
            // 👇 SỬA LỖI: Thêm as: 'user'
            include: [{ model: User, as: 'user', attributes: ['full_name', 'email'] }]
          }
        ]
      });

      // Chỉ log ra để test, chưa gửi mail thật để tránh lỗi config
      console.log(`[CRON] Tìm thấy ${appointments.length} lịch hẹn cần nhắc nhở cho ngày mai.`);

      for(const app of appointments) {
          // Lưu ý: Vì dùng alias 'user' nên phải gọi là app.Patient.user (chữ thường)
          if(app.Patient && app.Patient.user) {
              console.log(` -> Gửi nhắc nhở cho Bệnh nhân: ${app.Patient.user.full_name}`);
          }
          if(app.Doctor && app.Doctor.user) {
              console.log(` -> Gửi nhắc nhở cho Bác sĩ: ${app.Doctor.user.full_name}`);
          }
      }

    } catch (error) {
      console.error('Send reminder error:', error.message);
    }
  }
}

module.exports = AppointmentService;