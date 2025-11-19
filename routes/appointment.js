// Route appointment
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/AppointmentController');
const { requireAuth } = require('../middleware/auth');
const appointmentValidator = require('../validators/appointmentValidator');

router.use(requireAuth);

// Web views
router.get('/booking', appointmentController.create);
router.post('/booking', appointmentValidator.create, appointmentController.store);
router.get('/history', appointmentController.history);

module.exports = router;
