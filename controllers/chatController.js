const { Message, User } = require('../models');

const chatController = {
  // 1. Hiển thị giao diện Chat
  index: (req, res) => {
    // Bắt buộc đăng nhập
    if (!res.locals.user) {
        return res.redirect('/login');
    }

    res.render('chat/index', {
      pageTitle: 'Tư vấn trực tuyến',
      user: res.locals.user
    });
  },

  // 2. API: Lấy lịch sử tin nhắn (MỚI)
  getHistory: async (req, res) => {
    try {
      const { appointmentId } = req.params;

      const messages = await Message.findAll({
        where: { appointment_id: appointmentId },
        include: [
            // Lấy thông tin người gửi để hiện Avatar/Tên
            { model: User, as: 'sender', attributes: ['id', 'full_name', 'avatar'] }
        ],
        order: [['created_at', 'ASC']] // Tin cũ hiện trước
      });

      res.json({ success: true, data: messages });
    } catch (error) {
      console.error('Get chat history error:', error);
      res.status(500).json({ success: false, message: 'Lỗi tải tin nhắn' });
    }
  }
};

module.exports = chatController;