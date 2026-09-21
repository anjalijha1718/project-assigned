const express = require('express');
const Inquiry = require('../models/Inquiry');
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

module.exports = router;
