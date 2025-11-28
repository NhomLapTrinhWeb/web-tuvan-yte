const { Doctor, User, Specialty, Department, Appointment, Patient } = require('../models');
const { Op } = require('sequelize');

const doctorController = {
  // 1. Hiển thị danh sách bác sĩ (Public)
  index: async (req, res) => {
    try {
      const { specialty, search } = req.query;
      const whereClause = { is_approved: true };
      const userWhereClause = { is_active: true };

      if (specialty) {
        const specialtyData = await Specialty.findOne({ where: { slug: specialty } });
        if (specialtyData) whereClause.specialty_id = specialtyData.id;
      }

      if (search) {
          userWhereClause.full_name = { [Op.like]: `%${search}%` };
      }

      const doctors = await Doctor.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'avatar', 'email'],
            where: userWhereClause
          },
          { model: Specialty, as: 'specialty', attributes: ['name', 'slug'] },
          { model: Department, as: 'department', attributes: ['name'] }
        ],
        order: [['created_at', 'DESC']]
      });

      const specialties = await Specialty.findAll();

      res.render('doctors/index', {
        pageTitle: 'Đội ngũ Bác sĩ',
        doctors,
        specialties,
        currentSpecialty: specialty
      });

    } catch (error) {
      console.error('Get doctors error:', error);
      res.status(500).send('Lỗi server: ' + error.message);
    }
  },

  // 2. Hiển thị chi tiết (Public)
  show: async (req, res) => {
    try {
      const { id } = req.params;
      const doctor = await Doctor.findOne({
        where: { id, is_approved: true },
        include: [
          { model: User, as: 'user', attributes: ['full_name', 'avatar', 'email', 'phone'] },
          { model: Specialty, as: 'specialty' },
          { model: Department, as: 'department' }
        ]
      });

      if (!doctor) {
        return res.status(404).render('errors/404', { pageTitle: 'Không tìm thấy bác sĩ' });
      }

      res.render('doctors/show', {
        pageTitle: `BS. ${doctor.user.full_name}`,
        doctor
      });
    } catch (error) {
      console.error('Get doctor detail error:', error);
      res.status(500).send('Lỗi server');
    }
  },

  // 3. Dashboard Bác sĩ (Private)
  getDashboard: async (req, res) => {
    try {
      const user = req.user || req.session.user;
      const doctor = await Doctor.findOne({ where: { user_id: user.id } });

      if (!doctor) return res.send("Bạn chưa có hồ sơ bác sĩ.");

      const appointmentCount = await Appointment.count({ where: { doctor_id: doctor.id } });
      const pendingCount = await Appointment.count({ where: { doctor_id: doctor.id, status: 'pending' } });

      res.render('doctor/dashboard', {
        pageTitle: 'Bàn làm việc Bác sĩ',
        user,
        stats: { total: appointmentCount, pending: pendingCount }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Lỗi server');
    }
  }, // <--- DẤU PHẨY NÀY LÀ CÁI BẠN ĐANG THIẾU

  // 4. Xem danh sách lịch hẹn của Bác sĩ
  getAppointments: async (req, res) => {
    try {
      const user = req.user || req.session.user;

      // Tìm Doctor ID dựa trên User ID
      const doctor = await Doctor.findOne({ where: { user_id: user.id } });
      if (!doctor) return res.send("Lỗi: Không tìm thấy hồ sơ bác sĩ.");

      // Lấy danh sách lịch hẹn
      const appointments = await Appointment.findAll({
        where: { doctor_id: doctor.id },
        include: [
          {
            model: Patient,
            include: [{ model: User, as: 'user', attributes: ['full_name', 'phone', 'email', 'avatar'] }]
          }
        ],
        order: [['appointment_date', 'DESC'], ['time_slot', 'ASC']]
      });

      res.render('doctor/appointments/index', {
        pageTitle: 'Quản lý Lịch khám',
        appointments
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Lỗi server: ' + error.message);
    }
  },

  // 5. Xử lý Duyệt/Hủy lịch hẹn (API)
  updateAppointmentStatus: async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await Appointment.update(
            { status: status },
            { where: { id: id } }
        );

        res.json({ success: true, message: 'Cập nhật thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // ... (Các hàm cũ giữ nguyên)

    // 6. Xem danh sách Bệnh nhân của tôi
    getPatients: async (req, res) => {
      try {
        const user = req.user || req.session.user;

        // 1. Tìm thông tin Bác sĩ
        const doctor = await Doctor.findOne({ where: { user_id: user.id } });
        if (!doctor) return res.send("Lỗi: Không tìm thấy hồ sơ bác sĩ.");

        // 2. Lấy tất cả lịch hẹn của bác sĩ này (kèm thông tin bệnh nhân)
        const appointments = await Appointment.findAll({
          where: { doctor_id: doctor.id },
          include: [
            {
              model: Patient,
              include: [{ model: User, as: 'user', attributes: ['full_name', 'email', 'phone', 'avatar'] }]
            }
          ],
          order: [['appointment_date', 'DESC']]
        });

        // 3. Lọc ra danh sách bệnh nhân DUY NHẤT (Loại bỏ trùng lặp nếu 1 người khám nhiều lần)
        const uniquePatients = [];
        const map = new Map();

        for (const app of appointments) {
            // Kiểm tra xem bệnh nhân có tồn tại không (đề phòng data rác)
            if (app.Patient && !map.has(app.Patient.id)) {
                map.set(app.Patient.id, true); // Đánh dấu đã lấy
                uniquePatients.push(app.Patient);
            }
        }

        res.render('doctor/patients/index', {
          pageTitle: 'Danh sách Bệnh nhân',
          patients: uniquePatients
        });

      } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi server: ' + error.message);
      }
    }

};

module.exports = doctorController;