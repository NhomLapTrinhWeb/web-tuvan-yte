const crypto = require('crypto');
const querystring = require('qs');
const moment = require('moment');
const { Appointment, Doctor, User, TimeSlot } = require('../models');

// Helper function to sort object keys
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach(key => {
    sorted[key] = obj[key];
  });
  return sorted;
}

const paymentController = {
  /**
   * Create payment URL for appointment
   * POST /api/payment/create
   */
  async createPayment(req, res) {
    try {
      const { appointmentId, bankCode = '' } = req.body;
      
      if (!appointmentId) {
        return res.status(400).json({ 
          success: false,
          error: 'Appointment ID is required' 
        });
      }

      // Get appointment details
      const appointment = await Appointment.findByPk(appointmentId, {
        include: [
          {
            model: Doctor,
            as: 'doctor',
            include: [{ model: User, as: 'user' }]
          }
        ]
      });

      if (!appointment) {
        return res.status(404).json({ 
          success: false,
          error: 'Appointment not found' 
        });
      }

      // Check if already paid
      if (appointment.payment_status === 'paid') {
        return res.status(400).json({ 
          success: false,
          error: 'Appointment already paid' 
        });
      }

      const vnpUrl = process.env.VNPAY_URL;
      const tmnCode = process.env.VNPAY_TMN_CODE;
      const secretKey = process.env.VNPAY_HASH_SECRET;
      const returnUrl = `${process.env.APP_URL}/api/payment/vnpay-return`;

      const createDate = moment().format('YYYYMMDDHHmmss');
      const orderId = `APT${appointmentId}_${createDate}`;
      const amount = appointment.consultation_fee * 100; // VNPAY requires amount * 100
      const orderInfo = `Thanh toan kham benh - Ma hen: ${appointmentId}`;
      const orderType = 'billpayment';
      const locale = 'vn';
      const currCode = 'VND';
      
      let vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: locale,
        vnp_CurrCode: currCode,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: orderType,
        vnp_Amount: amount,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1',
        vnp_CreateDate: createDate
      };

      if (bankCode) {
        vnpParams.vnp_BankCode = bankCode;
      }

      // Sort params and create signature
      vnpParams = sortObject(vnpParams);
      const signData = querystring.stringify(vnpParams, { encode: false });
      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      vnpParams.vnp_SecureHash = signed;

      // Build payment URL
      const paymentUrl = vnpUrl + '?' + querystring.stringify(vnpParams, { encode: false });

      // Update appointment
      await appointment.update({
        transaction_id: orderId,
        payment_method: 'vnpay',
        payment_status: 'pending'
      });

      res.json({
        success: true,
        paymentUrl,
        orderId
      });

    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create payment' 
      });
    }
  },

  /**
   * Handle VNPAY return callback
   * GET /api/payment/vnpay-return
   */
  async vnpayReturn(req, res) {
    try {
      let vnpParams = req.query;
      const secureHash = vnpParams.vnp_SecureHash;

      // Remove hash params before verification
      delete vnpParams.vnp_SecureHash;
      delete vnpParams.vnp_SecureHashType;

      // Sort and verify signature
      vnpParams = sortObject(vnpParams);
      const secretKey = process.env.VNPAY_HASH_SECRET;
      const signData = querystring.stringify(vnpParams, { encode: false });
      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      if (secureHash === signed) {
        const orderId = vnpParams.vnp_TxnRef;
        const rspCode = vnpParams.vnp_ResponseCode;
        const transactionNo = vnpParams.vnp_TransactionNo;
        
        // Extract appointment ID from order ID (format: APT{id}_{timestamp})
        const appointmentId = orderId.split('_')[0].replace('APT', '');

        // Find appointment
        const appointment = await Appointment.findByPk(appointmentId);

        if (!appointment) {
          return res.redirect(`/appointments/my-appointments?payment=failed&message=Appointment not found`);
        }

        if (rspCode === '00') {
          // Payment success
          await appointment.update({
            payment_status: 'paid',
            payment_date: new Date(),
            vnpay_transaction_id: transactionNo,
            status: 'confirmed'
          });

          return res.redirect(`/appointments/my-appointments?payment=success&appointmentId=${appointmentId}`);
        } else {
          // Payment failed
          await appointment.update({
            payment_status: 'failed'
          });

          return res.redirect(`/appointments/my-appointments?payment=failed&appointmentId=${appointmentId}&code=${rspCode}`);
        }
      } else {
        return res.redirect(`/appointments/my-appointments?payment=failed&message=Invalid signature`);
      }

    } catch (error) {
      console.error('VNPAY return error:', error);
      res.redirect(`/appointments/my-appointments?payment=error&message=${encodeURIComponent(error.message)}`);
    }
  },

  /**
   * Get payment info for appointment
   * GET /api/payment/:appointmentId
   */
  async getPaymentInfo(req, res) {
    try {
      const { appointmentId } = req.params;

      const appointment = await Appointment.findByPk(appointmentId, {
        include: [
          {
            model: Doctor,
            as: 'doctor',
            include: [{ model: User, as: 'user' }]
          }
        ]
      });

      if (!appointment) {
        return res.status(404).json({ 
          success: false,
          error: 'Appointment not found' 
        });
      }

      res.json({
        success: true,
        data: {
          appointmentId: appointment.id,
          amount: appointment.consultation_fee,
          paymentStatus: appointment.payment_status,
          paymentMethod: appointment.payment_method,
          transactionId: appointment.transaction_id,
          vnpayTransactionId: appointment.vnpay_transaction_id,
          paymentDate: appointment.payment_date
        }
      });

    } catch (error) {
      console.error('Get payment info error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get payment info' 
      });
    }
  }
};

module.exports = paymentController;
