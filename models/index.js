// Khởi tạo Sequelize & import models
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
// ĐỊNH NGHĨA QUAN HỆ GIỮA CÁC MODEL
// ============================================

// User - Patient (1-1)
User.hasOne(Patient, { foreignKey: 'user_id', as: 'patientProfile' });
Patient.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - Doctor (1-1)
User.hasOne(Doctor, { foreignKey: 'user_id', as: 'doctorProfile' });
Doctor.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Specialty - Doctor (1-n)
Specialty.hasMany(Doctor, { foreignKey: 'specialty_id', as: 'doctors' });
Doctor.belongsTo(Specialty, { foreignKey: 'specialty_id', as: 'specialty' });

// User (Patient) - Appointment (1-n)
User.hasMany(Appointment, { foreignKey: 'patient_id', as: 'patientAppointments' });
Appointment.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });

// User (Doctor) - Appointment (1-n)
User.hasMany(Appointment, { foreignKey: 'doctor_id', as: 'doctorAppointments' });
Appointment.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

// Appointment - Transaction (1-1)
Appointment.hasOne(Transaction, { foreignKey: 'appointment_id', as: 'transaction' });
Transaction.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

// User - Transaction (1-n)
User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Appointment - Review (1-1)
Appointment.hasOne(Review, { foreignKey: 'appointment_id', as: 'review' });
Review.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

// User (Patient) - Review (1-n)
User.hasMany(Review, { foreignKey: 'patient_id', as: 'givenReviews' });
Review.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });

// User (Doctor) - Review (1-n)
User.hasMany(Review, { foreignKey: 'doctor_id', as: 'receivedReviews' });
Review.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

// Appointment - MedicalRecord (1-1)
Appointment.hasOne(MedicalRecord, { foreignKey: 'appointment_id', as: 'medicalRecord' });
MedicalRecord.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

// User (Patient) - MedicalRecord (1-n)
User.hasMany(MedicalRecord, { foreignKey: 'patient_id', as: 'patientRecords' });
MedicalRecord.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });

// User (Doctor) - MedicalRecord (1-n)
User.hasMany(MedicalRecord, { foreignKey: 'doctor_id', as: 'doctorRecords' });
MedicalRecord.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

// User - Notification (1-n)
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Appointment - Message (1-n)
Appointment.hasMany(Message, { foreignKey: 'appointment_id', as: 'messages' });
Message.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

// User (Sender) - Message (1-n)
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// User (Receiver) - Message (1-n)
User.hasMany(Message, { foreignKey: 'receiver_id', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

// Doctor - Schedule (1-n)
Doctor.hasMany(Schedule, { foreignKey: 'doctor_id', as: 'schedules' });
Schedule.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

// Doctor - TimeSlot (1-n)
Doctor.hasMany(TimeSlot, { foreignKey: 'doctor_id', as: 'timeSlots' });
TimeSlot.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

// Department - Doctor
Department.hasMany(Doctor, { foreignKey: 'department_id', as: 'doctors' });
Doctor.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// User (Head Doctor) - Department (1-1)
User.hasOne(Department, { foreignKey: 'head_doctor_id', as: 'headedDepartment' });
Department.belongsTo(User, { foreignKey: 'head_doctor_id', as: 'headDoctor' });

// User (Author) - Post (1-n)
User.hasMany(Post, { foreignKey: 'author_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// User (Admin) - Contact Reply
User.hasMany(Contact, { foreignKey: 'replied_by', as: 'contactReplies' });
Contact.belongsTo(User, { foreignKey: 'replied_by', as: 'replier' });

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
