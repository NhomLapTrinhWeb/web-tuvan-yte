// Model Appointment - Lịch hẹn khám
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  appointment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time_slot: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Format: "09:00-10:00"'
  },
  appointment_type: {
    type: DataTypes.ENUM('online', 'offline'),
    defaultValue: 'online'
  },
  reason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Lý do khám'
  },
  symptoms: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Triệu chứng'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'),
    defaultValue: 'pending'
  },
  is_paid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  consultation_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Phí khám bệnh'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refund_requested', 'refunded'),
    defaultValue: 'pending'
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'vnpay, momo, cash'
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Order ID sent to payment gateway'
  },
  vnpay_transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Transaction ID from VNPAY'
  },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelled_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Ghi chú của bác sĩ'
  },
  prescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Đơn thuốc'
  },
  follow_up_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Ngày tái khám'
  },
  meeting_link: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Link Zoom/Google Meet cho online'
  },
  meeting_room_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID phòng video call'
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Đã gửi reminder chưa'
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian xác nhận'
  }
}, {
  tableName: 'appointments',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['patient_id']
    },
    {
      fields: ['doctor_id']
    },
    {
      fields: ['appointment_date']
    },
    {
      fields: ['status']
    },
    {
      fields: ['doctor_id', 'appointment_date', 'time_slot']
    }
  ]
});

module.exports = Appointment;
