const express = require('express');
const {
  getAllPosts,
  createPost,
  addComment,
  likePost,
  likeComment,
  sharePost,
  deletePost,
  unlikePost,
  editPost,
  getPostById,
  deleteComment,
  countPosts,
  getAllComments,
  countPostsByUsername,
  getPostsByUsername,
} = require('../controllers/postController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // Multer middleware for image upload

const router = express.Router();

// Route để đếm tổng số bài viết (đặt trước endpoint có tham số)
router.get('/count', countPosts);

// Route lấy tất cả bài viết
router.get('/', getAllPosts);

// Route tạo bài viết mới (có hỗ trợ upload nhiều ảnh)
router.post('/', isAuthenticated, upload.array('images', 10), (req, res) => {
  console.log('Uploaded files:', req.files);
  createPost(req, res);  // Call createPost after upload
});

// Route chỉnh sửa bài viết (có hỗ trợ upload nhiều ảnh)
router.put('/:postId', isAuthenticated, upload.array('images', 10), (req, res) => {
  console.log('Updated files:', req.files); // Check updated files
  editPost(req, res); // Call editPost after handling images
});

// Route nhóm các hành động liên quan đến bài viết
router
  .route('/:postId')
  .post(isAuthenticated, addComment) // Thêm comment
  .get(getPostById) // Lấy bài viết
  .delete(isAuthenticated, deletePost); // Xóa bài viết

// Route thích hoặc bỏ thích bài viết
router.post('/:postId/like', isAuthenticated, likePost);
router.post('/:postId/unlike', isAuthenticated, unlikePost);

// Route chia sẻ bài viết
router.post('/:postId/share', isAuthenticated, sharePost);

// Route liên quan đến comment
router.route('/:postId/comments')
  .post(isAuthenticated, addComment); // Thêm comment

router.route('/comments/:commentId')
  .delete(isAuthenticated, deleteComment); // Xóa comment

router.route('/:postId/comments/:commentId/like')
  .post(isAuthenticated, likeComment); // Thích comment

router.get('/count/:username', countPostsByUsername);

router.get('/comments', getAllComments);
router.get('/users/:username', getPostsByUsername);
module.exports = router;
