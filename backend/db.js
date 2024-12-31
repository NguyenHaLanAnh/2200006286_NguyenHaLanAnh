// db.js
const mongoose = require('mongoose');
require('dotenv').config();  // Đọc các biến môi trường từ file .env

const mongoURI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Kết nối thành công MongoDB');
  } catch (err) {
    console.error('MongoDB kết nối thất bại:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
