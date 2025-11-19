// Model khoa/chuyên khoa (Departments)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Ảnh đại diện của khoa'
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  head_doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Trưởng khoa'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Vị trí phòng khám (VD: Tầng 2, Phòng 201)'
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Thứ tự hiển thị'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'departments',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['slug']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['display_order']
    }
  ]
});

module.exports = Department;
