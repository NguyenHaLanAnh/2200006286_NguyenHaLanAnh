const express = require('express');
const connectDB = require('./db');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const path = require('path'); // Import path module

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/users', userRoutes); // Sử dụng router cho user
app.use('/posts', postRoutes); // Sử dụng router cho post
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Cấu hình phục vụ tệp tĩnh từ thư mục uploads

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
