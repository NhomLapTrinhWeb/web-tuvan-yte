const crypto = require('crypto');
const axios = require('axios');
const querystring = require('querystring');
const { Transaction, Appointment } = require('../models');

class PaymentService {
  /**
   * Tạo payment transaction
   */
  static async createTransaction(appointmentId, userId, amount, paymentMethod = 'vnpay') {
    try {
      const transactionCode = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const transaction = await Transaction.create({
        appointment_id: appointmentId,
        transaction_code: transactionCode,
        amount: amount,
        payment_method: paymentMethod,
        status: 'pending',
        payment_info: {}
      });

      return transaction;
    } catch (error) {
      throw new Error(`Create transaction failed: ${error.message}`);
    }
  }

  /**
   * Tạo VNPAY payment URL
   */
  static async createVNPayPaymentUrl(transaction, returnUrl) {
    try {
      const vnpUrl = process.env.VNPAY_URL;
      const tmnCode = process.env.VNPAY_TMN_CODE;
      const secretKey = process.env.VNPAY_HASH_SECRET;

      const createDate = this.formatDateTime(new Date());
      const orderId = transaction.transaction_code;
      const amount = transaction.amount * 100; // VNPay expects amount in VND cents
      const locale = 'vn';
      const currCode = 'VND';
      const ipAddr = '127.0.0.1'; // Should get from request in production

      let vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: locale,
        vnp_CurrCode: currCode,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toan lich kham ${transaction.appointment_id}`,
        vnp_OrderType: 'other',
        vnp_Amount: amount,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate
      };

      // Sort params
      vnpParams = this.sortObject(vnpParams);

      // Create signature
      const signData = querystring.stringify(vnpParams, { encode: false });
      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      vnpParams['vnp_SecureHash'] = signed;

      // Build payment URL
      const paymentUrl = vnpUrl + '?' + querystring.stringify(vnpParams, { encode: false });

      return paymentUrl;
    } catch (error) {
      throw new Error(`Create VNPay URL failed: ${error.message}`);
    }
  }

  /**
   * Verify VNPAY callback
   */
  static verifyVNPayCallback(vnpParams) {
    try {
      const secureHash = vnpParams['vnp_SecureHash'];
      const secretKey = process.env.VNPAY_HASH_SECRET;

      delete vnpParams['vnp_SecureHash'];
      delete vnpParams['vnp_SecureHashType'];

      vnpParams = this.sortObject(vnpParams);
      const signData = querystring.stringify(vnpParams, { encode: false });
      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      return secureHash === signed;
    } catch (error) {
      return false;
    }
  }

  /**
   * Tạo MOMO payment URL
   */
  static async createMomoPaymentUrl(transaction, returnUrl) {
    try {
      const partnerCode = process.env.MOMO_PARTNER_CODE;
      const accessKey = process.env.MOMO_ACCESS_KEY;
      const secretKey = process.env.MOMO_SECRET_KEY;
      const endpoint = process.env.MOMO_ENDPOINT;

      const orderId = transaction.transaction_code;
      const requestId = orderId;
      const amount = transaction.amount;
      const orderInfo = `Thanh toan lich kham ${transaction.appointment_id}`;
      const redirectUrl = returnUrl;
      const ipnUrl = `${process.env.APP_URL}/api/v1/payments/callback/momo`;
      const requestType = 'captureWallet';
      const extraData = '';

      // Create signature
      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
      const signature = crypto.createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

      // Request body
      const requestBody = {
        partnerCode,
        accessKey,
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType,
        signature,
        lang: 'vi'
      };

      // Call Momo API
      const response = await axios.post(endpoint, requestBody);

      if (response.data.resultCode === 0) {
        return response.data.payUrl;
      } else {
        throw new Error(`Momo error: ${response.data.message}`);
      }
    } catch (error) {
      throw new Error(`Create Momo URL failed: ${error.message}`);
    }
  }

  /**
   * Verify MOMO callback
   */
  static verifyMomoCallback(data) {
    try {
      const secretKey = process.env.MOMO_SECRET_KEY;
      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature
      } = data;

      // Create signature to verify
      const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
      
      const expectedSignature = crypto.createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update transaction status
   */
  static async updateTransactionStatus(transactionCode, status, paymentInfo = {}) {
    try {
      const transaction = await Transaction.findOne({
        where: { transaction_code: transactionCode }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const updateData = {
        status,
        payment_info: paymentInfo
      };

      if (status === 'paid') {
        updateData.paid_at = new Date();
      }

      await transaction.update(updateData);

      // Update appointment status if paid
      if (status === 'paid') {
        await Appointment.update(
          { status: 'confirmed' },
          { where: { id: transaction.appointment_id } }
        );
      }

      return transaction;
    } catch (error) {
      throw new Error(`Update transaction failed: ${error.message}`);
    }
  }

  /**
   * Process refund
   */
  static async processRefund(transactionId, reason) {
    try {
      const transaction = await Transaction.findByPk(transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'paid') {
        throw new Error('Only paid transactions can be refunded');
      }

      // In production, call payment gateway refund API
      // For now, just update database
      await transaction.update({
        status: 'refunded',
        refunded_at: new Date(),
        refund_reason: reason
      });

      return transaction;
    } catch (error) {
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  /**
   * Get transaction by code
   */
  static async getTransactionByCode(transactionCode) {
    try {
      const transaction = await Transaction.findOne({
        where: { transaction_code: transactionCode },
        include: [
          {
            model: Appointment,
            as: 'appointment',
            include: ['patient', 'doctor']
          }
        ]
      });

      return transaction;
    } catch (error) {
      throw new Error(`Get transaction failed: ${error.message}`);
    }
  }

  /**
   * Helper: Sort object by key
   */
  static sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  /**
   * Helper: Format datetime for VNPay
   */
  static formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}

module.exports = PaymentService;
