const express = require('express');
const { registerUser, loginUser, getUserProfile, updateUserProfile, checkAdmin,countUsers ,searchUsers} = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

// Đăng ký người dùng
router.post('/register', registerUser);

// Đăng nhập người dùng
router.post('/login', loginUser);

// Lấy profile người dùng (Không cần xác thực)
router.get('/:username', getUserProfile);

// Cập nhật profile người dùng (Cần xác thực và upload ảnh)
router.put('/:username', isAuthenticated, upload.single('profileImg'), updateUserProfile);

// Admin Data Endpoint - Only accessible for admin users
router.get('/admin/data', isAuthenticated, isAdmin, (req, res) => {
  res.status(200).json({
    message: 'Welcome, Admin! You have access to this data.',
  });
});
router.get('/search', searchUsers);


// Example /check-admin route to check if user is admin
router.get('/check-admin', isAuthenticated, checkAdmin);
router.get('/admin/data/count', isAuthenticated, isAdmin, countUsers);


module.exports = router;
