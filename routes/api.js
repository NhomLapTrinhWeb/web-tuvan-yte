// API Routes v1
const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');
const appointmentController = require('../controllers/AppointmentController');
const doctorController = require('../controllers/DoctorController');
const postController = require('../controllers/PostController');
const specialtyController = require('../controllers/SpecialtyController');
// const userController = require('../controllers/api/userController');
// const medicalRecordController = require('../controllers/api/medicalRecordController');
// const paymentController = require('../controllers/api/paymentController');
// const reviewController = require('../controllers/api/reviewController');
// const chatController = require('../controllers/api/chatController');
// const notificationController = require('../controllers/api/notificationController');
// const adminController = require('../controllers/api/adminController');

// Import middlewares
const { authenticate, authorize } = require('../middleware/auth');
const appointmentValidator = require('../validators/appointmentValidator');

// ============================================
// 1. Authentication Routes (Public)
// ============================================
// Note: Auth routes already exist in /api/auth
// These are duplicates and should be removed or use /api/auth endpoints

// ============================================
// 2. User Profile Routes (Private)
// ============================================
// TODO: Implement userController
// router.get('/users/me',
//   authenticate,
//   userController.getCurrentUser
// );

// router.put('/users/me',
//   authenticate,
//   validate(updateProfileSchema),
//   userController.updateProfile
// );

// router.post('/users/me/avatar',
//   authenticate,
//   userController.uploadAvatar
// );

// router.post('/users/me/change-password',
//   authenticate,
//   userController.changePassword
// );

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

// TODO: Implement availability and schedules
// router.get('/doctors/:id/availability',
//   doctorController.getDoctorAvailability
// );

// router.get('/doctors/:id/reviews',
//   reviewController.getDoctorReviews
// );

// // Doctor private routes
// router.get('/doctors/me/schedules',
//   authenticate,
//   authorize('doctor'),
//   doctorController.getMySchedules
// );

// router.post('/doctors/me/schedules',
//   authenticate,
//   authorize('doctor'),
//   doctorController.updateSchedules
// );

// router.get('/doctors/me/statistics',
//   authenticate,
//   authorize('doctor'),
//   doctorController.getStatistics
// );

// ============================================
// 5. Appointments Routes
// ============================================
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

// TODO: Implement complete appointment
// router.post('/appointments/:id/complete',
//   authenticate,
//   authorize('doctor'),
//   appointmentController.completeAppointment
// );

// TODO: Implement remaining controllers (medical records, payments, reviews, chat, notifications, admin)
// See FIXES_COMPLETED.md for full API documentation

// ============================================
// 12. Posts & CMS Routes
// ============================================
router.get('/posts',
  postController.index
);

router.get('/posts/:slug',
  postController.show
);

// TODO: Implement create/update/delete posts
// router.post('/posts',
//   authenticate,
//   authorize('admin', 'doctor'),
//   postController.createPost
// );

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
