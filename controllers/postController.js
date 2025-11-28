const { Post, User } = require('../models');

const postController = {
  // 1. Hiển thị danh sách bài viết
  index: async (req, res) => {
    try {
      const posts = await Post.findAll({
        where: { status: 'published' }, // Chỉ lấy bài đã xuất bản
        include: [
          { model: User, as: 'author', attributes: ['full_name'] }
        ],
        order: [['created_at', 'DESC']]
      });

      // Render file giao diện views/posts/index.ejs
      res.render('posts/index', {
        pageTitle: 'Tin tức Y tế',
        posts: posts
      });
    } catch (error) {
      console.error('Get posts error:', error);
      res.status(500).send('Lỗi server: ' + error.message);
    }
  },

  // 2. Hiển thị chi tiết 1 bài viết
  show: async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await Post.findOne({
        where: { slug, status: 'published' },
        include: [{ model: User, as: 'author', attributes: ['full_name'] }]
      });

      if (!post) {
        return res.status(404).render('errors/404', { pageTitle: 'Không tìm thấy bài viết' });
      }

      // Lấy thêm bài viết liên quan (cùng danh mục, trừ bài hiện tại)
      const relatedPosts = await Post.findAll({
        where: {
            category: post.category,
            status: 'published',
            id: { [require('sequelize').Op.ne]: post.id } // Loại trừ bài hiện tại
        },
        limit: 3
      });

      res.render('posts/detail', {
        pageTitle: post.title,
        post,
        relatedPosts
      });
    } catch (error) {
      console.error('Get post detail error:', error);
      res.status(500).send('Lỗi server');
    }
  }
};

module.exports = postController;