/**
 * PAYMENT ROUTES
 * Routes for payment processing (VNPAY integration)
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Create payment URL for appointment
router.post('/create', authenticate, paymentController.createPayment);

// VNPAY callback (no auth required - called by VNPAY)
router.get('/vnpay-return', paymentController.vnpayReturn);

// Get payment info for appointment
router.get('/:appointmentId', authenticate, paymentController.getPaymentInfo);

module.exports = router;
