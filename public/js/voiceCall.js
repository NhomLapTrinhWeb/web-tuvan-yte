/**
 * VOICE & VIDEO CALL CLIENT
 * Xử lý gọi thoại và video call WebRTC phía client
 */

class VoiceCallManager {
  constructor(socket, currentUserId) {
    this.socket = socket;
    this.currentUserId = currentUserId;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.currentCallId = null;
    this.currentCallType = 'voice'; // 'voice' hoặc 'video'
    this.callStatus = 'idle'; // idle, calling, ringing, connected
    
    // WebRTC config (STUN servers công cộng)
    this.rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    // Ringtones
    this.ringtone = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    this.ringtone.loop = true;
    this.dialTone = new Audio('https://assets.mixkit.co/active_storage/sfx/1362/1362-preview.mp3');
    this.dialTone.loop = true;

    // UI Elements
    this.callModal = null;
    this.incomingCallModal = null;

    this.initSocketListeners();
    this.createCallUI();
  }

  // ========== KHỞI TẠO SOCKET LISTENERS ==========
  initSocketListeners() {
    // Có cuộc gọi đến
    this.socket.on('call:incoming', (data) => {
      console.log('📞 Cuộc gọi đến:', data);
      this.handleIncomingCall(data);
    });

    // Đang đổ chuông
    this.socket.on('call:ringing', (data) => {
      this.currentCallId = data.callId;
      this.currentCallType = data.callType || 'voice';
      this.callStatus = 'calling';
      this.dialTone.play().catch(() => {});
      const typeText = this.currentCallType === 'video' ? 'Video call' : 'Gọi thoại';
      this.showCallModal(typeText, 'Đang đổ chuông...', this.currentCallType);
    });

    // Cuộc gọi được chấp nhận
    this.socket.on('call:accepted', async (data) => {
      console.log('📞 Cuộc gọi được chấp nhận');
      this.dialTone.pause();
      this.callStatus = 'connected';
      this.updateCallModal('Đang kết nối...', 'Đã kết nối');
      
      // Bắt đầu WebRTC connection
      await this.startConnection(true);
    });

    // Cuộc gọi bị từ chối
    this.socket.on('call:rejected', (data) => {
      console.log('📞 Cuộc gọi bị từ chối');
      this.dialTone.pause();
      this.showNotification('Cuộc gọi bị từ chối', 'error');
      this.endCall();
    });

    // Không trả lời
    this.socket.on('call:no_answer', (data) => {
      console.log('📞 Không trả lời');
      this.dialTone.pause();
      this.showNotification('Không có người trả lời', 'warning');
      this.endCall();
    });

    // Cuộc gọi nhỡ
    this.socket.on('call:missed', (data) => {
      this.ringtone.pause();
      this.hideIncomingCallModal();
      const typeText = data.callType === 'video' ? 'Video call' : 'Cuộc gọi';
      this.showNotification(`${typeText} nhỡ`, 'info');
    });

    // Cuộc gọi kết thúc
    this.socket.on('call:ended', (data) => {
      console.log('📞 Cuộc gọi kết thúc:', data);
      const duration = data.duration ? this.formatDuration(data.duration) : '';
      this.showNotification(`Cuộc gọi kết thúc ${duration}`, 'info');
      this.cleanup();
    });

    // Người nhận đang bận
    this.socket.on('call:busy', (data) => {
      this.dialTone.pause();
      this.showNotification('Người nhận đang bận', 'warning');
      this.endCall();
    });

    // Lỗi
    this.socket.on('call:error', (data) => {
      console.error('📞 Lỗi:', data.message);
      this.showNotification(data.message, 'error');
      this.cleanup();
    });

    // WebRTC Signaling
    this.socket.on('call:offer', async (data) => {
      await this.handleOffer(data.sdp);
    });

    this.socket.on('call:answer', async (data) => {
      await this.handleAnswer(data.sdp);
    });

    this.socket.on('call:ice_candidate', async (data) => {
      await this.handleIceCandidate(data.candidate);
    });
  }

