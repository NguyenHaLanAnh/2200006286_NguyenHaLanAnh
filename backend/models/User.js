const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'admin'], // Ensure role is either 'user' or 'admin'
    default: 'user',
  },
  bio: { type: String, default: 'This is my bio' }, // Tiểu sử mặc định
  profileImg: { type: String, default: 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png' }, // Ảnh đại diện mặc định
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
