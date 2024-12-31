const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'LA123';

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from "Bearer <token>"
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }

    try {
      // Fetch the user from the decoded token (ensure that the user exists in the DB)
      const user = await User.findById(decoded.id); // Ensure 'decoded.id' matches your model
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      req.user = user;  // Attach the user to the request object
      next();  // Proceed to the next handler
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
};


// Middleware to check if the user has admin privileges
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
};
