const nodemailer = require('nodemailer');
const { emailTemplates } = require('../utils/emailTemplates');

class EmailService {
  constructor() {
    // Configure email transporter based on environment
    if (process.env.EMAIL_SERVICE === 'gmail') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    } else if (process.env.EMAIL_SERVICE === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    } else {
      // Default: use SendGrid or Mailgun API
      console.log('Email service not configured. Using console log for development.');
    }
  }

  /**
   * Send email (generic method)
   */
  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.transporter) {
        console.log('=== EMAIL (Development Mode) ===');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('HTML:', html);
        console.log('================================');
        return true;
      }

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'Healthcare System'} <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html,
        text: text || subject
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Send email error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(user, token) {
    try {
      const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      const subject = 'Xác thực tài khoản';
      const html = emailTemplates.verificationEmail(user.full_name, verifyUrl);

      await this.sendEmail(user.email, subject, html);
      return true;
    } catch (error) {
      console.error('Send verification email error:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, token) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      const subject = 'Đặt lại mật khẩu';
      const html = emailTemplates.passwordResetEmail(user.full_name, resetUrl);

      await this.sendEmail(user.email, subject, html);
      return true;
    } catch (error) {
      console.error('Send password reset email error:', error);
      return false;
    }
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(appointment) {
    try {
      const subject = 'Xác nhận lịch hẹn';
      const html = emailTemplates.appointmentConfirmation(
        appointment.patient.full_name,
        appointment.doctor.full_name,
        appointment.appointment_date,
        appointment.time_slot,
        appointment.appointment_type
      );

      await this.sendEmail(appointment.patient.email, subject, html);
      return true;
    } catch (error) {
      console.error('Send appointment confirmation error:', error);
      return false;
    }
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminder(appointment) {
    try {
      const subject = 'Nhắc nhở lịch hẹn';
      const html = emailTemplates.appointmentReminder(
        appointment.patient.full_name,
        appointment.doctor.full_name,
        appointment.appointment_date,
        appointment.time_slot,
        appointment.meeting_link
      );

      await this.sendEmail(appointment.patient.email, subject, html);
      return true;
    } catch (error) {
      console.error('Send appointment reminder error:', error);
      return false;
    }
  }

  /**
   * Send appointment cancellation email
   */
  async sendAppointmentCancellation(appointment, cancelledBy) {
    try {
      const subject = 'Lịch hẹn đã bị hủy';
      const recipientEmail = cancelledBy === 'patient' 
        ? appointment.doctor.email 
        : appointment.patient.email;
      const recipientName = cancelledBy === 'patient'
        ? appointment.doctor.full_name
        : appointment.patient.full_name;

      const html = emailTemplates.appointmentCancellation(
        recipientName,
        appointment.appointment_date,
        appointment.time_slot,
        appointment.cancellation_reason
      );

      await this.sendEmail(recipientEmail, subject, html);
      return true;
    } catch (error) {
      console.error('Send appointment cancellation error:', error);
      return false;
    }
  }

  /**
   * Send medical record email
   */
  async sendMedicalRecord(appointment, medicalRecord) {
    try {
      const subject = 'Hồ sơ bệnh án điện tử';
      const html = emailTemplates.medicalRecord(
        appointment.patient.full_name,
        appointment.doctor.full_name,
        appointment.appointment_date,
        medicalRecord.diagnosis,
        medicalRecord.prescription
      );

      await this.sendEmail(appointment.patient.email, subject, html);
      return true;
    } catch (error) {
      console.error('Send medical record error:', error);
      return false;
    }
  }

  /**
   * Send doctor approval notification
   */
  async sendDoctorApprovalEmail(doctor, isApproved) {
    try {
      const subject = isApproved 
        ? 'Tài khoản bác sĩ đã được phê duyệt'
        : 'Tài khoản bác sĩ đã bị từ chối';
      
      const html = emailTemplates.doctorApproval(
        doctor.full_name,
        isApproved,
        isApproved ? 'Bạn có thể bắt đầu nhận lịch hẹn từ bệnh nhân.' : 'Vui lòng liên hệ admin để biết thêm chi tiết.'
      );

      await this.sendEmail(doctor.email, subject, html);
      return true;
    } catch (error) {
      console.error('Send doctor approval email error:', error);
      return false;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    try {
      const subject = 'Chào mừng bạn đến với hệ thống';
      const html = emailTemplates.welcomeEmail(user.full_name, user.role);

      await this.sendEmail(user.email, subject, html);
      return true;
    } catch (error) {
      console.error('Send welcome email error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
