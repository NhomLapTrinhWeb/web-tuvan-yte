const { ChatMessage, User, Appointment } = require('../models');
const NotificationService = require('../services/NotificationService');
const { Op } = require('sequelize');

const chatController = {
  /**
   * Get user's conversations
   */
  async getConversations(req, res) {
    try {
      const userId = req.user.id;

      // Get all unique conversation partners
      const messages = await ChatMessage.findAll({
        where: {
          [Op.or]: [
            { sender_id: userId },
            { receiver_id: userId }
          ]
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'full_name', 'avatar', 'role']
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'full_name', 'avatar', 'role']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Group by conversation partner
      const conversationsMap = new Map();
      
      messages.forEach(message => {
        const partnerId = message.sender_id === userId ? message.receiver_id : message.sender_id;
        
        if (!conversationsMap.has(partnerId)) {
          const partner = message.sender_id === userId ? message.receiver : message.sender;
          conversationsMap.set(partnerId, {
            partner,
            last_message: message,
            unread_count: 0
          });
        }

        // Count unread messages
        if (message.receiver_id === userId && !message.is_read) {
          conversationsMap.get(partnerId).unread_count++;
        }
      });

      const conversations = Array.from(conversationsMap.values());

      return res.json({
        success: true,
        data: conversations
      });
    } catch (error) {
      console.error('Get conversations error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Get messages with a specific user
   */
  async getMessages(req, res) {
    try {
      const userId = req.user.id;
      const { partnerId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows } = await ChatMessage.findAndCountAll({
        where: {
          [Op.or]: [
            { sender_id: userId, receiver_id: partnerId },
            { sender_id: partnerId, receiver_id: userId }
          ]
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'full_name', 'avatar']
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'full_name', 'avatar']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Mark received messages as read
      await ChatMessage.update(
        { is_read: true, read_at: new Date() },
        {
          where: {
            sender_id: partnerId,
            receiver_id: userId,
            is_read: false
          }
        }
      );

      return res.json({
        success: true,
        data: rows.reverse(), // Reverse to show oldest first
        metadata: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get messages error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Send message
   */
  async sendMessage(req, res) {
    try {
      const senderId = req.user.id;
      const { receiver_id, content, message_type = 'text', appointment_id = null } = req.body;

      if (!receiver_id || !content) {
        return res.status(400).json({
          success: false,
          message: 'Receiver and content are required'
        });
      }

      // Verify receiver exists
      const receiver = await User.findByPk(receiver_id);
      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: 'Receiver not found'
        });
      }

      // Create message
      const message = await ChatMessage.create({
        sender_id: senderId,
        receiver_id,
        content,
        message_type,
        appointment_id,
        is_read: false
      });

      // Load sender info
      const fullMessage = await ChatMessage.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'full_name', 'avatar']
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'full_name', 'avatar']
          }
        ]
      });

      // Send notification
      await NotificationService.notifyNewMessage(fullMessage);

      // TODO: Emit socket event for real-time chat
      // io.to(`user_${receiver_id}`).emit('new_message', fullMessage);

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: fullMessage
      });
    } catch (error) {
      console.error('Send message error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Upload file in chat
   */
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const filePath = `/uploads/chat/${req.file.filename}`;

      return res.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          file_url: filePath,
          file_name: req.file.originalname,
          file_size: req.file.size
        }
      });
    } catch (error) {
      console.error('Upload file error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Mark messages as read
   */
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { partner_id } = req.body;

      await ChatMessage.update(
        { is_read: true, read_at: new Date() },
        {
          where: {
            sender_id: partner_id,
            receiver_id: userId,
            is_read: false
          }
        }
      );

      return res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Delete message
   */
  async deleteMessage(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const message = await ChatMessage.findByPk(id);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Only sender can delete
      if (message.sender_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own messages'
        });
      }

      await message.destroy();

      return res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('Delete message error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Get unread count
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await ChatMessage.count({
        where: {
          receiver_id: userId,
          is_read: false
        }
      });

      return res.json({
        success: true,
        data: { unread_count: count }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Socket.io handler for real-time chat
   */
  handleMessage(socket, io) {
    socket.on('chat message', (msg) => {
      io.emit('chat message', {
        user: socket.user,
        message: msg,
        timestamp: new Date()
      });
    });
  }
};

module.exports = chatController;
