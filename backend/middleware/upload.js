const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ tệp
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads'); // Chỉ định đường dẫn thư mục uploads
    cb(null, uploadPath);  // Lưu trữ vào thư mục uploads
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Đặt tên tệp theo timestamp
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn kích thước tệp tối đa (5MB)
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận ảnh định dạng .jpg, .jpeg, .png!'), false);
    }
  }
});

module.exports = upload;
