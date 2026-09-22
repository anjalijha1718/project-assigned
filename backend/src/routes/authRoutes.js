const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const { sendOtpEmail } = require('../services/emailService');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'silent-house-local-secret', {
    expiresIn: '7d',
  });
};

const setAuthCookie = (res, token) => {
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// ==========================================
// FEATURE 1: EMAIL OTP SIGNUP FLOW
// ==========================================

/**
 * Step 1: Validate signup details and send OTP email
 */
router.post('/send-signup-otp', async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

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

    // Check if account already exists in MongoDB
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Rate limiting: 60s resend cooldown check
    const existingOtpRecord = await OtpVerification.findOne({ email: normalizedEmail });
    if (existingOtpRecord && existingOtpRecord.lastResendAt) {
      const elapsed = Date.now() - new Date(existingOtpRecord.lastResendAt).getTime();
      const cooldownMs = 60 * 1000;
      if (elapsed < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSec} seconds before requesting a new code.`,
          retryAfter: remainingSec,
        });
      }
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Securely hash OTP and user password with bcrypt
    const hashedOtp = await bcrypt.hash(otp, 10);
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Send email using free-tier email service (Resend)
    await sendOtpEmail(normalizedEmail, otp);

    // Save temporary OTP verification record with TTL expiry
    await OtpVerification.findOneAndUpdate(
      { email: normalizedEmail },
      {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        hashedOtp,
        attempts: 0,
        lastResendAt: new Date(),
        expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email.',
      email: normalizedEmail,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Step 2: Verify OTP and create user account
 */
router.post('/verify-signup-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedOtp = otp.toString().trim();

    // Find pending verification record
    const record = await OtpVerification.findOne({ email: normalizedEmail });
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Verification code not found or expired. Please request a new code.',
      });
    }

    // Check expiration
    if (new Date() > new Date(record.expiresAt)) {
      await OtpVerification.deleteOne({ _id: record._id });
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    // Check attempt limit
    if (record.attempts >= 5) {
      await OtpVerification.deleteOne({ _id: record._id });
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new verification code.',
      });
    }

    // Verify OTP securely using bcrypt comparison
    const isMatch = await bcrypt.compare(trimmedOtp, record.hashedOtp);
    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      const remainingAttempts = Math.max(0, 5 - record.attempts);
      return res.status(400).json({
        success: false,
        message: remainingAttempts > 0
          ? `Invalid verification code. ${remainingAttempts} attempts remaining.`
          : 'Invalid verification code. Attempt limit exceeded.',
      });
    }

    // Check if user account was created in the meantime
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      await OtpVerification.deleteOne({ _id: record._id });
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Create user in MongoDB with emailVerified = true
    const newUser = await User.create({
      name: record.name,
      email: normalizedEmail,
      password: record.password, // Already securely hashed
      role: 'user',
      emailVerified: true,
      authProvider: 'local',
    });

    // Invalidate and delete the temporary OTP record
    await OtpVerification.deleteOne({ _id: record._id });

    // Issue session token and cookie
    const token = signToken(newUser);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created and email verified successfully.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Resend OTP with 60-second cooldown enforcement
 */
router.post('/resend-signup-otp', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const record = await OtpVerification.findOne({ email: normalizedEmail });
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No pending registration found for this email. Please fill in the signup form.',
      });
    }

    // Cooldown check (60 seconds)
    const elapsed = Date.now() - new Date(record.lastResendAt).getTime();
    const cooldownMs = 60 * 1000;
    if (elapsed < cooldownMs) {
      const remainingSec = Math.ceil((cooldownMs - elapsed) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSec} seconds before requesting a new code.`,
        retryAfter: remainingSec,
      });
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Send email
    await sendOtpEmail(normalizedEmail, otp);

    record.hashedOtp = hashedOtp;
    record.attempts = 0;
    record.lastResendAt = new Date();
    record.expiresAt = expiresAt;
    await record.save();

    res.json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// FEATURE 2: GOOGLE OAUTH FLOW
// ==========================================

/**
 * Redirects user to Google OAuth 2.0 authorization page
 */
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${clientUrl}/signup?error=google_not_configured`);
  }

  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  res.redirect(`${rootUrl}?${params.toString()}`);
});

/**
 * Google OAuth 2.0 callback endpoint
 */
router.get('/google/callback', async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
  const { code, error: googleError } = req.query;

  if (googleError || !code) {
    const errorMsg = encodeURIComponent(googleError || 'Google authentication was cancelled.');
    return res.redirect(`${clientUrl}/signup?error=${errorMsg}`);
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[Google Token Exchange Error]:', tokenData);
      return res.redirect(`${clientUrl}/signup?error=google_token_exchange_failed`);
    }

    // Fetch user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.email) {
      console.error('[Google Profile Error]:', profile);
      return res.redirect(`${clientUrl}/signup?error=google_profile_failed`);
    }

    const normalizedEmail = profile.email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Create new user: STRICTLY 'user' role, verified email, Google provider
      user = await User.create({
        name: profile.name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: 'user', // NEVER admin
        emailVerified: true,
        authProvider: 'google',
        googleId: profile.sub,
      });
    } else {
      // Existing user: preserve existing role, link googleId and emailVerified
      let updated = false;
      if (!user.googleId) {
        user.googleId = profile.sub;
        updated = true;
      }
      if (!user.emailVerified) {
        user.emailVerified = true;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    // Issue JWT token and auth cookie
    const token = signToken(user);
    setAuthCookie(res, token);

    const userPayload = encodeURIComponent(
      JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
    );

    return res.redirect(`${clientUrl}/auth/callback?token=${token}&user=${userPayload}`);
  } catch (error) {
    console.error('[Google Callback Exception]:', error.message);
    return res.redirect(`${clientUrl}/signup?error=internal_auth_error`);
  }
});

// ==========================================
// EXISTING AUTH ENDPOINTS (PRESERVED)
// ==========================================

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

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

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
      emailVerified: true,
      authProvider: 'local',
    });

    const token = signToken(newUser);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account was registered with Google. Please click "Continue with Google" to log in.',
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('authToken', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
  });

  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
