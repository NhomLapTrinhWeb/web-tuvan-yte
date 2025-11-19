// Model bài viết/tin tức (Posts)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: 'Nội dung HTML từ CKEditor'
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Tóm tắt ngắn'
  },
  thumbnail: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'health_tips, news, disease_info, doctor_advice, lifestyle'
  },
  tags: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Comma-separated tags'
  },
  author_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Bài viết nổi bật'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  meta_title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  meta_keywords: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'posts',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['slug']
    },
    {
      fields: ['category']
    },
    {
      fields: ['author_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['published_at']
    }
  ]
});

module.exports = Post;
