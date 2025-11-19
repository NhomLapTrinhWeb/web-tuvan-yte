const emailTemplates = {
  /**
   * Email verification template
   */
  verificationEmail(fullName, verifyUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Xác thực tài khoản</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${fullName}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại hệ thống của chúng tôi.</p>
            <p>Vui lòng nhấn vào nút bên dưới để xác thực email của bạn:</p>
            <center>
              <a href="${verifyUrl}" class="button">Xác thực email</a>
            </center>
            <p>Hoặc copy link sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
            <p>Link này sẽ hết hạn sau 24 giờ.</p>
            <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Healthcare System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Password reset template
   */
  passwordResetEmail(fullName, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Đặt lại mật khẩu</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${fullName}</strong>,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
            <center>
              <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            </center>
            <p>Hoặc copy link sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>Link này sẽ hết hạn sau 1 giờ.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Healthcare System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Appointment confirmation template
   */
  appointmentConfirmation(patientName, doctorName, date, timeSlot, type) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Xác nhận lịch hẹn</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${patientName}</strong>,</p>
            <p>Lịch hẹn của bạn đã được tạo thành công!</p>
            <div class="info-box">
              <h3>Thông tin lịch hẹn:</h3>
              <p><strong>Bác sĩ:</strong> ${doctorName}</p>
              <p><strong>Ngày khám:</strong> ${date}</p>
              <p><strong>Giờ khám:</strong> ${timeSlot}</p>
              <p><strong>Hình thức:</strong> ${type === 'online' ? 'Khám trực tuyến' : 'Khám tại phòng khám'}</p>
            </div>
            <p>Vui lòng thanh toán để xác nhận lịch hẹn.</p>
            <p>Nếu bạn cần hủy lịch, vui lòng thực hiện trước 24 giờ.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Healthcare System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Appointment reminder template
   */
  appointmentReminder(patientName, doctorName, date, timeSlot, meetingLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF5722; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background: #FF5722; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Nhắc nhở lịch hẹn</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${patientName}</strong>,</p>
            <p>Đây là lời nhắc về lịch hẹn sắp tới của bạn:</p>
            <p><strong>Bác sĩ:</strong> ${doctorName}</p>
            <p><strong>Thời gian:</strong> ${date} - ${timeSlot}</p>
            ${meetingLink ? `
              <p>Link tham gia:</p>
              <center>
                <a href="${meetingLink}" class="button">Tham gia cuộc gọi</a>
              </center>
            ` : '<p>Vui lòng đến phòng khám đúng giờ.</p>'}
            <p>Chúc bạn có buổi khám tốt!</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Healthcare System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Appointment cancellation template
   */
  appointmentCancellation(recipientName, date, timeSlot, reason) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✕ Lịch hẹn đã bị hủy</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${recipientName}</strong>,</p>
            <p>Lịch hẹn vào <strong>${date}</strong> lúc <strong>${timeSlot}</strong> đã bị hủy.</p>
            ${reason ? `<p><strong>Lý do:</strong> ${reason}</p>` : ''}
            <p>Nếu bạn cần đặt lịch khác, vui lòng truy cập hệ thống.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Healthcare System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Medical record template
   */
  medicalRecord(patientName, doctorName, date, diagnosis, prescription) {
    const prescriptionHtml = prescription && prescription.length > 0
      ? prescription.map((drug, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${drug.drug_name}</td>
            <td>${drug.dosage}</td>
            <td>${drug.frequency}</td>
            <td>${drug.duration}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="5">Không có</td></tr>';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #009688; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #009688; color: white; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Hồ sơ bệnh án</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${patientName}</strong>,</p>
            <p>Hồ sơ bệnh án của bạn đã sẵn sàng:</p>
            <p><strong>Bác sĩ:</strong> ${doctorName}</p>
            <p><strong>Ngày khám:</strong> ${date}</p>
            <p><strong>Chẩn đoán:</strong> ${diagnosis}</p>
            <h3>Đơn thuốc:</h3>
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên thuốc</th>
                  <th>Liều lượng</th>
                  <th>Tần suất</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                ${prescriptionHtml}
              </tbody>
            </table>
            <p>Vui lòng tuân thủ đơn thuốc và lời dặn của bác sĩ.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Healthcare System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Doctor approval template
   */
  doctorApproval(doctorName, isApproved, message) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isApproved ? '#4CAF50' : '#f44336'}; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isApproved ? '✓ Tài khoản đã được phê duyệt' : '✕ Tài khoản bị từ chối'}</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>Bác sĩ ${doctorName}</strong>,</p>
            <p>${message}</p>
            ${isApproved ? '<p>Bạn có thể bắt đầu nhận lịch hẹn từ bệnh nhân ngay bây giờ.</p>' : ''}
            <p>Mọi thắc mắc vui lòng liên hệ với chúng tôi.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Healthcare System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Welcome email template
   */
  welcomeEmail(fullName, role) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #673AB7; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Chào mừng bạn!</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${fullName}</strong>,</p>
            <p>Chào mừng bạn đến với hệ thống Healthcare!</p>
            <p>Tài khoản ${role === 'doctor' ? 'bác sĩ' : 'bệnh nhân'} của bạn đã được tạo thành công.</p>
            ${role === 'doctor' ? '<p>Tài khoản của bạn đang chờ admin phê duyệt.</p>' : ''}
            <p>Chúc bạn có trải nghiệm tốt với dịch vụ của chúng tôi!</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Healthcare System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
};

module.exports = { emailTemplates };
