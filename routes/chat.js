// Route chat
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, chatController.index);

module.exports = router;
