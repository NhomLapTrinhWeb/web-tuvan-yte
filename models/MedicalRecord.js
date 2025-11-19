// Model MedicalRecord - Hồ sơ bệnh án
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
    allowNull: false,
    unique: true,
    references: {
      model: 'appointments',
      key: 'id'
    }
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Chẩn đoán'
  },
  symptoms: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Triệu chứng'
  },
  treatment_plan: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Kế hoạch điều trị'
  },
  prescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Đơn thuốc'
  },
  test_results: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Kết quả xét nghiệm'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Ghi chú bổ sung'
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of file URLs'
  },
  follow_up_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Ngày tái khám'
  },
  pdf_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL file PDF của hồ sơ'
  }
}, {
  tableName: 'medical_records',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['appointment_id']
    },
    {
      fields: ['patient_id']
    },
    {
      fields: ['doctor_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = MedicalRecord;
