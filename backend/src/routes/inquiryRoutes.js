const express = require('express');
const Inquiry = require('../models/Inquiry');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, email, inquiryType, message } = req.body;

    if (!name || !email || !inquiryType || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, inquiry type, and message are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const inquiry = await Inquiry.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      inquiryType,
      message: message.trim(),
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully.',
      inquiry,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
