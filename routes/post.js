// Route post
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.get('/', postController.index);
router.get('/:slug', postController.show);

module.exports = router;
