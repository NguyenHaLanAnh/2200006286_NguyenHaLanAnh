const Post = require('../models/Post');
const User = require('../models/User');  // Import mô hình User
const mongoose = require('mongoose');


// Upload hình ảnh
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Tạo URL truy cập ảnh
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(201).json({ message: 'Image uploaded successfully', imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image', details: error.message });
  }
};

// Thêm bài viết mới
const createPost = async (req, res) => {
  const { userId, content } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Lưu URL của ảnh (nếu có)
    const images = req.files && req.files.length > 0
      ? req.files.map((file) => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`)
      : [];
      

    const newPost = new Post({
      author: userId,
      username: user.username,
      content: content || '',
      images: images,
      profileImg: user.profileImg || '',
    });

    await newPost.save();
    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post', details: error.message });
  }
};

// Lấy tất cả bài viết
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('comments.author', 'username')  // Populate thông tin tác giả bình luận
      .populate('likes', 'username')           // Populate thông tin người dùng thích bài viết
      .populate('shares', 'username')
      .populate('profileImg', 'username');         // Populate thông tin người dùng chia sẻ bài viết
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

// Thêm bình luận vào bài viết
const addComment = async (req, res) => {
  const postId = req.params.postId;
  const { username, text } = req.body; // Chuyển từ 'author' sang 'username'

  try {
    // Kiểm tra bài viết có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Kiểm tra người dùng có tồn tại không dựa trên 'username'
    const user = await User.findOne({ username: username }); // Tìm người dùng bằng 'username'
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Tạo bình luận mới với profileImg từ User
    const comment = {
      author: user._id,  // Sử dụng _id của user để lưu vào bài viết
      username: user.username, // Lưu username để hiển thị
      text: text,
      profileImg: user.profileImg || '', // Lấy ảnh đại diện từ User
    };

    // Thêm bình luận vào bài viết
    post.comments.push(comment);

    // Lưu bài viết đã cập nhật
    await post.save();

    res.status(200).json({ message: 'Comment added successfully', post });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment', details: error.message });
  }
};

// Liking a post
const likePost = async (req, res) => {
  const postId = req.params.postId;
  const username = req.body.username;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Tìm người dùng bằng username
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Kiểm tra nếu người dùng đã thích bài viết
    if (post.likes.some(like => like.toString() === user._id.toString())) {
      return res.status(400).json({ error: 'Post already liked' });
    }

    // Thêm user vào danh sách likes
    post.likes.push(user._id);
    await post.save();

    const populatedPost = await Post.findById(postId).populate('likes', 'username profileImg');
    res.status(200).json({ message: 'Post liked', post: populatedPost });

  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post', details: error.message });
  }
};

// Controller function for unliking a post
const unlikePost = async (req, res) => {
  const postId = req.params.postId;
  const username = req.body.username;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Tìm người dùng bằng username
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Kiểm tra nếu người dùng chưa thích bài viết
    if (!post.likes.some(like => like.toString() === user._id.toString())) {
      return res.status(400).json({ error: 'Post not liked yet' });
    }

    // Loại bỏ user._id khỏi danh sách likes
    post.likes = post.likes.filter(like => like.toString() !== user._id.toString());
    await post.save();  // Lưu bài viết đã cập nhật

    const populatedPost = await Post.findById(postId).populate('likes', 'username profileImg');
    res.status(200).json({ message: 'Post unliked', post: populatedPost });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ error: 'Failed to unlike post', details: error.message });
  }
};

// Like bình luận
const likeComment = async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.body.userId; // Hoặc lấy từ token người dùng

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.likes.includes(userId)) {
      comment.likes.pull(userId);  // Hủy like nếu đã thích
    } else {
      comment.likes.push(userId);  // Thêm like nếu chưa thích
    }

    await post.save();
    res.status(200).json({ message: 'Comment like updated', post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to like comment', details: err.message });
  }
};

// Share bài viết
const sharePost = async (req, res) => {
  const postId = req.params.postId;
  const userId = req.body.userId; // Hoặc lấy từ token người dùng

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (!post.shares.includes(userId)) {
      post.shares.push(userId);
      await post.save();
    }

    res.status(200).json({ message: 'Post shared', post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to share post', details: err.message });
  }
};

const deletePost = async (req, res) => {
  const { postId } = req.params;
  const username = req.user.username; // Lấy username từ token đã xác thực

  try {
    // Kiểm tra bài viết có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Kiểm tra quyền:
    // Nếu không phải tác giả bài viết và không phải admin
    if ((post.username !== username) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to delete this post' });
    }

    // Xóa bài viết
    await Post.findByIdAndDelete(postId);

    // Trả về thông báo thành công
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ error: 'Failed to delete post', details: err.message });
  }
};

// Chỉnh sửa bài viết
const editPost = async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const username = req.user.username; // Lấy username từ token đã xác thực

  try {
    // Kiểm tra bài viết có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Kiểm tra quyền chỉnh sửa bài viết:
    // - Nếu không phải tác giả bài viết
    // - Và không phải admin
    if (post.username !== username && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to edit this post' });
    }

    // Lưu URL của ảnh mới (nếu có)
    const updatedImages = req.files && req.files.length > 0
      ? req.files.map((file) => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`)
      : post.images;

    // Cập nhật nội dung bài viết
    post.content = content || post.content;
    post.images = updatedImages;

    await post.save();

    // Trả về thông báo thành công
    res.status(200).json({ message: 'Post updated successfully', post });
  } catch (error) {
    console.error('Error editing post:', error);
    res.status(500).json({ error: 'Failed to edit post', details: error.message });
  }
};

