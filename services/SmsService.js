const axios = require('axios');

class SmsService {
  /**
   * Send SMS using SMS gateway
   * Currently supports: Twilio, AWS SNS, or Vietnamese providers (VIETGUYS, STRINGEE)
   */
  async sendSms(phoneNumber, message) {
    try {
      const provider = process.env.SMS_PROVIDER || 'log'; // log, twilio, vietguys

      switch (provider) {
        case 'twilio':
          return await this.sendViaTwilio(phoneNumber, message);
        
        case 'vietguys':
          return await this.sendViaVietguys(phoneNumber, message);
        
        case 'stringee':
          return await this.sendViaStringee(phoneNumber, message);
        
        default:
          // Development mode: just log
          console.log('=== SMS (Development Mode) ===');
          console.log('To:', phoneNumber);
          console.log('Message:', message);
          console.log('==============================');
          return true;
      }
    } catch (error) {
      console.error('Send SMS error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send via Twilio
   */
  async sendViaTwilio(phoneNumber, message) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      
      const response = await axios.post(url, 
        new URLSearchParams({
          To: phoneNumber,
          From: fromNumber,
          Body: message
        }), 
        {
          auth: {
            username: accountSid,
            password: authToken
          }
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send via Vietguys (Vietnamese SMS provider)
   */
  async sendViaVietguys(phoneNumber, message) {
    try {
      const apiKey = process.env.VIETGUYS_API_KEY;
      const brandName = process.env.VIETGUYS_BRAND_NAME || 'Healthcare';

      const response = await axios.post('http://api.vietguys.biz:8098/api', {
        from: brandName,
        to: phoneNumber,
        text: message,
        apiKey: apiKey,
        type: 1 // 1 = Marketing, 2 = Customer Care
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send via Stringee (Vietnamese provider)
   */
  async sendViaStringee(phoneNumber, message) {
    try {
      const apiKey = process.env.STRINGEE_API_KEY;
      const apiSecret = process.env.STRINGEE_API_SECRET;

      // TODO: Implement Stringee API
      console.log('Stringee SMS not implemented yet');
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send appointment reminder SMS
   */
  async sendAppointmentReminder(appointment) {
    try {
      const message = `Nhac nho lich kham: Ban co lich hen voi BS ${appointment.doctor.full_name} vao ${appointment.time_slot} ngay ${appointment.appointment_date}. Vui long chuan bi day du.`;
      
      await this.sendSms(appointment.patient.phone, message);
      return true;
    } catch (error) {
      console.error('Send appointment reminder SMS error:', error);
      return false;
    }
  }

  /**
   * Send appointment confirmation SMS
   */
  async sendAppointmentConfirmation(appointment) {
    try {
      const message = `Xac nhan lich hen: Lich hen cua ban voi BS ${appointment.doctor.full_name} vao ${appointment.time_slot} ngay ${appointment.appointment_date} da duoc xac nhan.`;
      
      await this.sendSms(appointment.patient.phone, message);
      return true;
    } catch (error) {
      console.error('Send appointment confirmation SMS error:', error);
      return false;
    }
  }

  /**
   * Send OTP SMS
   */
  async sendOtp(phoneNumber, otp) {
    try {
      const message = `Ma xac thuc cua ban la: ${otp}. Ma co hieu luc trong 5 phut.`;
      
      await this.sendSms(phoneNumber, message);
      return true;
    } catch (error) {
      console.error('Send OTP SMS error:', error);
      return false;
    }
  }

  /**
   * Send verification code
   */
  async sendVerificationCode(phoneNumber, code) {
    try {
      const message = `Ma xac thuc tai khoan cua ban la: ${code}`;
      
      await this.sendSms(phoneNumber, message);
      return true;
    } catch (error) {
      console.error('Send verification code SMS error:', error);
      return false;
    }
  }
}

module.exports = new SmsService();
