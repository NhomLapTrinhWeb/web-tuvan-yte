/**
 * SOCKET.IO CHAT HANDLER
 * Real-time messaging between patients and doctors
 */

const { Message, User, Appointment } = require('../models');

module.exports = (io) => {
  // Store connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins with their user ID
    socket.on('join', async (userId) => {
      socket.userId = userId;
      connectedUsers.set(userId, socket.id);
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined`);
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { appointmentId, receiverId, message, messageType = 'text' } = data;
        const senderId = socket.userId;

        if (!senderId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Verify appointment exists and user is part of it
        const appointment = await Appointment.findByPk(appointmentId);
        if (!appointment) {
          socket.emit('error', { message: 'Appointment not found' });
          return;
        }

        if (appointment.patient_id !== senderId && appointment.doctor_id !== senderId) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Create message
        const newMessage = await Message.create({
          appointment_id: appointmentId,
          sender_id: senderId,
          receiver_id: receiverId,
          message,
          message_type: messageType,
          is_read: false
        });

        // Get sender info
        const sender = await User.findByPk(senderId, {
          attributes: ['id', 'full_name', 'avatar']
        });

        const messageData = {
          id: newMessage.id,
          appointmentId,
          senderId,
          receiverId,
          message,
          messageType,
          timestamp: newMessage.created_at,
          sender: {
            id: sender.id,
            name: sender.full_name,
            avatar: sender.avatar
          }
        };

        // Send to both users
        io.to(`user_${senderId}`).emit('new_message', messageData);
        io.to(`user_${receiverId}`).emit('new_message', messageData);

        // Emit unread count update
        const unreadCount = await Message.count({
          where: {
            receiver_id: receiverId,
            is_read: false
          }
        });
        io.to(`user_${receiverId}`).emit('unread_count', unreadCount);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { appointmentId } = data;
        const userId = socket.userId;

        await Message.update(
          { is_read: true },
          {
            where: {
              appointment_id: appointmentId,
              receiver_id: userId,
              is_read: false
            }
          }
        );

        // Update unread count
        const unreadCount = await Message.count({
          where: {
            receiver_id: userId,
            is_read: false
          }
        });
        socket.emit('unread_count', unreadCount);

      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // User typing indicator
    socket.on('typing', (data) => {
      const { receiverId } = data;
      io.to(`user_${receiverId}`).emit('user_typing', {
        userId: socket.userId
      });
    });

    socket.on('stop_typing', (data) => {
      const { receiverId } = data;
      io.to(`user_${receiverId}`).emit('user_stop_typing', {
        userId: socket.userId
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);
      }
    });
  });
};
