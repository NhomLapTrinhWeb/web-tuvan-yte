/**
 * TIME SLOT MODEL
 * Available booking slots for doctors
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TimeSlot = sequelize.define('TimeSlot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'doctors',
      key: 'user_id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Ngày khám'
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: 'Giờ bắt đầu'
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: 'Giờ kết thúc'
  },
  max_bookings: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Số lượng bệnh nhân tối đa trong slot'
  },
  current_bookings: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Số lượng đã đặt'
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Còn chỗ trống'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'time_slots',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['doctor_id']
    },
    {
      fields: ['date']
    },
    {
      fields: ['is_available']
    },
    {
      unique: true,
      fields: ['doctor_id', 'date', 'start_time']
    }
  ]
});

// Instance method to check availability
TimeSlot.prototype.hasAvailability = function() {
  return this.is_available && this.is_active && this.current_bookings < this.max_bookings;
};

// Instance method to book slot
TimeSlot.prototype.book = async function() {
  if (!this.hasAvailability()) {
    throw new Error('Time slot is not available');
  }
  
  this.current_bookings += 1;
  if (this.current_bookings >= this.max_bookings) {
    this.is_available = false;
  }
  
  await this.save();
  return this;
};

// Instance method to release slot
TimeSlot.prototype.release = async function() {
  if (this.current_bookings > 0) {
    this.current_bookings -= 1;
    this.is_available = true;
    await this.save();
  }
  return this;
};

module.exports = TimeSlot;