  // ========== BẮT ĐẦU CUỘC GỌI ==========
  async initiateCall(receiverId, appointmentId = null, callType = 'voice') {
    if (this.callStatus !== 'idle') {
      this.showNotification('Bạn đang trong cuộc gọi khác', 'warning');
      return;
    }

    try {
      this.currentCallType = callType;
      
      // Xin quyền truy cập microphone (và camera nếu video call)
      const constraints = {
        audio: true,
        video: callType === 'video' ? { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } : false
      };
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Nếu là video call, hiện local video
      if (callType === 'video') {
        this.showLocalVideo();
      }

      this.socket.emit('call:initiate', {
        callerId: this.currentUserId,
        receiverId: receiverId,
        appointmentId: appointmentId,
        callType: callType
      });

      this.targetUserId = receiverId;

    } catch (error) {
      console.error('Lỗi truy cập thiết bị:', error);
      const deviceName = callType === 'video' ? 'camera/microphone' : 'microphone';
      this.showNotification(`Không thể truy cập ${deviceName}. Vui lòng cấp quyền.`, 'error');
    }
  }

  // ========== XỬ LÝ CUỘC GỌI ĐẾN ==========
  handleIncomingCall(data) {
    this.currentCallId = data.callId;
    this.targetUserId = data.caller.id;
    this.currentCallType = data.callType || 'voice';
    this.callStatus = 'ringing';
    
    this.ringtone.play().catch(() => {});
    this.showIncomingCallModal(data.caller, data.callType);
  }

