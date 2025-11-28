/**
 * MAIN ROUTES
 * Central route configuration
 */

const express = require('express');
const router = express.Router();

// Import Controllers
// 👇 ĐÃ SỬA: Đổi tên biến thành chữ thường để khớp với lệnh gọi bên dưới
const homeController = require('../controllers/homeController');
const doctorController = require('../controllers/doctorController');
const postController = require('../controllers/postController');
const specialtyController = require('../controllers/specialtyController');
const chatController = require('../controllers/chatController');
// const appointmentController = require('../controllers/appointmentController'); // Tạm chưa dùng ở đây

// ===== HOME ROUTES =====
router.get('/', homeController.index);
router.get('/about', homeController.about);
router.get('/contact', homeController.contact);

// ===== AUTH PAGES =====
router.get('/login', (req, res) => {
  res.render('auth/login', { layout: false });
});
router.get('/register', (req, res) => {
  res.render('auth/register', { layout: false });
});

// ===== DOCTOR ROUTES =====
router.get('/doctors', doctorController.index);
router.get('/doctors/:id', doctorController.show);

// ===== POST/NEWS ROUTES =====
router.get('/posts', postController.index);
router.get('/posts/:slug', postController.show);

// ===== SPECIALTY ROUTES =====
router.get('/specialties', specialtyController.index);
router.get('/specialties/:slug', specialtyController.show);

// ===== ADDITIONAL STATIC PAGES =====
router.get('/departments', (req, res) => {
  res.render('departments', {
    pageTitle: 'Các Khoa',
    currentPath: req.path
  });
});

// ===== CHAT ROUTE =====
router.get('/chat', chatController.index);
// 👇 THÊM DÒNG NÀY:
router.get('/api/chat/history/:appointmentId', chatController.getHistory);


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