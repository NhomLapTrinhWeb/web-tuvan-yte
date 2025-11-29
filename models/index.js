// models/index.js - PHIÊN BẢN CHUẨN ĐẦY ĐỦ NHẤT
const sequelize = require('../config/database');
const User = require('./User');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Specialty = require('./Specialty');
const Appointment = require('./Appointment');
const Transaction = require('./Transaction');
const Review = require('./Review');
const Notification = require('./Notification');
const MedicalRecord = require('./MedicalRecord');
const Message = require('./Message');
const Schedule = require('./Schedule');
const TimeSlot = require('./TimeSlot');
const Post = require('./Post');
const Category = require('./Category');
const Contact = require('./Contact');
const Department = require('./Department');

// ============================================
// ĐỊNH NGHĨA QUAN HỆ (ASSOCIATIONS)
// ============================================

// 1. User Relationships
User.hasOne(Patient, { foreignKey: 'user_id', as: 'patientProfile' });
Patient.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Doctor, { foreignKey: 'user_id', as: 'doctorProfile' });
Doctor.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 2. Doctor - Specialty & Department (Sửa lỗi trang chủ)
Specialty.hasMany(Doctor, { foreignKey: 'specialty_id', as: 'doctors' });
Doctor.belongsTo(Specialty, { foreignKey: 'specialty_id', as: 'specialty' });

if (Department) { // Kiểm tra nếu có model Department
    Department.hasMany(Doctor, { foreignKey: 'department_id', as: 'doctors' });
    Doctor.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
}

// 3. Appointment System (Sửa lỗi đặt lịch)
Patient.hasMany(Appointment, { foreignKey: 'patient_id', as: 'appointments' });
Appointment.belongsTo(Patient, { foreignKey: 'patient_id' }); // Không dùng as để fix lỗi Cron

Doctor.hasMany(Appointment, { foreignKey: 'doctor_id', as: 'appointments' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id' });   // Không dùng as để fix lỗi Cron

// 4. Appointment Details
Appointment.hasOne(Transaction, { foreignKey: 'appointment_id', as: 'transaction' });
Transaction.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

Appointment.hasOne(MedicalRecord, { foreignKey: 'appointment_id', as: 'medicalRecord' });
MedicalRecord.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

// 5. Post System
User.hasMany(Post, { foreignKey: 'author_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// 6. Others
Doctor.hasMany(Schedule, { foreignKey: 'doctor_id', as: 'schedules' });
Schedule.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

// 7. Message System (Chat)
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

User.hasMany(Message, { foreignKey: 'receiver_id', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

Appointment.hasMany(Message, { foreignKey: 'appointment_id', as: 'messages' });
Message.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

module.exports = {
  sequelize,
  User,
  Patient,
  Doctor,
  Specialty,
  Appointment,
  Transaction,
  Review,
  Notification,
  MedicalRecord,
  Message,
  Schedule,
  TimeSlot,
  Post,
  Category,
  Contact,
  Department
};