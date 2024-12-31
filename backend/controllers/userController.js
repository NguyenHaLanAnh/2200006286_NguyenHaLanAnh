const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const upload = require('../middleware/upload');

// Secret key cho JWT
const JWT_SECRET = 'LA123';

// Đăng ký người dùng
const registerUser = async (req, res) => {
  const { email, name, username, password, role, bio, profileImg } = req.body;

  // Kiểm tra nếu email hoặc username đã tồn tại
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return res.status(400).json({ error: 'Email or Username already exists' });
  }

  // Mã hóa mật khẩu trước khi lưu
  const hashedPassword = await bcrypt.hash(password, 10);

  // Tạo và lưu người dùng mới
  const newUser = new User({
    email,
    name,
    username,
    password: hashedPassword,
    role: role || 'user', // Mặc định role là 'user' nếu không cung cấp
    bio: bio || undefined, // Lấy từ yêu cầu hoặc giá trị mặc định trong schema
    profileImg: profileImg || undefined, // Lấy từ yêu cầu hoặc giá trị mặc định trong schema
  });

  try {
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error while registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};


// Đăng nhập người dùng
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  // Tìm người dùng theo username
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  // Kiểm tra mật khẩu
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  // Tạo JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  

  res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,  // Trả về email
      bio: user.bio,      // Trả về bio
      profileImg: user.profileImg, // Trả về hình ảnh hồ sơ
      role: user.role,
    },
  });
};


const updateUserProfile = async (req, res) => {
  const { username } = req.params;
  const { bio } = req.body;

  // Lấy URL của file tải lên (nếu có)
  const imageUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cập nhật thông tin người dùng
    user.bio = bio || user.bio;
    user.name = req.body.name || user.name;
    if (imageUrl) {
      user.profileImg = imageUrl; // Cập nhật ảnh nếu có
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        name: user.name,
        username: user.username,
        bio: user.bio,
        profileImg: user.profileImg,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};


const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    // Nếu ở đây có middleware khác hoặc xử lý token, xóa nó đi
    const user = await User.findOne({ username }).select('-password'); // Loại trừ mật khẩu
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Trả về thông tin profile và các thống kê
    res.status(200).json({
      name: user.name,
      username: user.username,
      bio: user.bio,
      profileImg: user.profileImg,
      followers: user.followers || 0, // Mặc định là 0 nếu không có dữ liệu
      following: user.following || 0, // Mặc định là 0 nếu không có dữ liệu
      posts: user.posts || [], // Mặc định là mảng rỗng nếu không có bài viết
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

const checkAdmin = async (req, res) => {
  try {
    const user = req.user;  // The user should be attached after isAuthenticated middleware
    console.log("Authenticated User: ", user);  // Log to verify the user

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    res.status(200).json({ message: 'User is admin' });
  } catch (error) {
    console.error("Error in checkAdmin:", error);  // Log the error to find the root cause
    res.status(500).json({ error: 'Server error' });
  }
};
const countUsers = async (req, res) => {
  try {
    const users = await User.find();  // Fetch all users from the collection
    console.log('Fetched users:', users);  // Log the result to see if any users are returned
    const totalUsers = users.length;

    res.status(200).json({
      message: 'Total users count retrieved successfully',
      totalUsers,
      users,
    });
  } catch (error) {
    console.error('Error counting users:', error);
    res.status(500).json({
      error: 'Failed to count users',
      details: error.message,
    });
  }
};
const searchUsers = async (req, res) => {
  const { query } = req.query;
  console.log('Received query:', query);  // Xem giá trị query nhận được

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const regexQuery = query.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, "\\$&");  // Escape ký tự đặc biệt
    console.log('Using regex query:', regexQuery);  // Xem regex query sử dụng

    const users = await User.find({
      username: { $regex: regexQuery, $options: 'i' }  // Chỉ tìm kiếm theo username
    }).limit(100);

    console.log('Found users:', users);  // Kiểm tra kết quả trả về

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};





module.exports = {
  countUsers,
  registerUser,
  checkAdmin,
  loginUser,
  updateUserProfile,
  getUserProfile,
  searchUsers,
};

