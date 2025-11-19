# TESTING STRATEGY - HỆ THỐNG TƯ VẤN Y TẾ

## Mục lục
1. [Tổng quan chiến lược testing](#1-tổng-quan-chiến-lược-testing)
2. [Unit Testing](#2-unit-testing)
3. [Integration Testing](#3-integration-testing)
4. [End-to-End Testing](#4-end-to-end-testing)
5. [API Testing](#5-api-testing)
6. [Security Testing](#6-security-testing)
7. [Performance Testing](#7-performance-testing)
8. [Test Data & Environment](#8-test-data--environment)

---

## 1. Tổng quan chiến lược testing

### 1.1 Mục tiêu

- ✅ Đảm bảo tất cả chức năng hoạt động đúng
- ✅ Phát hiện bugs sớm trước khi deploy production
- ✅ Đảm bảo bảo mật (authentication, authorization, payment)
- ✅ Đảm bảo hiệu năng đáp ứng yêu cầu
- ✅ Tự động hóa testing để CI/CD

### 1.2 Test Pyramid

```
                    /\
                   /  \
                  / E2E \         10% - End-to-End Tests
                 /______\
                /        \
               /Integration\      30% - Integration Tests
              /____________\
             /              \
            /  Unit  Tests   \    60% - Unit Tests
           /_________________ \
```

### 1.3 Testing Tools

| Tool | Purpose | Usage |
|------|---------|-------|
| **Jest** | Unit & Integration Testing | Test services, utils, middleware |
| **Supertest** | API Testing | Test HTTP endpoints |
| **Postman/Newman** | API Collection Testing | Manual & automated API tests |
| **Selenium/Cypress** | E2E Testing | Test full user flows |
| **Artillery** | Load Testing | Performance & stress testing |
| **OWASP ZAP** | Security Testing | Vulnerability scanning |

### 1.4 Test Coverage Target

| Layer | Target Coverage |
|-------|----------------|
| Utils | 90% |
| Services | 85% |
| Controllers | 80% |
| Middleware | 85% |
| Overall | 80% |

---

## 2. Unit Testing

### 2.1 Utils Testing

#### Test File: `tests/unit/utils/dateUtils.test.js`

```javascript
const {
  formatDate,
  generateTimeSlots,
  isOverlap,
  getHoursDifference
} = require('../../../utils/dateUtils');

describe('dateUtils', () => {
  describe('formatDate', () => {
    test('should format date to YYYY-MM-DD', () => {
      const date = new Date('2025-11-19T10:30:00.000Z');
      expect(formatDate(date)).toBe('2025-11-19');
    });

    test('should handle invalid date', () => {
      expect(() => formatDate('invalid')).toThrow();
    });
  });

  describe('generateTimeSlots', () => {
    test('should generate correct time slots', () => {
      const slots = generateTimeSlots('08:00', '10:00', 30);
      expect(slots).toEqual([
        '08:00-08:30',
        '08:30-09:00',
        '09:00-09:30',
        '09:30-10:00'
      ]);
    });

    test('should return empty array if start >= end', () => {
      const slots = generateTimeSlots('10:00', '08:00', 30);
      expect(slots).toEqual([]);
    });

    test('should handle duration larger than range', () => {
      const slots = generateTimeSlots('08:00', '08:30', 60);
      expect(slots).toEqual([]);
    });
  });

  describe('isOverlap', () => {
    test('should detect overlap', () => {
      expect(isOverlap(540, 600, 570, 630)).toBe(true); // 09:00-10:00 vs 09:30-10:30
      expect(isOverlap(540, 600, 510, 570)).toBe(true); // 09:00-10:00 vs 08:30-09:30
    });

    test('should return false for no overlap', () => {
      expect(isOverlap(540, 600, 600, 660)).toBe(false); // 09:00-10:00 vs 10:00-11:00
      expect(isOverlap(540, 600, 480, 540)).toBe(false); // 09:00-10:00 vs 08:00-09:00
    });
  });

  describe('getHoursDifference', () => {
    test('should calculate hours difference correctly', () => {
      const date1 = new Date('2025-11-19T08:00:00.000Z');
      const date2 = new Date('2025-11-19T10:30:00.000Z');
      expect(getHoursDifference(date2, date1)).toBe(2.5);
    });
  });
});
```

#### Test File: `tests/unit/utils/tokenUtils.test.js`

```javascript
const {
  generateToken,
  verifyToken,
  generateRefreshToken
} = require('../../../utils/tokenUtils');

describe('tokenUtils', () => {
  describe('generateToken', () => {
    test('should generate valid JWT token', () => {
      const payload = { userId: 1, role: 'patient' };
      const token = generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should include payload in token', () => {
      const payload = { userId: 1, role: 'patient' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(1);
      expect(decoded.role).toBe('patient');
    });
  });

  describe('verifyToken', () => {
    test('should verify valid token', () => {
      const payload = { userId: 1 };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(1);
    });

    test('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid_token')).toThrow();
    });

    test('should throw error for expired token', () => {
      const token = generateToken({ userId: 1 }, '0s'); // Expires immediately
      setTimeout(() => {
        expect(() => verifyToken(token)).toThrow('Token expired');
      }, 100);
    });
  });

  describe('generateRefreshToken', () => {
    test('should generate refresh token with longer expiry', () => {
      const payload = { userId: 1 };
      const accessToken = generateToken(payload, '1h');
      const refreshToken = generateRefreshToken(payload); // 7d default
      
      expect(refreshToken).toBeDefined();
      expect(refreshToken).not.toBe(accessToken);
    });
  });
});
```

#### Test File: `tests/unit/utils/helpers.test.js`

```javascript
const {
  generateRandomString,
  maskEmail,
  maskPhone,
  sanitizeHtml,
  calculateAge,
  formatCurrency
} = require('../../../utils/helpers');

describe('helpers', () => {
  describe('generateRandomString', () => {
    test('should generate string of specified length', () => {
      const str = generateRandomString(32);
      expect(str).toHaveLength(32);
    });

    test('should generate different strings', () => {
      const str1 = generateRandomString(16);
      const str2 = generateRandomString(16);
      expect(str1).not.toBe(str2);
    });
  });

  describe('maskEmail', () => {
    test('should mask email correctly', () => {
      expect(maskEmail('patient@example.com')).toBe('pa****t@example.com');
      expect(maskEmail('a@example.com')).toBe('a@example.com');
    });
  });

  describe('maskPhone', () => {
    test('should mask phone number', () => {
      expect(maskPhone('0912345678')).toBe('0912***678');
      expect(maskPhone('123456')).toBe('123***');
    });
  });

  describe('sanitizeHtml', () => {
    test('should remove script tags', () => {
      const input = 'Hello <script>alert("XSS")</script>World';
      expect(sanitizeHtml(input)).toBe('Hello World');
    });

    test('should allow safe HTML', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      expect(sanitizeHtml(input)).toContain('Hello');
    });
  });

  describe('calculateAge', () => {
    test('should calculate age correctly', () => {
      const birthDate = new Date('1990-01-15');
      const age = calculateAge(birthDate);
      expect(age).toBeGreaterThanOrEqual(35); // As of 2025
    });
  });

  describe('formatCurrency', () => {
    test('should format Vietnamese currency', () => {
      expect(formatCurrency(300000)).toBe('300.000đ');
      expect(formatCurrency(1500000)).toBe('1.500.000đ');
    });
  });
});
```

---

### 2.2 Services Testing

#### Test File: `tests/unit/services/PaymentService.test.js`

```javascript
const PaymentService = require('../../../services/PaymentService');
const crypto = require('crypto');

describe('PaymentService', () => {
  let paymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
  });

  describe('createVNPayPaymentUrl', () => {
    test('should create valid VNPAY URL', () => {
      const transaction = {
        id: 1,
        transaction_code: 'TXN123456',
        amount: 300000
      };
      const orderInfo = 'Thanh toan kham benh';

      const url = paymentService.createVNPayPaymentUrl(transaction, orderInfo);

      expect(url).toContain('sandbox.vnpayment.vn');
      expect(url).toContain('vnp_Amount=30000000'); // Amount * 100
      expect(url).toContain('vnp_TxnRef=TXN123456');
      expect(url).toContain('vnp_SecureHash=');
    });

    test('should include all required parameters', () => {
      const transaction = { transaction_code: 'TXN123', amount: 100000 };
      const url = paymentService.createVNPayPaymentUrl(transaction, 'Test');

      expect(url).toContain('vnp_Version');
      expect(url).toContain('vnp_Command');
      expect(url).toContain('vnp_TmnCode');
      expect(url).toContain('vnp_OrderInfo');
      expect(url).toContain('vnp_ReturnUrl');
    });
  });

  describe('verifyVNPaySignature', () => {
    test('should verify valid signature', () => {
      const params = {
        vnp_Amount: '30000000',
        vnp_TxnRef: 'TXN123',
        vnp_ResponseCode: '00'
      };

      // Create signature
      const signData = new URLSearchParams(params).toString();
      const signature = crypto
        .createHmac('sha512', process.env.VNPAY_HASH_SECRET)
        .update(signData)
        .digest('hex');

      const isValid = paymentService.verifyVNPaySignature({
        ...params,
        vnp_SecureHash: signature
      });

      expect(isValid).toBe(true);
    });

    test('should reject invalid signature', () => {
      const params = {
        vnp_Amount: '30000000',
        vnp_TxnRef: 'TXN123',
        vnp_SecureHash: 'invalid_signature'
      };

      const isValid = paymentService.verifyVNPaySignature(params);
      expect(isValid).toBe(false);
    });
  });

  describe('calculateRefundAmount', () => {
    test('should return 100% for cancellation >= 24h', () => {
      const hoursUntil = 25;
      const amount = 300000;
      
      const result = paymentService.calculateRefundAmount(amount, hoursUntil);
      
      expect(result.refundAmount).toBe(300000);
      expect(result.refundPercentage).toBe(100);
    });

    test('should return 50% for cancellation 12-24h', () => {
      const hoursUntil = 18;
      const amount = 300000;
      
      const result = paymentService.calculateRefundAmount(amount, hoursUntil);
      
      expect(result.refundAmount).toBe(150000);
      expect(result.refundPercentage).toBe(50);
    });

    test('should return 0% for cancellation < 12h', () => {
      const hoursUntil = 6;
      const amount = 300000;
      
      const result = paymentService.calculateRefundAmount(amount, hoursUntil);
      
      expect(result.refundAmount).toBe(0);
      expect(result.refundPercentage).toBe(0);
    });
  });
});
```

---

### 2.3 Middleware Testing

#### Test File: `tests/unit/middleware/validationMiddleware.test.js`

```javascript
const { validate } = require('../../../middleware/validationMiddleware');
const { body, validationResult } = require('express-validator');

describe('validationMiddleware', () => {
  test('should pass validation for valid data', async () => {
    const validations = [
      body('email').isEmail(),
      body('password').isLength({ min: 6 })
    ];

    const req = {
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    };
    const res = {};
    const next = jest.fn();

    const middleware = validate(validations);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });

  test('should return 422 for invalid data', async () => {
    const validations = [
      body('email').isEmail(),
      body('password').isLength({ min: 6 })
    ];

    const req = {
      body: {
        email: 'invalid-email',
        password: '123' // Too short
      }
    };
    const res = {
      status: jest.fn().returnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    const middleware = validate(validations);
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errors: expect.any(Array)
      })
    );
  });
});
```

---

## 3. Integration Testing

### 3.1 Database Integration Tests

#### Test File: `tests/integration/models/Appointment.test.js`

```javascript
const { Appointment, User, Doctor, Patient } = require('../../../models');
const { sequelize } = require('../../../config/database');

describe('Appointment Model Integration', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true }); // Reset database
  });

  afterAll(async () => {
    await sequelize.close();
  });

  let doctor, patient;

  beforeEach(async () => {
    // Create test user and doctor
    const doctorUser = await User.create({
      email: 'doctor@test.com',
      password: 'hashed_password',
      full_name: 'Dr. Test',
      role: 'doctor'
    });

    doctor = await Doctor.create({
      user_id: doctorUser.id,
      specialty_id: 1,
      is_approved: true
    });

    // Create test patient
    const patientUser = await User.create({
      email: 'patient@test.com',
      password: 'hashed_password',
      full_name: 'Patient Test',
      role: 'patient'
    });

    patient = await Patient.create({
      user_id: patientUser.id
    });
  });

  afterEach(async () => {
    await Appointment.destroy({ where: {}, force: true });
    await Doctor.destroy({ where: {}, force: true });
    await Patient.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  test('should create appointment successfully', async () => {
    const appointment = await Appointment.create({
      patient_id: patient.user_id,
      doctor_id: doctor.user_id,
      appointment_date: '2025-11-20',
      time_slot: '09:00-10:00',
      appointment_type: 'online',
      status: 'pending'
    });

    expect(appointment).toBeDefined();
    expect(appointment.id).toBeDefined();
    expect(appointment.status).toBe('pending');
  });

  test('should include doctor and patient in query', async () => {
    await Appointment.create({
      patient_id: patient.user_id,
      doctor_id: doctor.user_id,
      appointment_date: '2025-11-20',
      time_slot: '09:00-10:00',
      status: 'pending'
    });

    const appointment = await Appointment.findOne({
      include: [
        { model: User, as: 'doctor' },
        { model: User, as: 'patient' }
      ]
    });

    expect(appointment.doctor).toBeDefined();
    expect(appointment.doctor.full_name).toBe('Dr. Test');
    expect(appointment.patient).toBeDefined();
    expect(appointment.patient.full_name).toBe('Patient Test');
  });

  test('should prevent duplicate appointments at same time slot', async () => {
    await Appointment.create({
      patient_id: patient.user_id,
      doctor_id: doctor.user_id,
      appointment_date: '2025-11-20',
      time_slot: '09:00-10:00',
      status: 'confirmed'
    });

    // Try to create another appointment at same time
    await expect(
      Appointment.create({
        patient_id: patient.user_id,
        doctor_id: doctor.user_id,
        appointment_date: '2025-11-20',
        time_slot: '09:00-10:00',
        status: 'pending'
      })
    ).rejects.toThrow();
  });
});
```

---

### 3.2 Service Integration Tests

#### Test File: `tests/integration/services/NotificationService.test.js`

```javascript
const NotificationService = require('../../../services/NotificationService');
const EmailService = require('../../../services/EmailService');
const { Notification, User } = require('../../../models');

jest.mock('../../../services/EmailService');

describe('NotificationService Integration', () => {
  let notificationService;
  let user;

  beforeAll(async () => {
    notificationService = new NotificationService();
    
    user = await User.create({
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'patient'
    });
  });

  afterAll(async () => {
    await Notification.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  test('should create notification in database', async () => {
    const notification = await notificationService.createNotification(
      user.id,
      'APPOINTMENT_NEW',
      { appointment_id: 123 }
    );

    expect(notification).toBeDefined();
    expect(notification.user_id).toBe(user.id);
    expect(notification.type).toBe('APPOINTMENT_NEW');
    expect(notification.is_read).toBe(false);

    // Verify in database
    const dbNotification = await Notification.findByPk(notification.id);
    expect(dbNotification).toBeDefined();
  });

  test('should send email for critical notifications', async () => {
    EmailService.mockImplementation(() => ({
      sendEmail: jest.fn().mockResolvedValue(true)
    }));

    await notificationService.notifyPaymentSuccess(user.id, {
      amount: 300000,
      appointment_id: 123
    });

    expect(EmailService.prototype.sendEmail).toHaveBeenCalled();
  });

  test('should get user notifications with pagination', async () => {
    // Create multiple notifications
    for (let i = 0; i < 15; i++) {
      await notificationService.createNotification(
        user.id,
        'TEST_NOTIFICATION',
        { index: i }
      );
    }

    const result = await notificationService.getUserNotifications(user.id, 1, 10);

    expect(result.notifications).toHaveLength(10);
    expect(result.total).toBeGreaterThanOrEqual(15);
  });

  test('should mark notification as read', async () => {
    const notification = await notificationService.createNotification(
      user.id,
      'TEST',
      {}
    );

    await notificationService.markAsRead(notification.id);

    const updated = await Notification.findByPk(notification.id);
    expect(updated.is_read).toBe(true);
  });
});
```

---

## 4. End-to-End Testing

### 4.1 User Flow: Complete Appointment Booking

```javascript
// tests/e2e/appointmentBooking.test.js
const request = require('supertest');
const app = require('../../app');

describe('E2E: Complete Appointment Booking Flow', () => {
  let accessToken;
  let patientId;
  let doctorId;
  let appointmentId;
  let transactionId;

  // Step 1: Register and login as patient
  test('Step 1: Patient registers and logs in', async () => {
    // Register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `patient_${Date.now()}@test.com`,
        password: 'Password123!',
        full_name: 'Test Patient',
        phone: '0912345678',
        role: 'patient'
      });

    expect(registerRes.status).toBe(201);

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: registerRes.body.data.user.email,
        password: 'Password123!'
      });

    expect(loginRes.status).toBe(200);
    accessToken = loginRes.body.data.tokens.accessToken;
    patientId = loginRes.body.data.user.id;
  });

  // Step 2: Search for doctors
  test('Step 2: Search for available doctors', async () => {
    const res = await request(app)
      .get('/api/doctors')
      .query({ specialty: 1, page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data.doctors).toBeDefined();
    expect(res.body.data.doctors.length).toBeGreaterThan(0);

    doctorId = res.body.data.doctors[0].id;
  });

  // Step 3: Check available time slots
  test('Step 3: Get available time slots', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = tomorrow.toISOString().split('T')[0];

    const res = await request(app)
      .get(`/api/doctors/${doctorId}/available-slots`)
      .query({ date });

    expect(res.status).toBe(200);
    expect(res.body.data.time_slots).toBeDefined();
    expect(res.body.data.time_slots.some(slot => slot.available)).toBe(true);
  });

  // Step 4: Create appointment
  test('Step 4: Create appointment', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        doctor_id: doctorId,
        appointment_date: tomorrow.toISOString().split('T')[0],
        time_slot: '09:00-10:00',
        appointment_type: 'online',
        reason: 'Khám tổng quát',
        symptoms: 'Đau đầu, mệt mỏi'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    appointmentId = res.body.data.id;
  });

  // Step 5: Create payment
  test('Step 5: Create payment', async () => {
    const res = await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        appointment_id: appointmentId,
        payment_method: 'vnpay'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.payment_url).toContain('vnpayment.vn');
    transactionId = res.body.data.transaction_id;
  });

  // Step 6: Simulate payment callback (success)
  test('Step 6: Payment callback confirms payment', async () => {
    // Simulate VNPAY callback with valid signature
    const callbackParams = {
      vnp_Amount: '30000000',
      vnp_TxnRef: 'TXN' + transactionId,
      vnp_ResponseCode: '00',
      // Add valid signature here in real test
    };

    const res = await request(app)
      .get('/api/payments/vnpay/callback')
      .query(callbackParams);

    // Should redirect to frontend
    expect(res.status).toBe(302);
    expect(res.header.location).toContain('/payment-success');
  });

  // Step 7: Verify appointment is confirmed
  test('Step 7: Verify appointment status', async () => {
    const res = await request(app)
      .get(`/api/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
    expect(res.body.data.is_paid).toBe(true);
  });

  // Step 8: Patient cancels appointment (should get refund)
  test('Step 8: Cancel appointment and get refund', async () => {
    const res = await request(app)
      .post(`/api/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        reason: 'Test cancellation'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.refund_amount).toBeGreaterThan(0);
    expect(res.body.data.status).toBe('cancelled');
  });
});
```

---

## 5. API Testing

### 5.1 Authentication API Tests

```javascript
// tests/api/auth.test.js
const request = require('supertest');
const app = require('../../app');

describe('Auth API Tests', () => {
  describe('POST /api/auth/register', () => {
    test('should register new patient successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `test_${Date.now()}@example.com`,
          password: 'Password123!',
          full_name: 'Test User',
          phone: '0912345678',
          role: 'patient'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBeDefined();
    });

    test('should return 400 for duplicate email', async () => {
      const email = `duplicate_${Date.now()}@example.com`;

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'Password123!',
          full_name: 'User 1',
          phone: '0912345678'
        });

      // Second registration with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'Password456!',
          full_name: 'User 2',
          phone: '0987654321'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should return 422 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          full_name: 'Test User'
        });

      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    test('should return 422 for weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123', // Too short
          full_name: 'Test User'
        });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeAll(async () => {
      // Create test user
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `login_test_${Date.now()}@example.com`,
          password: 'Password123!',
          full_name: 'Login Test'
        });

      testUser = res.body.data.user;
    });

    test('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
    });

    test('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword!'
        });

      expect(res.status).toBe(401);
    });

    test('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(401);
    });
  });
});
```

---

### 5.2 Appointment API Tests

```javascript
// tests/api/appointments.test.js
describe('Appointment API Tests', () => {
  let patientToken, doctorToken;
  let patientId, doctorId;

  beforeAll(async () => {
    // Setup: Create and login patient
    const patientRes = await createAndLoginUser('patient');
    patientToken = patientRes.token;
    patientId = patientRes.userId;

    // Setup: Create and login doctor
    const doctorRes = await createAndLoginUser('doctor');
    doctorToken = doctorRes.token;
    doctorId = doctorRes.userId;
  });

  describe('POST /api/appointments', () => {
    test('should create appointment successfully', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctor_id: doctorId,
          appointment_date: tomorrow.toISOString().split('T')[0],
          time_slot: '09:00-10:00',
          appointment_type: 'online',
          reason: 'Test appointment'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
    });

    test('should return 400 for past date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctor_id: doctorId,
          appointment_date: yesterday.toISOString().split('T')[0],
          time_slot: '09:00-10:00'
        });

      expect(res.status).toBe(400);
    });

    test('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .send({
          doctor_id: doctorId,
          appointment_date: '2025-11-20',
          time_slot: '09:00-10:00'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/appointments/my', () => {
    test('should return patient appointments', async () => {
      const res = await request(app)
        .get('/api/appointments/my')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.appointments).toBeDefined();
      expect(Array.isArray(res.body.data.appointments)).toBe(true);
    });

    test('should filter by status', async () => {
      const res = await request(app)
        .get('/api/appointments/my')
        .query({ status: 'pending' })
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      res.body.data.appointments.forEach(apt => {
        expect(apt.status).toBe('pending');
      });
    });
  });
});
```

---

## 6. Security Testing

### 6.1 Authentication Security Tests

```javascript
describe('Security: Authentication', () => {
  test('should prevent SQL injection in login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: "' OR '1'='1' --",
        password: "anything"
      });

    expect(res.status).toBe(401); // Should not succeed
  });

  test('should prevent XSS in registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        full_name: '<script>alert("XSS")</script>',
        password: 'Password123!'
      });

    if (res.status === 201) {
      expect(res.body.data.user.full_name).not.toContain('<script>');
    }
  });

  test('should enforce rate limiting on login', async () => {
    const email = 'ratelimit@test.com';
    const attempts = [];

    // Try 6 failed logins (limit is 5)
    for (let i = 0; i < 6; i++) {
      attempts.push(
        request(app)
          .post('/api/auth/login')
          .send({ email, password: 'wrong' })
      );
    }

    const results = await Promise.all(attempts);
    const lastResult = results[5];

    expect(lastResult.status).toBe(429); // Too many requests
  });
});
```

### 6.2 Authorization Tests

```javascript
describe('Security: Authorization', () => {
  test('should prevent patient from approving doctors', async () => {
    const patientToken = await getPatientToken();

    const res = await request(app)
      .post('/api/admin/doctors/1/approve')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ message: 'Approved' });

    expect(res.status).toBe(403); // Forbidden
  });

  test('should prevent accessing other user medical records', async () => {
    const patient1Token = await getPatientToken();
    const patient2MedicalRecord = 999; // Belongs to patient2

    const res = await request(app)
      .get(`/api/medical-records/${patient2MedicalRecord}`)
      .set('Authorization', `Bearer ${patient1Token}`);

    expect(res.status).toBe(403);
  });
});
```

### 6.3 Payment Security Tests

```javascript
describe('Security: Payment', () => {
  test('should reject payment with invalid signature', async () => {
    const res = await request(app)
      .get('/api/payments/vnpay/callback')
      .query({
        vnp_Amount: '30000000',
        vnp_TxnRef: 'TXN123',
        vnp_ResponseCode: '00',
        vnp_SecureHash: 'invalid_signature_here'
      });

    expect(res.status).toBe(400);
  });

  test('should prevent double payment for same appointment', async () => {
    const token = await getPatientToken();
    const appointmentId = 123;

    // First payment
    await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ appointment_id: appointmentId, payment_method: 'vnpay' });

    // Second payment attempt
    const res = await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ appointment_id: appointmentId, payment_method: 'vnpay' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('đã được thanh toán');
  });
});
```

---

## 7. Performance Testing

### 7.1 Load Testing với Artillery

#### Config File: `tests/performance/load-test.yml`

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 20
      name: "Sustained load"
    - duration: 60
      arrivalRate: 50
      name: "Spike test"
  processor: "./processor.js"

scenarios:
  - name: "Search doctors and create appointment"
    flow:
      # Login
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ $randomEmail() }}"
            password: "Password123!"
          capture:
            - json: "$.data.tokens.accessToken"
              as: "token"

      # Search doctors
      - get:
          url: "/api/doctors"
          qs:
            specialty: 1
            page: 1
            limit: 10
          headers:
            Authorization: "Bearer {{ token }}"

      # Get available slots
      - get:
          url: "/api/doctors/1/available-slots"
          qs:
            date: "{{ $tomorrow() }}"
          headers:
            Authorization: "Bearer {{ token }}"

      # Create appointment
      - post:
          url: "/api/appointments"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            doctor_id: 1
            appointment_date: "{{ $tomorrow() }}"
            time_slot: "09:00-10:00"
            appointment_type: "online"
            reason: "Load test"
```

**Chạy load test:**
```bash
artillery run tests/performance/load-test.yml
```

**Success criteria:**
- Response time p95 < 500ms
- Response time p99 < 1000ms
- Error rate < 1%
- Throughput >= 100 req/s

---

### 7.2 Database Query Performance

```javascript
// tests/performance/queryPerformance.test.js
describe('Database Query Performance', () => {
  test('should load appointments list in < 100ms', async () => {
    const start = Date.now();
    
    await Appointment.findAll({
      where: { patient_id: 1 },
      include: [
        { model: User, as: 'doctor' },
        { model: Specialty }
      ],
      limit: 20
    });
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  test('should search doctors efficiently', async () => {
    const start = Date.now();
    
    await Doctor.findAll({
      where: { 
        specialty_id: 1,
        is_approved: true,
        is_active: true
      },
      include: [{ model: User }],
      limit: 20
    });
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
```

---

## 8. Test Data & Environment

### 8.1 Test Database Setup

```javascript
// tests/setup.js
const { sequelize } = require('../config/database');

beforeAll(async () => {
  // Connect to test database
  await sequelize.authenticate();
  
  // Sync models (create tables)
  await sequelize.sync({ force: true });
  
  // Seed test data
  await seedTestData();
});

afterAll(async () => {
  // Cleanup
  await sequelize.close();
});

async function seedTestData() {
  // Create test specialties
  await Specialty.bulkCreate([
    { name: 'Nội tổng quát', slug: 'noi-tong-quat' },
    { name: 'Tim mạch', slug: 'tim-mach' },
    { name: 'Da liễu', slug: 'da-lieu' }
  ]);

  // Create test doctors
  for (let i = 1; i <= 10; i++) {
    const user = await User.create({
      email: `doctor${i}@test.com`,
      password: await bcrypt.hash('Password123!', 10),
      full_name: `Bác sĩ Test ${i}`,
      role: 'doctor',
      is_verified: true,
      is_active: true
    });

    await Doctor.create({
      user_id: user.id,
      specialty_id: (i % 3) + 1,
      consultation_price: 300000,
      is_approved: true,
      working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      working_hours: '08:00-17:00'
    });
  }

  // Create test patients
  for (let i = 1; i <= 20; i++) {
    const user = await User.create({
      email: `patient${i}@test.com`,
      password: await bcrypt.hash('Password123!', 10),
      full_name: `Bệnh nhân Test ${i}`,
      role: 'patient',
      is_verified: true,
      is_active: true
    });

    await Patient.create({
      user_id: user.id,
      blood_type: ['A', 'B', 'AB', 'O'][i % 4]
    });
  }
}
```

---

### 8.2 Test Environment Variables

```bash
# .env.test
NODE_ENV=test
PORT=3001

# Test Database
DB_HOST=localhost
DB_USER=test_user
DB_PASSWORD=test_password
DB_NAME=healthcare_test
DB_DIALECT=mysql

# JWT (Weak secret OK for testing)
JWT_SECRET=test_secret_key
JWT_EXPIRES_IN=24h

# Payment Gateway (Sandbox)
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_TMN_CODE=TEST_CODE
VNPAY_HASH_SECRET=TEST_SECRET

# Email (Mock)
EMAIL_SERVICE=log

# SMS (Mock)
SMS_PROVIDER=log
```

---

## 9. CI/CD Integration

### 9.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Run Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: healthcare_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          DB_HOST: 127.0.0.1
          DB_USER: root
          DB_PASSWORD: root
          DB_NAME: healthcare_test

      - name: Run API tests
        run: npm run test:api

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

      - name: Check coverage threshold
        run: npm run test:coverage:check
```

---

### 9.2 Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:api": "jest tests/api",
    "test:e2e": "jest tests/e2e",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:check": "jest --coverage --coverageThreshold='{\"global\":{\"branches\":80,\"functions\":80,\"lines\":80,\"statements\":80}}'",
    "test:performance": "artillery run tests/performance/load-test.yml"
  }
}
```

---

## Tổng kết

### Checklist trước khi Production

- [ ] Tất cả unit tests pass (coverage >= 80%)
- [ ] Tất cả integration tests pass
- [ ] E2E tests cho các flows chính pass
- [ ] API tests với Postman collection pass
- [ ] Security tests không phát hiện lỗ hổng
- [ ] Load testing đạt yêu cầu performance
- [ ] Test trên môi trường staging giống production
- [ ] Review test coverage report
- [ ] Documentation tests đã cập nhật

### Test Execution Schedule

| Phase | When | Tests | Duration |
|-------|------|-------|----------|
| Development | Every commit | Unit tests | 2-5 min |
| Pre-commit | Git hook | Unit + Lint | 3-7 min |
| PR Review | Pull request | Unit + Integration | 10-15 min |
| Staging Deploy | Before deploy | All tests | 30-45 min |
| Production Deploy | Before release | All + E2E + Load | 60+ min |

---

**Document version:** 1.0  
**Last updated:** November 19, 2025  
**Total Test Cases:** 100+  
**Status:** ✅ Complete
