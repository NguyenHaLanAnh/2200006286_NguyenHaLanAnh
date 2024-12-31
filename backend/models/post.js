const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true }, // Thêm username của người bình luận
  text: { type: String, required: true },
  profileImg: { type: String, default: '' }, // URL ảnh đại diện (nếu cần)
  likes: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const PostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true }, // Thêm trường username vào schema
    profileImg: { type: String, default: '' },
    content: { type: String, default: '' },
    images: { type: [String], default: [] }, // Lưu URL các hình ảnh đính kèm
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Danh sách user thích bài viết
    comments: { type: [CommentSchema], default: [] }, // Thêm các bình luận liên quan
    shares: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] }, // Người chia sẻ
    tags: { type: [String], default: [] }, // Gắn thẻ nội dung bài viết
    status: { type: String, enum: ['public', 'private', 'draft'], default: 'public' }, // Trạng thái bài viết
  },
  { timestamps: true } // Thêm `createdAt` và `updatedAt` tự động
);

// Đảm bảo mô hình có thể được xuất ra
module.exports = mongoose.model('Post', PostSchema);
