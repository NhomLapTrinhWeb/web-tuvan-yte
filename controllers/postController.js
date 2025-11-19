const { Post, User } = require('../models');
const { Op } = require('sequelize');

class PostController {
  // GET /posts - Danh sách bài viết với filter và pagination
  async index(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 9;
      const offset = (page - 1) * limit;
      
      // Build where clause
      const where = {
        status: 'published'
      };
      
      // Filter by category
      if (req.query.category) {
        where.category = req.query.category;
      }
      
      // Search by title or excerpt
      if (req.query.search) {
        where[Op.or] = [
          {
            title: {
              [Op.like]: `%${req.query.search}%`
            }
          },
          {
            excerpt: {
              [Op.like]: `%${req.query.search}%`
            }
          }
        ];
      }
      
      // Get posts with pagination
      const { count, rows: posts } = await Post.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'full_name', 'avatar']
          }
        ],
        limit,
        offset,
        order: [['published_at', 'DESC']],
        distinct: true
      });
      
      // Get categories from Post enum
      const categories = [
        { value: 'health_tips', label: 'Mẹo sức khỏe' },
        { value: 'news', label: 'Tin tức' },
        { value: 'disease_info', label: 'Thông tin bệnh' },
        { value: 'doctor_advice', label: 'Lời khuyên bác sĩ' },
        { value: 'lifestyle', label: 'Lối sống' }
      ];
      
      const totalPages = Math.ceil(count / limit);
      
      res.render('posts/index', {
        pageTitle: 'Tin Tức Y Tế',
        posts,
        categories,
        currentPage: page,
        totalPages,
        totalPosts: count,
        currentPath: req.path,
        filters: {
          category: req.query.category || '',
          search: req.query.search || ''
        }
      });
    } catch (error) {
      console.error('Error in PostController.index:', error);
      res.status(500).send('<h1>Lỗi</h1><p>Không thể tải danh sách bài viết</p>');
    }
  }
  
  // GET /posts/:slug - Chi tiết bài viết
  async show(req, res) {
    try {
      const slug = req.params.slug;
      
      // Get post details
      const post = await Post.findOne({
        where: { slug, status: 'published' },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'full_name', 'avatar', 'email']
          }
        ]
      });
      
      if (!post) {
        return res.status(404).send('<h1>404</h1><p>Bài viết không tồn tại</p><a href="/posts">Quay lại</a>');
      }
      
      // Increment view count
      await post.increment('views');
      
      // Get related posts (same category, exclude current post)
      const relatedPosts = await Post.findAll({
        where: {
          category: post.category,
          id: { [Op.ne]: post.id },
          status: 'published'
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'full_name']
          }
        ],
        limit: 4,
        order: [['published_at', 'DESC']]
      });
      
      // Get latest posts for sidebar
      const latestPosts = await Post.findAll({
        where: {
          status: 'published',
          id: { [Op.ne]: post.id }
        },
        attributes: ['id', 'title', 'slug', 'thumbnail', 'published_at', 'views'],
        limit: 5,
        order: [['published_at', 'DESC']]
      });
      
      res.render('posts/show', {
        pageTitle: post.title,
        post,
        relatedPosts,
        latestPosts,
        currentPath: req.path
      });
    } catch (error) {
      console.error('Error in PostController.show:', error);
      res.status(500).send('<h1>Lỗi</h1><p>Không thể tải bài viết</p>');
    }
  }
}

module.exports = new PostController();
