const NotificationService = require('../services/NotificationService');

const notificationController = {
  /**
   * Get user notifications
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, is_read = null } = req.query;

      const result = await NotificationService.getUserNotifications(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        isRead: is_read !== null ? is_read === 'true' : null
      });

      return res.json({
        success: true,
        data: result.notifications,
        metadata: {
          page: result.page,
          limit: parseInt(limit),
          total: result.total,
          total_pages: result.total_pages
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await NotificationService.markAsRead(id, userId);

      return res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      
      if (error.message === 'Notification not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await NotificationService.markAllAsRead(userId);

      return res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Delete notification
   */
  async deleteNotification(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await NotificationService.deleteNotification(id, userId);

      return res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      
      if (error.message === 'Notification not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

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

      const count = await NotificationService.getUnreadCount(userId);

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
   * Clear all notifications
   */
  async clearAll(req, res) {
    try {
      const userId = req.user.id;

      await Notification.destroy({
        where: { user_id: userId }
      });

      return res.json({
        success: true,
        message: 'All notifications cleared'
      });
    } catch (error) {
      console.error('Clear all notifications error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = notificationController;
