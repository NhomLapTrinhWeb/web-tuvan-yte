const { Notification, User } = require('../models');
const { Op } = require('sequelize');

let io = null;

class NotificationService {
  /**
   * Set socket.io instance
   */
  static setIO(socketIO) {
    io = socketIO;
  }
  /**
   * Tạo notification
   */
  static async createNotification(userId, title, message, type = 'system', relatedId = null, actionUrl = null) {
    try {
      const notification = await Notification.create({
        user_id: userId,
        title,
        message,
        type,
        related_id: relatedId,
        action_url: actionUrl,
        is_read: false
      });

      // Emit socket event for real-time notification
      if (io) {
        io.to(`user_${userId}`).emit('notification:new', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          action_url: notification.action_url,
          created_at: notification.created_at
        });
      }

      return notification;
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  /**
   * Gửi notification cho nhiều users
   */
  static async createBulkNotifications(userIds, title, message, type = 'system', relatedId = null) {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        related_id: relatedId,
        is_read: false
      }));

      await Notification.bulkCreate(notifications);

      // Emit socket events
      if (io) {
        userIds.forEach(userId => {
          io.to(`user_${userId}`).emit('notification:new', { title, message, type });
        });
      }

      return true;
    } catch (error) {
      console.error('Create bulk notifications error:', error);
      throw error;
    }
  }

  /**
   * Notification cho appointment mới
   */
  static async notifyNewAppointment(appointment) {
    try {
      // Notify doctor
      await this.createNotification(
        appointment.doctor.user_id,
        'Lịch hẹn mới',
        `Bạn có lịch hẹn mới từ ${appointment.patient.full_name} vào ${appointment.appointment_date} lúc ${appointment.time_slot}`,
        'appointment',
        appointment.id,
        `/appointments/${appointment.id}`
      );

      // Notify patient (confirmation)
      await this.createNotification(
        appointment.patient.user_id,
        'Đặt lịch thành công',
        `Lịch hẹn của bạn với ${appointment.doctor.full_name} đã được tạo. Vui lòng thanh toán để xác nhận.`,
        'appointment',
        appointment.id,
        `/appointments/${appointment.id}`
      );

      return true;
    } catch (error) {
      console.error('Notify new appointment error:', error);
      return false;
    }
  }

  /**
   * Notification cho appointment confirmed
   */
  static async notifyAppointmentConfirmed(appointment) {
    try {
      await this.createNotification(
        appointment.patient.user_id,
        'Lịch hẹn đã được xác nhận',
        `Bác sĩ ${appointment.doctor.full_name} đã xác nhận lịch hẹn của bạn vào ${appointment.appointment_date} lúc ${appointment.time_slot}`,
        'appointment',
        appointment.id,
        `/appointments/${appointment.id}`
      );

      return true;
    } catch (error) {
      console.error('Notify appointment confirmed error:', error);
      return false;
    }
  }

  /**
   * Notification cho appointment cancelled
   */
  static async notifyAppointmentCancelled(appointment, cancelledBy) {
    try {
      if (cancelledBy === 'patient') {
        // Notify doctor
        await this.createNotification(
          appointment.doctor.user_id,
          'Lịch hẹn đã bị hủy',
          `Bệnh nhân ${appointment.patient.full_name} đã hủy lịch hẹn vào ${appointment.appointment_date} lúc ${appointment.time_slot}`,
          'appointment',
          appointment.id,
          `/appointments/${appointment.id}`
        );
      } else {
        // Notify patient
        await this.createNotification(
          appointment.patient.user_id,
          'Lịch hẹn đã bị hủy',
          `Bác sĩ ${appointment.doctor.full_name} đã hủy lịch hẹn của bạn vào ${appointment.appointment_date} lúc ${appointment.time_slot}`,
          'appointment',
          appointment.id,
          `/appointments/${appointment.id}`
        );
      }

      return true;
    } catch (error) {
      console.error('Notify appointment cancelled error:', error);
      return false;
    }
  }

  /**
   * Notification cho appointment reminder (1 giờ trước)
   */
  static async notifyAppointmentReminder(appointment) {
    try {
      // Notify patient
      await this.createNotification(
        appointment.patient.user_id,
        'Nhắc nhở lịch hẹn',
        `Bạn có lịch hẹn với bác sĩ ${appointment.doctor.full_name} vào ${appointment.time_slot}. Vui lòng chuẩn bị đầy đủ.`,
        'reminder',
        appointment.id,
        `/appointments/${appointment.id}`
      );

      // Notify doctor
      await this.createNotification(
        appointment.doctor.user_id,
        'Nhắc nhở lịch hẹn',
        `Bạn có lịch hẹn với bệnh nhân ${appointment.patient.full_name} vào ${appointment.time_slot}`,
        'reminder',
        appointment.id,
        `/appointments/${appointment.id}`
      );

      return true;
    } catch (error) {
      console.error('Notify appointment reminder error:', error);
      return false;
    }
  }

  /**
   * Notification cho payment success
   */
  static async notifyPaymentSuccess(appointment) {
    try {
      await this.createNotification(
        appointment.patient.user_id,
        'Thanh toán thành công',
        `Bạn đã thanh toán thành công cho lịch hẹn với bác sĩ ${appointment.doctor.full_name}`,
        'payment',
        appointment.id,
        `/appointments/${appointment.id}`
      );

      return true;
    } catch (error) {
      console.error('Notify payment success error:', error);
      return false;
    }
  }

  /**
   * Notification cho new review
   */
  static async notifyNewReview(review) {
    try {
      await this.createNotification(
        review.doctor.user_id,
        'Đánh giá mới',
        `Bạn nhận được đánh giá ${review.rating} sao từ bệnh nhân`,
        'review',
        review.id,
        `/reviews/${review.id}`
      );

      return true;
    } catch (error) {
      console.error('Notify new review error:', error);
      return false;
    }
  }

  /**
   * Notification cho new message
   */
  static async notifyNewMessage(message) {
    try {
      await this.createNotification(
        message.receiver_id,
        'Tin nhắn mới',
        `Bạn có tin nhắn mới từ ${message.sender.full_name}`,
        'message',
        message.id,
        `/chat/${message.sender_id}`
      );

      return true;
    } catch (error) {
      console.error('Notify new message error:', error);
      return false;
    }
  }

  /**
   * Get notifications for user
   */
  static async getUserNotifications(userId, options = {}) {
    try {
      const { page = 1, limit = 20, isRead = null } = options;
      const offset = (page - 1) * limit;

      const where = { user_id: userId };
      if (isRead !== null) {
        where.is_read = isRead;
      }

      const { count, rows } = await Notification.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return {
        notifications: rows,
        total: count,
        page,
        total_pages: Math.ceil(count / limit)
      };
    } catch (error) {
      console.error('Get user notifications error:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: { id: notificationId, user_id: userId }
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.update({
        is_read: true,
        read_at: new Date()
      });

      return notification;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId) {
    try {
      await Notification.update(
        { is_read: true, read_at: new Date() },
        { where: { user_id: userId, is_read: false } }
      );

      return true;
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: { id: notificationId, user_id: userId }
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.destroy();
      return true;
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: { user_id: userId, is_read: false }
      });

      return count;
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
