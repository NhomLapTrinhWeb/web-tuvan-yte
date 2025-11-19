// Doctor Controller
const { Doctor, User, Specialty, Schedule, Appointment, Review, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * @route GET /api/v1/doctors
 * @desc Search and filter doctors
 * @access Public
 */
exports.searchDoctors = async (req, res) => {
  try {
    const {
      search,
      specialty_id,
      min_price,
      max_price,
      sort_by = 'rating',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      is_approved: true
    };

    if (specialty_id) {
      whereClause.specialty_id = specialty_id;
    }

    if (min_price || max_price) {
      whereClause.consultation_price = {};
      if (min_price) whereClause.consultation_price[Op.gte] = min_price;
      if (max_price) whereClause.consultation_price[Op.lte] = max_price;
    }

    // Build user where clause for search
    const userWhereClause = {
      is_active: true
    };

    if (search) {
      userWhereClause.full_name = {
        [Op.like]: `%${search}%`
      };
    }

    // Build order clause
    let orderClause;
    switch (sort_by) {
      case 'price':
        orderClause = [['consultation_price', order.toUpperCase()]];
        break;
      case 'experience':
        orderClause = [['experience_years', order.toUpperCase()]];
        break;
      case 'rating':
      default:
        orderClause = [['rating_average', order.toUpperCase()]];
        break;
    }

    const { count, rows: doctors } = await Doctor.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          where: userWhereClause,
          attributes: ['full_name', 'avatar', 'phone', 'email']
        },
        {
          model: Specialty,
          attributes: ['id', 'name', 'slug']
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Format response
    const formattedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      full_name: doctor.User.full_name,
      avatar: doctor.User.avatar,
      specialty: {
        id: doctor.Specialty.id,
        name: doctor.Specialty.name
      },
      experience_years: doctor.experience_years,
      consultation_price: doctor.consultation_price,
      rating_average: doctor.rating_average,
      total_reviews: doctor.total_reviews,
      bio: doctor.bio,
      workplace: doctor.workplace
    }));

    res.json({
      success: true,
      data: formattedDoctors,
      metadata: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Search doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tìm kiếm bác sĩ'
    });
  }
};

/**
 * @route GET /api/v1/doctors/:id
 * @desc Get doctor detail
 * @access Public
 */
exports.getDoctorDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findOne({
      where: { id, is_approved: true },
      include: [
        {
          model: User,
          attributes: ['full_name', 'avatar', 'phone', 'email']
        },
        {
          model: Specialty,
          attributes: ['id', 'name', 'slug', 'description']
        },
        {
          model: Review,
          limit: 5,
          order: [['created_at', 'DESC']],
          include: [
            {
              model: Patient,
              include: [{
                model: User,
                attributes: ['full_name']
              }]
            }
          ]
        }
      ]
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }

    // Format reviews
    const formattedReviews = doctor.Reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      patient_name: review.is_anonymous 
        ? maskName(review.Patient.User.full_name)
        : review.Patient.User.full_name,
      response: review.response,
      created_at: review.created_at
    }));

    res.json({
      success: true,
      data: {
        id: doctor.id,
        full_name: doctor.User.full_name,
        email: doctor.User.email,
        phone: doctor.User.phone,
        avatar: doctor.User.avatar,
        specialty: {
          id: doctor.Specialty.id,
          name: doctor.Specialty.name,
          description: doctor.Specialty.description
        },
        bio: doctor.bio,
        experience_years: doctor.experience_years,
        education: doctor.education,
        workplace: doctor.workplace,
        license_number: doctor.license_number,
        consultation_price: doctor.consultation_price,
        rating_average: doctor.rating_average,
        total_reviews: doctor.total_reviews,
        total_appointments: doctor.total_appointments,
        reviews: formattedReviews
      }
    });

  } catch (error) {
    console.error('Get doctor detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

/**
 * @route GET /api/v1/doctors/:id/availability
 * @desc Get doctor availability for a specific date
 * @access Public
 */
exports.getDoctorAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngày cần kiểm tra'
      });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Get doctor's schedules for this day of week
    const schedules = await Schedule.findAll({
      where: {
        doctor_id: id,
        day_of_week: dayOfWeek,
        is_available: true
      }
    });

    if (schedules.length === 0) {
      return res.json({
        success: true,
        data: {
          date,
          day_of_week: dayOfWeek,
          doctor_id: id,
          schedules: [],
          message: 'Bác sĩ không làm việc vào ngày này'
        }
      });
    }

    // Get existing appointments for this date
    const existingAppointments = await Appointment.findAll({
      where: {
        doctor_id: id,
        appointment_date: date,
        status: {
          [Op.in]: ['pending', 'confirmed']
        }
      },
      attributes: ['time_slot']
    });

    const bookedSlots = existingAppointments.map(apt => apt.time_slot);

    // Generate time slots for each schedule
    const schedulesWithSlots = schedules.map(schedule => {
      const slots = generateTimeSlots(
        schedule.start_time,
        schedule.end_time,
        schedule.slot_duration
      );

      const slotsWithAvailability = slots.map(slot => ({
        time_slot: slot,
        is_available: !bookedSlots.includes(slot)
      }));

      return {
        time_range: `${schedule.start_time}-${schedule.end_time}`,
        slots: slotsWithAvailability
      };
    });

    res.json({
      success: true,
      data: {
        date,
        day_of_week: dayOfWeek,
        doctor_id: parseInt(id),
        schedules: schedulesWithSlots
      }
    });

  } catch (error) {
    console.error('Get doctor availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

/**
 * @route GET /api/v1/doctors/me/schedules
 * @desc Get doctor's own schedules
 * @access Private (Doctor)
 */
exports.getMySchedules = async (req, res) => {
  try {
    const doctorId = req.user.doctorId;

    const schedules = await Schedule.findAll({
      where: { doctor_id: doctorId },
      order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
    });

    const formattedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      day_of_week: schedule.day_of_week,
      day_name: getDayName(schedule.day_of_week),
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      slot_duration: schedule.slot_duration,
      max_patients_per_slot: schedule.max_patients_per_slot,
      is_available: schedule.is_available
    }));

    res.json({
      success: true,
      data: formattedSchedules
    });

  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

/**
 * @route POST /api/v1/doctors/me/schedules
 * @desc Update doctor's schedules
 * @access Private (Doctor)
 */
exports.updateSchedules = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const doctorId = req.user.doctorId;
    const { schedules } = req.body;

    // Delete existing schedules
    await Schedule.destroy({
      where: { doctor_id: doctorId },
      transaction
    });

    // Create new schedules
    const newSchedules = schedules.map(schedule => ({
      doctor_id: doctorId,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      slot_duration: schedule.slot_duration || 30,
      max_patients_per_slot: schedule.max_patients_per_slot || 1,
      is_available: schedule.is_available !== false
    }));

    await Schedule.bulkCreate(newSchedules, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Cập nhật lịch làm việc thành công'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Update schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật lịch'
    });
  }
};

