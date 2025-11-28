const { Doctor, Specialty, User, Appointment, Patient } = require('../models');

const appointmentController = {
  // 1. GET: Hiển thị trang đặt lịch
  create: async (req, res) => {
    try {
      // Lấy danh sách bác sĩ và chuyên khoa
      const doctors = await Doctor.findAll({
        include: [
          { model: User, as: 'user', attributes: ['full_name'] },
          { model: Specialty, as: 'specialty', attributes: ['name'] }
        ]
      });

      const specialties = await Specialty.findAll();

      // Render giao diện
      res.render('appointments/booking', {
        title: 'Đặt Lịch Khám',
        doctors,
        specialties,
        user: res.locals.user
      });
    } catch (error) {
      console.error('Show booking error:', error);
      res.status(500).send('Lỗi server: ' + error.message);
    }
  },

  // 2. POST: Xử lý lưu lịch hẹn (Code an toàn)
  store: async (req, res) => {
    try {
      const { doctor_id, appointment_date, time_slot, reason } = req.body;

      // Kiểm tra xem người dùng có đăng nhập không
      const currentUser = req.user || (req.session && req.session.user);

      if (!currentUser) {
          return res.status(401).json({
              success: false,
              message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!'
          });
      }

      // Lấy ID bệnh nhân
      let patientId = null;

      // Cách 1: Token
      if (currentUser.patientId) {
          patientId = currentUser.patientId;
      }
      // Cách 2: Session
      else if (currentUser.patientProfile) {
          patientId = currentUser.patientProfile.id;
      }
      // Cách 3: Tìm trong DB
      else {
          const patient = await Patient.findOne({ where: { user_id: currentUser.id } });
          if(patient) patientId = patient.id;
      }

      if (!patientId) {
         return res.status(400).json({
             success: false,
             message: 'Lỗi: Tài khoản của bạn chưa có hồ sơ bệnh nhân. Hãy liên hệ Admin.'
         });
      }

      // Tạo lịch hẹn
      await Appointment.create({
        patient_id: patientId,
        doctor_id,
        appointment_date,
        time_slot,
        reason,
        status: 'pending'
      });

      return res.json({
        success: true,
        message: 'Đặt lịch thành công! Vui lòng chờ bác sĩ xác nhận.'
      });

    } catch (error) {
      console.error('Booking error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server: ' + error.message
      });
    }
  },

  // 3. GET: Xem lịch sử khám bệnh
    index: async (req, res) => {
      try {
        const user = req.user || req.session.user;
        if (!user) return res.redirect('/login');

        // 👇 PHÂN LUỒNG NGƯỜI DÙNG 👇
        if (user.role === 'admin') {
            return res.redirect('/admin/appointments');
        }
        if (user.role === 'doctor') {
            return res.redirect('/doctor/appointments');
        }
        // ----------------------------

        // Logic cũ dành cho Bệnh nhân (giữ nguyên đoạn dưới)
        // Tìm Patient ID
        let patientId = null;
        if (user.patientId) patientId = user.patientId;
        else if (user.patientProfile) patientId = user.patientProfile.id;
        else {
            const patient = await Patient.findOne({ where: { user_id: user.id } });
            if(patient) patientId = patient.id;
        }

        const appointments = await Appointment.findAll({
          where: { patient_id: patientId },
          include: [
            {
              model: Doctor,
              include: [
                  { model: User, as: 'user', attributes: ['full_name', 'avatar'] },
                  { model: Specialty, as: 'specialty', attributes: ['name'] }
              ]
            }
          ],
          order: [['appointment_date', 'DESC']]
        });

        res.render('appointments/index', {
          pageTitle: 'Lịch sử khám bệnh',
          appointments,
          user
        });

      } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi server');
      }
    }

}; // <--- Lỗi của bạn trước đó khả năng cao là thiếu dấu này

module.exports = appointmentController;