// Route admin
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Posts Management
router.get('/posts', adminController.showPostsList);
router.get('/posts/create', adminController.showCreatePostForm);
router.get('/posts/edit/:id', adminController.showEditPostForm);
router.post('/posts/create', upload.single('thumbnail'), adminController.createPost);
router.put('/posts/:id', upload.single('thumbnail'), adminController.updatePost);
router.delete('/posts/:id', adminController.deletePost);

// Image upload for CKEditor
router.post('/upload-image', upload.single('upload'), adminController.uploadImage);

module.exports = router;
