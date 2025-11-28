/**
 * SOCKET.IO CHAT HANDLER
 * Xử lý nhắn tin thời gian thực
 */

const { Message, User, Appointment, Patient, Doctor } = require('../models');

module.exports = (io) => {
  // Lưu danh sách user đang online: Map<userId, socketId>
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('⚡ User connected:', socket.id);

    // 1. Khi người dùng vào trang chat (Client emit 'join')
    socket.on('join', (userId) => {
      socket.userId = userId;
      connectedUsers.set(userId, socket.id);

      // Tạo "phòng" riêng cho user này để nhận tin nhắn
      socket.join(`user_${userId}`);
      console.log(`✅ User ${userId} đã tham gia chat`);

      // Báo cho người khác biết mình online (Tùy chọn)
      socket.broadcast.emit('user_online', userId);
    });

    // 2. Khi người dùng gửi tin nhắn
    socket.on('send_message', async (data) => {
      try {
        const { appointmentId, receiverId, message, messageType = 'text' } = data;
        const senderId = socket.userId;

        if (!senderId) {
          return socket.emit('error', { message: 'Bạn chưa đăng nhập' });
        }

        // --- 👇 ĐOẠN FIX QUAN TRỌNG: KIỂM TRA QUYỀN CHÍNH XÁC 👇 ---

        // Tìm lịch hẹn và kèm thông tin Bệnh nhân/Bác sĩ để lấy User ID
        const appointment = await Appointment.findByPk(appointmentId, {
            include: [
                { model: Patient, include: [{ model: User, as: 'user' }] },
                { model: Doctor, include: [{ model: User, as: 'user' }] }
            ]
        });

        if (!appointment) {
          return socket.emit('error', { message: 'Không tìm thấy cuộc hội thoại' });
        }

        // Lấy User ID của người tham gia lịch hẹn này
        const patientUserId = appointment.Patient ? appointment.Patient.user_id : null;
        const doctorUserId = appointment.Doctor ? appointment.Doctor.user_id : null;

        // Kiểm tra xem người gửi có phải là Bệnh nhân hoặc Bác sĩ của lịch này không
        if (senderId !== patientUserId && senderId !== doctorUserId) {
          console.log(`⛔ Chặn truy cập: Sender ${senderId} không thuộc cuộc hẹn này.`);
          return socket.emit('error', { message: 'Bạn không có quyền gửi tin nhắn trong cuộc hội thoại này' });
        }
        // -------------------------------------------------------------

        // Lưu tin nhắn vào Database
        const newMessage = await Message.create({
          appointment_id: appointmentId,
          sender_id: senderId,
          receiver_id: receiverId,
          message,
          message_type: messageType,
          is_read: false
        });

        // Lấy thông tin người gửi để hiển thị avatar/tên
        const senderInfo = await User.findByPk(senderId, {
          attributes: ['id', 'full_name', 'avatar']
        });

        const messageData = {
          id: newMessage.id,
          appointmentId,
          senderId,
          receiverId,
          message,
          timestamp: newMessage.created_at,
          sender: {
            id: senderInfo.id,
            name: senderInfo.full_name,
            avatar: senderInfo.avatar
          }
        };

        // Gửi tin nhắn ngay lập tức cho cả 2 người (Real-time)
        // 1. Gửi cho người nhận
        io.to(`user_${receiverId}`).emit('new_message', messageData);
        // 2. Gửi ngược lại cho người gửi (để xác nhận đã gửi thành công)
        io.to(`user_${senderId}`).emit('new_message', messageData);

      } catch (error) {
        console.error('Lỗi gửi tin nhắn:', error);
        socket.emit('error', { message: 'Gửi tin nhắn thất bại' });
      }
    });

    // 3. Ngắt kết nối
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);
      }
    });
  });
};