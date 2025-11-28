// Model Doctor - Thông tin chi tiết bác sĩ
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Doctor = sequelize.define('Doctor', {
  // 👇 THÊM KHỐI ID NÀY (Để sửa lỗi id bị rỗng)
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  // -------------------------

  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  specialty_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'specialties',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  position: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Bác sĩ chuyên khoa'
  },
  clinic_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  consultation_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approval_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'doctors',
  timestamps: true,
  underscored: true
});

module.exports = Doctor;