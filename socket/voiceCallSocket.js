/**
 * VOICE & VIDEO CALL SOCKET HANDLER
 * Xử lý gọi thoại và video call thời gian thực với WebRTC
 */

const { User } = require('../models');

module.exports = (io) => {
  // Lưu trạng thái cuộc gọi: Map<callId, callInfo>
  const activeCalls = new Map();
  // Lưu user đang trong cuộc gọi: Map<userId, callId>
  const userInCall = new Map();

  io.on('connection', (socket) => {
    
    // ========== 1. BẮT ĐẦU CUỘC GỌI ==========
    socket.on('call:initiate', async (data) => {
      try {
        const { callerId, receiverId, appointmentId, callType = 'voice' } = data;
        
        if (!callerId || !receiverId) {
          return socket.emit('call:error', { message: 'Thiếu thông tin người gọi hoặc người nhận' });
        }

        // Kiểm tra người nhận có đang online không
        const receiverRoom = io.sockets.adapter.rooms.get(`user_${receiverId}`);
        if (!receiverRoom || receiverRoom.size === 0) {
          return socket.emit('call:error', { message: 'Người nhận hiện không online' });
        }

        // Kiểm tra người nhận có đang trong cuộc gọi khác không
        if (userInCall.has(receiverId)) {
          return socket.emit('call:busy', { message: 'Người nhận đang trong cuộc gọi khác' });
        }

        // Kiểm tra người gọi có đang trong cuộc gọi không
        if (userInCall.has(callerId)) {
          return socket.emit('call:error', { message: 'Bạn đang trong cuộc gọi khác' });
        }

        // Lấy thông tin người gọi
        const caller = await User.findByPk(callerId, {
          attributes: ['id', 'full_name', 'avatar']
        });

        if (!caller) {
          return socket.emit('call:error', { message: 'Không tìm thấy thông tin người gọi' });
        }

        // Tạo ID cuộc gọi unique
        const callId = `call_${callerId}_${receiverId}_${Date.now()}`;

        // Lưu thông tin cuộc gọi
        activeCalls.set(callId, {
          callId,
          callerId,
          receiverId,
          appointmentId,
          callType, // 'voice' hoặc 'video'
          status: 'ringing',
          startTime: null,
          createdAt: new Date()
        });

        // Gửi thông báo cuộc gọi đến cho người nhận
        io.to(`user_${receiverId}`).emit('call:incoming', {
          callId,
          callType,
          caller: {
            id: caller.id,
            name: caller.full_name,
            avatar: caller.avatar
          },
          appointmentId
        });

        // Thông báo cho người gọi biết đang đổ chuông
        socket.emit('call:ringing', { callId, receiverId, callType });

        console.log(`📞 Cuộc gọi ${callType} ${callId}: ${callerId} -> ${receiverId}`);

        // Tự động hủy nếu không trả lời sau 30 giây
        setTimeout(() => {
          const call = activeCalls.get(callId);
          if (call && call.status === 'ringing') {
            activeCalls.delete(callId);
            io.to(`user_${callerId}`).emit('call:no_answer', { callId });
            io.to(`user_${receiverId}`).emit('call:missed', { callId, callType });
            console.log(`📞 Cuộc gọi ${callId}: Không trả lời`);
          }
        }, 30000);

      } catch (error) {
        console.error('Call initiate error:', error);
        socket.emit('call:error', { message: 'Không thể thực hiện cuộc gọi' });
      }
    });

    // ========== 2. CHẤP NHẬN CUỘC GỌI ==========
    socket.on('call:accept', async (data) => {
      try {
        const { callId, odice } = data;
        const call = activeCalls.get(callId);

        if (!call) {
          return socket.emit('call:error', { message: 'Cuộc gọi không tồn tại' });
        }

        // Cập nhật trạng thái
        call.status = 'connected';
        call.startTime = new Date();
        activeCalls.set(callId, call);

        // Đánh dấu cả 2 user đang trong cuộc gọi
        userInCall.set(call.callerId, callId);
        userInCall.set(call.receiverId, callId);

        // Thông báo cho người gọi biết cuộc gọi được chấp nhận
        io.to(`user_${call.callerId}`).emit('call:accepted', { 
          callId,
          odice // Gửi offer SDP từ người nhận
        });

        console.log(`📞 Cuộc gọi ${callId}: Đã kết nối`);

      } catch (error) {
        console.error('Call accept error:', error);
        socket.emit('call:error', { message: 'Lỗi chấp nhận cuộc gọi' });
      }
    });

    // ========== 3. TỪ CHỐI CUỘC GỌI ==========
    socket.on('call:reject', (data) => {
      const { callId } = data;
      const call = activeCalls.get(callId);

      if (call) {
        activeCalls.delete(callId);
        io.to(`user_${call.callerId}`).emit('call:rejected', { callId });
        console.log(`📞 Cuộc gọi ${callId}: Bị từ chối`);
      }
    });

    // ========== 4. KẾT THÚC CUỘC GỌI ==========
    socket.on('call:end', (data) => {
      const { callId } = data;
      const call = activeCalls.get(callId);

      if (call) {
        // Xóa đánh dấu user trong cuộc gọi
        userInCall.delete(call.callerId);
        userInCall.delete(call.receiverId);
        
        // Tính thời lượng cuộc gọi
        let duration = 0;
        if (call.startTime) {
          duration = Math.round((new Date() - call.startTime) / 1000);
        }

        activeCalls.delete(callId);

        // Thông báo cho cả 2 bên
        io.to(`user_${call.callerId}`).emit('call:ended', { callId, duration });
        io.to(`user_${call.receiverId}`).emit('call:ended', { callId, duration });

        console.log(`📞 Cuộc gọi ${callId}: Kết thúc (${duration}s)`);
      }
    });

    // ========== 5. WEBRTC SIGNALING ==========
    
    // Gửi Offer SDP
    socket.on('call:offer', (data) => {
      const { callId, targetUserId, sdp } = data;
      io.to(`user_${targetUserId}`).emit('call:offer', { callId, sdp });
    });

    // Gửi Answer SDP
    socket.on('call:answer', (data) => {
      const { callId, targetUserId, sdp } = data;
      io.to(`user_${targetUserId}`).emit('call:answer', { callId, sdp });
    });

    // Gửi ICE Candidate
    socket.on('call:ice_candidate', (data) => {
      const { callId, targetUserId, candidate } = data;
      io.to(`user_${targetUserId}`).emit('call:ice_candidate', { callId, candidate });
    });

    // ========== 6. XỬ LÝ KHI NGẮT KẾT NỐI ==========
    socket.on('disconnect', () => {
      if (socket.userId) {
        const callId = userInCall.get(socket.userId);
        if (callId) {
          const call = activeCalls.get(callId);
          if (call) {
            // Kết thúc cuộc gọi nếu user disconnect
            userInCall.delete(call.callerId);
            userInCall.delete(call.receiverId);
            activeCalls.delete(callId);

            // Thông báo bên còn lại
            const otherUserId = call.callerId === socket.userId ? call.receiverId : call.callerId;
            io.to(`user_${otherUserId}`).emit('call:ended', { 
              callId, 
              reason: 'Đối phương đã ngắt kết nối' 
            });
          }
        }
      }
    });

  });
};
