/**
 * MAIN ROUTES
 * Central route configuration
 */

const express = require('express');
const router = express.Router();

// Import Controllers
const HomeController = require('../controllers/HomeController');
const DoctorController = require('../controllers/DoctorController');
const PostController = require('../controllers/PostController');
const SpecialtyController = require('../controllers/SpecialtyController');
const AppointmentController = require('../controllers/AppointmentController');

// ===== HOME ROUTES =====
router.get('/', HomeController.index);
router.get('/about', HomeController.about);
router.get('/contact', HomeController.contact);

// ===== AUTH PAGES =====
router.get('/login', (req, res) => {
  res.render('auth/login', { layout: false });
});
router.get('/register', (req, res) => {
  res.render('auth/register', { layout: false });
});

// ===== DOCTOR ROUTES =====
router.get('/doctors', DoctorController.index);
router.get('/doctors/:id', DoctorController.show);

// ===== POST/NEWS ROUTES =====
router.get('/posts', PostController.index);
router.get('/posts/:slug', PostController.show);

// ===== SPECIALTY ROUTES =====
router.get('/specialties', SpecialtyController.index);
router.get('/specialties/:slug', SpecialtyController.show);

// ===== APPOINTMENT ROUTES (Protected - require auth) =====
// Note: These routes will need auth middleware when authentication is implemented
// router.get('/appointments/book/:doctorId', AppointmentController.bookingForm);
// router.post('/appointments/book', AppointmentController.createBooking);
// router.get('/appointments/my-appointments', AppointmentController.myAppointments);
// router.post('/appointments/:id/cancel', AppointmentController.cancelAppointment);

// ===== ADDITIONAL STATIC PAGES =====
router.get('/departments', (req, res) => {
  res.render('departments', { 
    pageTitle: 'Các Khoa', 
    currentPath: req.path 
  });
});

router.get('/emergency', (req, res) => {
  res.render('emergency', { 
    pageTitle: 'Cấp Cứu 24/7', 
    currentPath: req.path 
  });
});

router.get('/privacy', (req, res) => {
  res.render('privacy', { 
    pageTitle: 'Chính Sách Bảo Mật', 
    currentPath: req.path 
  });
});

router.get('/terms', (req, res) => {
  res.render('terms', { 
    pageTitle: 'Điều Khoản Sử Dụng', 
    currentPath: req.path 
  });
});

router.get('/health-check', (req, res) => {
  res.render('health-check', { 
    pageTitle: 'Gói Khám Sức Khỏe', 
    currentPath: req.path 
  });
});

// ===== TEST ROUTE =====
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
