const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicalRecord = sequelize.define('MedicalRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  appointment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  diagnosis: { // Chẩn đoán bệnh
    type: DataTypes.TEXT,
    allowNull: false
  },
  symptoms: { // Triệu chứng
    type: DataTypes.TEXT
  },
  prescription: { // Đơn thuốc
    type: DataTypes.TEXT
  },
  notes: { // Lời dặn dò
    type: DataTypes.TEXT
  }
}, {
  tableName: 'medical_records',
  timestamps: true,
  underscored: true
});

module.exports = MedicalRecord;