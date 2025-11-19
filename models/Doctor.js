// Model Doctor - Thông tin bổ sung cho bác sĩ
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Doctor = sequelize.define('Doctor', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  specialty_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'specialties',
      key: 'id'
    }
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    },
    comment: 'Khoa làm việc'
  },
  license_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    comment: 'Số chứng chỉ hành nghề'
  },
  education: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Học vấn, bằng cấp'
  },
  experience_years: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Số năm kinh nghiệm'
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Tiểu sử, giới thiệu'
  },
  consultation_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Giá khám (VNĐ)'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  total_reviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_appointments: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  certificates: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of certificate URLs'
  },
  working_days: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array: ["monday", "tuesday", ...]'
  },
  working_hours: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Format: "08:00-17:00"'
  },
  consultation_duration: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: 'Thời gian khám 1 bệnh nhân (phút)'
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'doctors',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['specialty_id']
    },
    {
      fields: ['is_approved', 'is_active']
    },
    {
      fields: ['rating']
    },
    {
      unique: true,
      fields: ['license_number']
    }
  ]
});

module.exports = Doctor;
