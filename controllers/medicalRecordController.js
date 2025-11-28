const { MedicalRecord, Appointment, Patient, User, Doctor } = require('../models');

const medicalRecordController = {
  // 1. Hiển thị form cho Bác sĩ nhập kết quả
  showCreateForm: async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const appointment = await Appointment.findByPk(appointmentId, {
        include: [{ model: Patient, include: [{ model: User, as: 'user' }] }]
      });

      if (!appointment) return res.send("Không tìm thấy lịch hẹn");

      res.render('doctor/medical-records/create', {
        pageTitle: 'Ghi Hồ Sơ Bệnh Án',
        layout: 'layouts/doctor',
        appointment
      });
    } catch (error) {
      res.status(500).send(error.message);
    }
  },

  // 2. Xử lý Lưu kết quả khám (POST)
  store: async (req, res) => {
    try {
      const { appointment_id, diagnosis, symptoms, prescription, notes } = req.body;
      const appointment = await Appointment.findByPk(appointment_id);

      // Tạo hồ sơ bệnh án
      await MedicalRecord.create({
        appointment_id,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        diagnosis,
        symptoms,
        prescription,
        notes
      });

      // Cập nhật trạng thái lịch hẹn thành 'completed'
      await appointment.update({ status: 'completed' });

      res.redirect('/doctor/appointments');
    } catch (error) {
      console.error(error);
      res.status(500).send("Lỗi khi lưu hồ sơ");
    }
  },

  // 3. Xem chi tiết kết quả (Đã sửa lỗi Alias và import Doctor)
  showDetail: async (req, res) => {
    try {
      const { appointmentId } = req.params;

      const record = await MedicalRecord.findOne({
        where: { appointment_id: appointmentId },
        include: [
            {
                model: Appointment,
                as: 'appointment',
                include: [
                    {
                        model: Patient,
                        include: [{ model: User, as: 'user' }]
                    },
                    {
                        model: Doctor,
                        include: [{ model: User, as: 'user' }]
                    }
                ]
            }
        ]
      });

      if (!record) return res.send("Chưa có kết quả khám cho lịch hẹn này.");

      const user = req.user || req.session.user;
      const layout = user && user.role === 'doctor' ? 'layouts/doctor' : 'layouts/main';

      res.render('medical-records/show', {
        pageTitle: 'Kết quả khám bệnh',
        layout: layout,
        record
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Lỗi server: " + error.message);
    }
  }
};

module.exports = medicalRecordController;