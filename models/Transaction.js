// Model Transaction - Giao dịch thanh toán
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  appointment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'appointments',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  transaction_code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  payment_method: {
    type: DataTypes.ENUM('vnpay', 'momo', 'cash'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  payment_url: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  gateway_transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'ID giao dịch từ cổng thanh toán'
  },
  gateway_response: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Response từ gateway'
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  refunded_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refund_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['transaction_code']
    },
    {
      fields: ['appointment_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['payment_method']
    }
  ]
});

module.exports = Transaction;
