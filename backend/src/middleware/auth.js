const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const tokenFromCookie = req.cookies?.authToken;

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : tokenFromCookie;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token missing.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'silent-house-local-secret');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  next();
};

module.exports = { protect, adminOnly };
