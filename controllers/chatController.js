const { Message, User, Appointment, Patient, Doctor, Specialty } = require('../models');

const chatController = {
  // 1. Hiển thị giao diện Chat
  index: async (req, res) => {
    try {
      // Bắt buộc đăng nhập
      const currentUser = res.locals.user || req.user;
      if (!currentUser) {
        return res.redirect('/login?redirect=/chat');
      }

      let appointments = [];

      // Lấy danh sách cuộc hội thoại dựa trên role
      if (currentUser.role === 'patient') {
        // Bệnh nhân: Lấy appointments của họ
        const patient = await Patient.findOne({ where: { user_id: currentUser.id } });
        
        if (patient) {
          const rawAppointments = await Appointment.findAll({
            where: { 
              patient_id: patient.id,
              status: ['confirmed', 'in_progress', 'completed'] // Chỉ lấy lịch đã xác nhận
            },
            include: [
              {
                model: Doctor,
                include: [
                  { model: User, as: 'user', attributes: ['id', 'full_name', 'avatar'] },
                  { model: Specialty, as: 'specialty', attributes: ['name'] }
                ]
              }
            ],
            order: [['appointment_date', 'DESC']],
            limit: 20
          });

          appointments = rawAppointments.map(apt => ({
            id: apt.id,
            doctor_id: apt.Doctor ? apt.Doctor.user_id : null,
            doctorName: apt.Doctor && apt.Doctor.user ? `BS. ${apt.Doctor.user.full_name}` : 'Bác sĩ',
            avatar: apt.Doctor && apt.Doctor.user ? apt.Doctor.user.avatar : null,
            specialty: apt.Doctor && apt.Doctor.specialty ? apt.Doctor.specialty.name : '',
            date: apt.appointment_date,
            status: apt.status
          }));
        }
      } else if (currentUser.role === 'doctor') {
        // Bác sĩ: Lấy appointments họ phụ trách
        const doctor = await Doctor.findOne({ where: { user_id: currentUser.id } });
        
        if (doctor) {
          const rawAppointments = await Appointment.findAll({
            where: { 
              doctor_id: doctor.id,
              status: ['confirmed', 'in_progress', 'completed']
            },
            include: [
              {
                model: Patient,
                include: [
                  { model: User, as: 'user', attributes: ['id', 'full_name', 'avatar', 'phone'] }
                ]
              }
            ],
            order: [['appointment_date', 'DESC']],
            limit: 20
          });

          appointments = rawAppointments.map(apt => ({
            id: apt.id,
            patient_id: apt.Patient ? apt.Patient.user_id : null,
            patientName: apt.Patient && apt.Patient.user ? apt.Patient.user.full_name : 'Bệnh nhân',
            avatar: apt.Patient && apt.Patient.user ? apt.Patient.user.avatar : null,
            phone: apt.Patient && apt.Patient.user ? apt.Patient.user.phone : '',
            date: apt.appointment_date,
            status: apt.status
          }));
        }
      }

      res.render('chat/index', {
        pageTitle: 'Tư vấn trực tuyến',
        user: currentUser,
        appointments: appointments
      });

    } catch (error) {
      console.error('Chat index error:', error);
      res.status(500).render('errors/500', { 
        pageTitle: 'Lỗi', 
        message: 'Không thể tải trang chat' 
      });
    }
  },

  // 2. API: Lấy lịch sử tin nhắn
  getHistory: async (req, res) => {
    try {
      const { appointmentId } = req.params;

      if (!appointmentId) {
        return res.json({ success: true, data: [] });
      }

      const messages = await Message.findAll({
        where: { appointment_id: appointmentId },
        include: [
          // Lấy thông tin người gửi để hiện Avatar/Tên
          { model: User, as: 'sender', attributes: ['id', 'full_name', 'avatar'] }
        ],
        order: [['created_at', 'ASC']] // Tin cũ hiện trước
      });

      res.json({ success: true, data: messages });
    } catch (error) {
      console.error('Get chat history error:', error);
      res.status(500).json({ success: false, message: 'Lỗi tải tin nhắn' });
    }
  }
};

module.exports = chatController;