/**
 * @route GET /api/v1/doctors/me/statistics
 * @desc Get doctor's statistics
 * @access Private (Doctor)
 */
exports.getStatistics = async (req, res) => {
  try {
    const doctorId = req.user.doctorId;
    const { start_date, end_date } = req.query;

    const whereClause = { doctor_id: doctorId };
    
    if (start_date && end_date) {
      whereClause.appointment_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    // Get appointment statistics
    const totalAppointments = await Appointment.count({ where: whereClause });
    
    const completedAppointments = await Appointment.count({
      where: { ...whereClause, status: 'completed' }
    });

    const cancelledAppointments = await Appointment.count({
      where: { ...whereClause, status: 'cancelled' }
    });

    const upcomingAppointments = await Appointment.count({
      where: {
        doctor_id: doctorId,
        appointment_date: {
          [Op.gte]: new Date()
        },
        status: {
          [Op.in]: ['pending', 'confirmed']
        }
      }
    });

    // Calculate revenue
    const completedAppointmentIds = await Appointment.findAll({
      where: { ...whereClause, status: 'completed' },
      attributes: ['id']
    });

    const ids = completedAppointmentIds.map(apt => apt.id);
    
    const totalRevenue = await Transaction.sum('amount', {
      where: {
        appointment_id: {
          [Op.in]: ids
        },
        status: 'paid'
      }
    });

    // Get doctor info for rating
    const doctor = await Doctor.findByPk(doctorId, {
      attributes: ['rating_average', 'total_reviews']
    });

    // Get new reviews count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newReviews = await Review.count({
      where: {
        doctor_id: doctorId,
        created_at: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    res.json({
      success: true,
      data: {
        total_appointments: totalAppointments,
        completed_appointments: completedAppointments,
        cancelled_appointments: cancelledAppointments,
        total_revenue: totalRevenue || 0,
        average_rating: doctor.rating_average,
        total_reviews: doctor.total_reviews,
        new_reviews: newReviews,
        upcoming_appointments: upcomingAppointments
      }
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

// Utility functions
function generateTimeSlots(startTime, endTime, duration) {
  const slots = [];
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  for (let i = start; i < end; i += duration) {
    const slotStart = minutesToTime(i);
    const slotEnd = minutesToTime(i + duration);
    slots.push(`${slotStart}-${slotEnd}`);
  }

  return slots;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function getDayName(dayOfWeek) {
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[dayOfWeek];
}

function maskName(fullName) {
  if (!fullName) return 'Ẩn danh';
  const parts = fullName.split(' ');
  if (parts.length === 1) {
    return fullName[0] + '***';
  }
  return parts[0] + ' ' + parts[parts.length - 1][0] + '***';
}

module.exports = exports;