  // ========== CHẤP NHẬN CUỘC GỌI ==========
  async acceptCall() {
    try {
      this.ringtone.pause();
      this.hideIncomingCallModal();

      // Xin quyền thiết bị
      const constraints = {
        audio: true,
        video: this.currentCallType === 'video' ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } : false
      };
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      this.socket.emit('call:accept', { 
        callId: this.currentCallId 
      });

      this.callStatus = 'connected';
      
      const typeText = this.currentCallType === 'video' ? 'Video call' : 'Gọi thoại';
      this.showCallModal(typeText, 'Đã kết nối', this.currentCallType);

      // Hiện local video nếu là video call
      if (this.currentCallType === 'video') {
        this.showLocalVideo();
      }

      // Bắt đầu WebRTC connection (người nhận tạo offer)
      await this.startConnection(false);

    } catch (error) {
      console.error('Lỗi chấp nhận cuộc gọi:', error);
      const deviceName = this.currentCallType === 'video' ? 'camera/microphone' : 'microphone';
      this.showNotification(`Không thể truy cập ${deviceName}`, 'error');
      this.rejectCall();
    }
  }

  // ========== TỪ CHỐI CUỘC GỌI ==========
  rejectCall() {
    this.ringtone.pause();
    this.hideIncomingCallModal();
    
    this.socket.emit('call:reject', { 
      callId: this.currentCallId 
    });
    
    this.cleanup();
  }

  // ========== KẾT THÚC CUỘC GỌI ==========
  endCall() {
    this.dialTone.pause();
    this.ringtone.pause();
    
    if (this.currentCallId) {
      this.socket.emit('call:end', { 
        callId: this.currentCallId 
      });
    }
    
    this.cleanup();
  }

  // ========== WEBRTC CONNECTION ==========
  async startConnection(isCaller) {
    this.peerConnection = new RTCPeerConnection(this.rtcConfig);

    // Thêm local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Xử lý remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('📞 Nhận được stream từ đối phương');
      this.remoteStream = event.streams[0];
      
      if (this.currentCallType === 'video') {
        this.showRemoteVideo(event.streams[0]);
      } else {
        // Audio only
        const remoteAudio = document.getElementById('remoteAudio');
        if (remoteAudio) {
          remoteAudio.srcObject = event.streams[0];
        }
      }
    };

    // Xử lý ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('call:ice_candidate', {
          callId: this.currentCallId,
          targetUserId: this.targetUserId,
          candidate: event.candidate
        });
      }
    };

    // Connection state
    this.peerConnection.onconnectionstatechange = () => {
      console.log('📞 Connection state:', this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'connected') {
        this.updateCallModal('Đang gọi...', 'Đang nói chuyện');
        this.startCallTimer();
      }
    };

    // Nếu là người gọi, tạo offer
    if (isCaller) {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      this.socket.emit('call:offer', {
        callId: this.currentCallId,
        targetUserId: this.targetUserId,
        sdp: offer
      });
    }
  }

  async handleOffer(sdp) {
    if (!this.peerConnection) {
      await this.startConnection(false);
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    this.socket.emit('call:answer', {
      callId: this.currentCallId,
      targetUserId: this.targetUserId,
      sdp: answer
    });
  }

  async handleAnswer(sdp) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async handleIceCandidate(candidate) {
    if (this.peerConnection && candidate) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  // ========== VIDEO HELPERS ==========
  showLocalVideo() {
    const localVideo = document.getElementById('localVideo');
    if (localVideo && this.localStream) {
      localVideo.srcObject = this.localStream;
      localVideo.style.display = 'block';
    }
  }

  showRemoteVideo(stream) {
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo) {
      remoteVideo.srcObject = stream;
      remoteVideo.style.display = 'block';
    }
  }

  // ========== CLEANUP ==========
  cleanup() {
    this.dialTone.pause();
    this.ringtone.pause();
    
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.currentCallId = null;
    this.targetUserId = null;
    this.callStatus = 'idle';
    this.currentCallType = 'voice';
    
    this.hideCallModal();
    this.hideIncomingCallModal();
  }

  // ========== UI METHODS ==========
  createCallUI() {
    // Modal cuộc gọi đang diễn ra
    const callModalHTML = `
      <div id="voiceCallModal" class="voice-call-modal" style="display: none;">
        <div class="call-modal-content">
          <!-- Video Container (ẩn khi voice call) -->
          <div id="videoContainer" class="video-container" style="display: none;">
            <video id="remoteVideo" autoplay playsinline class="remote-video"></video>
            <video id="localVideo" autoplay playsinline muted class="local-video"></video>
          </div>
          
          <!-- Audio Container (ẩn khi video call) -->
          <div id="audioContainer" class="audio-container">
            <div class="call-avatar">
              <i class="fas fa-phone-alt fa-3x text-success pulse-animation" id="callIcon"></i>
            </div>
            <audio id="remoteAudio" autoplay></audio>
          </div>
          
          <h4 id="callModalTitle">Đang gọi...</h4>
          <p id="callModalStatus" class="text-muted">Đang kết nối</p>
          <p id="callTimer" class="call-timer" style="display: none;">00:00</p>
          
          <div class="call-actions mt-4">
            <button id="muteBtn" class="btn btn-secondary btn-circle mx-2" title="Tắt mic">
              <i class="fas fa-microphone"></i>
            </button>
            <button id="toggleVideoBtn" class="btn btn-secondary btn-circle mx-2" title="Tắt camera" style="display: none;">
              <i class="fas fa-video"></i>
            </button>
            <button id="endCallBtn" class="btn btn-danger btn-circle btn-lg mx-2" title="Kết thúc">
              <i class="fas fa-phone-slash"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // Modal cuộc gọi đến
    const incomingCallHTML = `
      <div id="incomingCallModal" class="voice-call-modal incoming" style="display: none;">
        <div class="call-modal-content">
          <div class="call-avatar">
            <img id="callerAvatar" src="" class="rounded-circle" width="80" height="80">
          </div>
          <h4 id="callerName">Người gọi</h4>
          <p id="incomingCallType" class="text-muted">Đang gọi cho bạn...</p>
          <div class="call-actions mt-4">
            <button id="rejectCallBtn" class="btn btn-danger btn-circle btn-lg mx-3" title="Từ chối">
              <i class="fas fa-phone-slash"></i>
            </button>
            <button id="acceptCallBtn" class="btn btn-success btn-circle btn-lg mx-3" title="Trả lời">
              <i class="fas fa-phone-alt" id="acceptIcon"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // CSS
    const styles = `
      <style>
        .voice-call-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .call-modal-content {
          background: #1a1a2e;
          padding: 40px;
          border-radius: 20px;
          text-align: center;
          min-width: 350px;
          max-width: 90vw;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          color: white;
        }
        .call-avatar {
          margin-bottom: 20px;
        }
        .call-avatar img {
          border: 4px solid #28a745;
          object-fit: cover;
        }
        .btn-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .btn-circle.btn-lg {
          width: 65px;
          height: 65px;
          font-size: 1.5rem;
        }
        .call-timer {
          font-size: 2rem;
          font-weight: bold;
          color: #28a745;
        }
        .pulse-animation {
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .incoming .call-avatar img {
          animation: ring 0.5s ease-in-out infinite;
        }
        @keyframes ring {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        
        /* Video styles */
        .video-container {
          position: relative;
          width: 100%;
          max-width: 640px;
          margin: 0 auto 20px;
          border-radius: 12px;
          overflow: hidden;
          background: #000;
        }
        .remote-video {
          width: 100%;
          height: auto;
          min-height: 300px;
          max-height: 60vh;
          object-fit: cover;
          background: #222;
        }
        .local-video {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 120px;
          height: 90px;
          border-radius: 8px;
          border: 2px solid #fff;
          object-fit: cover;
          background: #333;
        }
        .audio-container {
          padding: 20px;
        }
        
        #callModalTitle, #callModalStatus {
          color: #fff;
        }
        #callModalStatus {
          opacity: 0.7;
        }
      </style>
    `;

    document.body.insertAdjacentHTML('beforeend', styles + callModalHTML + incomingCallHTML);

    // Bind events
    document.getElementById('endCallBtn')?.addEventListener('click', () => this.endCall());
    document.getElementById('acceptCallBtn')?.addEventListener('click', () => this.acceptCall());
    document.getElementById('rejectCallBtn')?.addEventListener('click', () => this.rejectCall());
    document.getElementById('muteBtn')?.addEventListener('click', () => this.toggleMute());
    document.getElementById('toggleVideoBtn')?.addEventListener('click', () => this.toggleVideo());
  }

  showCallModal(title, status, callType = 'voice') {
    const modal = document.getElementById('voiceCallModal');
    const videoContainer = document.getElementById('videoContainer');
    const audioContainer = document.getElementById('audioContainer');
    const toggleVideoBtn = document.getElementById('toggleVideoBtn');
    const callIcon = document.getElementById('callIcon');
    
    if (modal) {
      document.getElementById('callModalTitle').textContent = title;
      document.getElementById('callModalStatus').textContent = status;
      
      if (callType === 'video') {
        videoContainer.style.display = 'block';
        audioContainer.style.display = 'none';
        toggleVideoBtn.style.display = 'inline-flex';
      } else {
        videoContainer.style.display = 'none';
        audioContainer.style.display = 'block';
        toggleVideoBtn.style.display = 'none';
        callIcon.className = 'fas fa-phone-alt fa-3x text-success pulse-animation';
      }
      
      modal.style.display = 'flex';
    }
  }

  updateCallModal(title, status) {
    document.getElementById('callModalTitle').textContent = title;
    document.getElementById('callModalStatus').textContent = status;
  }

  hideCallModal() {
    const modal = document.getElementById('voiceCallModal');
    if (modal) modal.style.display = 'none';
    
    document.getElementById('callTimer').style.display = 'none';
    
    // Reset videos
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    if (localVideo) { localVideo.srcObject = null; localVideo.style.display = 'none'; }
    if (remoteVideo) { remoteVideo.srcObject = null; remoteVideo.style.display = 'none'; }
  }

  showIncomingCallModal(caller, callType = 'voice') {
    const modal = document.getElementById('incomingCallModal');
    if (modal) {
      document.getElementById('callerName').textContent = caller.name;
      document.getElementById('callerAvatar').src = caller.avatar || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(caller.name)}&background=0D8ABC&color=fff`;
      
      const typeText = callType === 'video' ? 'Video call đến...' : 'Cuộc gọi thoại đến...';
      document.getElementById('incomingCallType').textContent = typeText;
      
      // Đổi icon nút accept
      const acceptIcon = document.getElementById('acceptIcon');
      if (acceptIcon) {
        acceptIcon.className = callType === 'video' ? 'fas fa-video' : 'fas fa-phone-alt';
      }
      
      modal.style.display = 'flex';
    }
  }

  hideIncomingCallModal() {
    const modal = document.getElementById('incomingCallModal');
    if (modal) modal.style.display = 'none';
  }

  startCallTimer() {
    const timerEl = document.getElementById('callTimer');
    if (timerEl) {
      timerEl.style.display = 'block';
      let seconds = 0;
      this.callTimer = setInterval(() => {
        seconds++;
        timerEl.textContent = this.formatDuration(seconds);
      }, 1000);
    }
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
          muteBtn.innerHTML = audioTrack.enabled 
            ? '<i class="fas fa-microphone"></i>' 
            : '<i class="fas fa-microphone-slash"></i>';
          muteBtn.classList.toggle('btn-warning', !audioTrack.enabled);
          muteBtn.classList.toggle('btn-secondary', audioTrack.enabled);
        }
      }
    }
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const toggleVideoBtn = document.getElementById('toggleVideoBtn');
        if (toggleVideoBtn) {
          toggleVideoBtn.innerHTML = videoTrack.enabled 
            ? '<i class="fas fa-video"></i>' 
            : '<i class="fas fa-video-slash"></i>';
          toggleVideoBtn.classList.toggle('btn-warning', !videoTrack.enabled);
          toggleVideoBtn.classList.toggle('btn-secondary', videoTrack.enabled);
        }
      }
    }
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  showNotification(message, type = 'info') {
    // Sử dụng toast hoặc alert đơn giản
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: type,
        title: message,
        showConfirmButton: false,
        timer: 3000
      });
    } else {
      alert(message);
    }
  }
}

// Export để sử dụng
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceCallManager;
}
