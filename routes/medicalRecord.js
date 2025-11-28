const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');

// Route cho Bác sĩ nhập liệu
router.get('/create/:appointmentId', medicalRecordController.showCreateForm);
router.post('/create', medicalRecordController.store);

// Route xem chi tiết (cho cả BS và BN)
router.get('/view/:appointmentId', medicalRecordController.showDetail);

module.exports = router;