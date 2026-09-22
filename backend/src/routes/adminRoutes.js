const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Inquiry = require('../models/Inquiry');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/inquiries', async (req, res, next) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json({ success: true, inquiries });
  } catch (error) {
    next(error);
  }
});

router.patch('/inquiries/:id', async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'contacted', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'A valid inquiry status is required.' });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }

    res.json({ success: true, message: 'Inquiry updated successfully.', inquiry });
  } catch (error) {
    next(error);
  }
});

router.delete('/inquiries/:id', async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }

    res.json({ success: true, message: 'Inquiry deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// Admin User Management Endpoints

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const assignedRole = role === 'admin' ? 'admin' : 'user';
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    if (req.user._id.toString() === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (userToDelete.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only remaining administrator account.',
        });
      }
    }

    await User.findByIdAndDelete(id);

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

