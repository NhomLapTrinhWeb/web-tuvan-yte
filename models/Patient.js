// Model Patient - Thông tin bổ sung cho bệnh nhân
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  blood_type: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: true
  },
  allergies: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Danh sách dị ứng, cách nhau bởi dấu phẩy'
  },
  medical_history: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Tiền sử bệnh'
  },
  emergency_contact_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  emergency_contact_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  emergency_contact_relationship: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  insurance_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Số thẻ bảo hiểm y tế'
  },
  insurance_provider: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nhà cung cấp bảo hiểm'
  }
}, {
  tableName: 'patients',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    }
  ]
});

module.exports = Patient;
