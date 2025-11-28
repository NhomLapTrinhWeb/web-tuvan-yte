// API Routes v1
const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');
// const appointmentController = require('../controllers/AppointmentController'); // Tạm tắt để tránh lỗi
const doctorController = require('../controllers/DoctorController');
const postController = require('../controllers/PostController');
const specialtyController = require('../controllers/SpecialtyController');

// Import middlewares
const { authenticate, authorize } = require('../middleware/auth');
// const appointmentValidator = require('../validators/appointmentValidator'); // Tạm tắt

// ============================================
// 1. Authentication Routes (Public)
// ============================================
// (Đã có trong /api/auth, bỏ qua)

// ============================================
// 2. User Profile Routes (Private)
// ============================================
// (Đang chờ phát triển)

// ============================================
// 3. Specialties Routes (Public)
// ============================================
router.get('/specialties',
  specialtyController.index
);

router.get('/specialties/:slug',
  specialtyController.show
);

// ============================================
// 4. Doctors Routes
// ============================================
// Public routes
router.get('/doctors',
  doctorController.index
);

router.get('/doctors/:id',
  doctorController.show
);

// ============================================
// 5. Appointments Routes (TẠM KHÓA ĐỂ CHẠY WEB VIEW)
// ============================================
/*
// Patient routes
router.post('/appointments',
  authenticate,
  authorize('patient'),
  appointmentValidator.create,
  appointmentController.createAppointment
);

router.get('/appointments/my',
  authenticate,
  authorize('patient'),
  appointmentController.getMyAppointments
);

router.get('/appointments/:id',
  authenticate,
  appointmentController.getAppointmentDetail
);

router.post('/appointments/:id/cancel',
  authenticate,
  appointmentController.cancelAppointment
);

// Doctor routes
router.get('/appointments/doctor/my',
  authenticate,
  authorize('doctor'),
  appointmentController.getDoctorAppointments
);

router.post('/appointments/:id/confirm',
  authenticate,
  authorize('doctor'),
  appointmentController.confirmAppointment
);

router.post('/appointments/:id/reject',
  authenticate,
  authorize('doctor'),
  appointmentController.rejectAppointment
);
*/

// ============================================
// 12. Posts & CMS Routes
// ============================================
router.get('/posts',
  postController.index
);

router.get('/posts/:slug',
  postController.show
);

// ============================================
// Health Check
// ============================================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============================================
// 404 Handler
// ============================================
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

module.exports = router;