const getPostById = async (req, res) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId).populate('likes', 'username'); // Populates the likes array with the username
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post', details: error.message });
  }
};
const deleteComment = async (req, res) => {
  const { commentId } = req.params;  // Lấy commentId từ params
  const username = req.user.username;  // Lấy username từ token đã xác thực

  try {
    // Tìm bình luận trong cơ sở dữ liệu
    const comment = await Post.aggregate([
      { $unwind: '$comments' },  // Giải nén mảng comments trong bài viết
      { $match: { 'comments._id': new mongoose.Types.ObjectId(commentId) } },  // Sử dụng `new` để khởi tạo ObjectId
      { $project: { postId: '$_id', comment: '$comments' } }  // Trả về postId và bình luận
    ]);
    

    if (comment.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const post = comment[0];  // Lấy bài viết và bình luận từ kết quả
    const commentToDelete = post.comment;

    // Kiểm tra quyền:
    // Nếu không phải tác giả bình luận và không phải admin
    if ((commentToDelete.username !== username) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to delete this comment' });
    }

    // Xóa bình luận
    const postUpdate = await Post.findByIdAndUpdate(
      post.postId, 
      { $pull: { comments: { _id: commentId } } },  // Xóa bình luận khỏi mảng comments
      { new: true }  // Trả về bài viết đã được cập nhật
    );

    res.status(200).json({ message: 'Comment deleted successfully', post: postUpdate });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment', details: err.message });
  }
};


const countPosts = async (req, res) => {
  try {
    // Đếm tổng số bài viết
    const totalPosts = await Post.countDocuments();

    // Trả về kết quả
    res.status(200).json({ 
      message: 'Total posts count retrieved successfully', 
      totalPosts 
    });
  } catch (error) {
    console.error('Error counting posts:', error);
    res.status(500).json({ 
      error: 'Failed to count posts', 
      details: error.message 
    });
  }
};
const getAllComments = async (req, res) => {
  try {
    // Fetch posts and populate the comments array
    const posts = await Post.find().populate({
      path: 'comments',
      populate: { path: 'author', select: 'username profileImg' }, // Populate the author of each comment
    });

    if (!posts || posts.length === 0) {
      return res.status(404).json({ error: 'No posts found' });
    }

    // Flatten the comments from all posts into a single array
    const allComments = posts.reduce((acc, post) => {
      return [...acc, ...post.comments];
    }, []);

    res.status(200).json({
      message: 'All comments retrieved successfully',
      comments: allComments,
    });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to retrieve comments', details: err.message });
  }
};

const countPostsByUsername = async (req, res) => {
  const { username } = req.params;

  try {
    // Find the user by username
    const user = await User.findOne({ username: username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Count posts by the user's ObjectId
    const totalPosts = await Post.countDocuments({ author: user._id });

    res.status(200).json({
      message: `Total posts count for username '${username}' retrieved successfully`,
      totalPostsByUser: totalPosts
    });
  } catch (error) {
    console.error('Error counting posts by username:', error);
    res.status(500).json({ error: 'Failed to count posts', details: error.message });
  }
};
const getPostsByUsername = async (req, res) => {
  const { username } = req.params; // Lấy username từ params

  try {
    // Tìm người dùng theo username
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Tìm các bài viết do người dùng này tạo
    const posts = await Post.find({ author: user._id })
      .populate('comments.author', 'username profileImg') // Populate thông tin tác giả bình luận
      .populate('likes', 'username profileImg')           // Populate thông tin người dùng thích bài viết
      .populate('shares', 'username profileImg');         // Populate thông tin người dùng chia sẻ bài viết

    // Nếu không có bài viết nào
    if (!posts || posts.length === 0) {
      return res.status(404).json({ error: 'No posts found for this user' });
    }

    res.status(200).json({
      message: `Posts retrieved successfully for username '${username}'`,
      posts: posts
    });
  } catch (error) {
    console.error('Error fetching posts by username:', error);
    res.status(500).json({
      error: 'Failed to fetch posts by username',
      details: error.message
    });
  }
};

module.exports = {
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
};
