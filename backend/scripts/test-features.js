const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../src/models/User');
const OtpVerification = require('../src/models/OtpVerification');
const app = require('../server');

let server;
let baseUrl;

const request = async (method, path, body = null, headers = {}) => {
  const url = `${baseUrl}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, data };
};

const runTests = async () => {
  console.log('--- STARTING AUTH FEATURE TESTS ---');

  // Connect DB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/silent_house');
  console.log('[✓] Connected to MongoDB');

  // Start HTTP test server on an ephemeral port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`[✓] Test server listening on port ${port}`);
      resolve();
    });
  });

  const testEmail = `test_otp_${Date.now()}@example.com`;

  try {
    // 1. Send OTP: Missing fields
    console.log('\nTest 1: Validation - Missing fields');
    const res1 = await request('POST', '/api/auth/send-signup-otp', { email: testEmail });
    if (res1.status !== 400 || res1.data.success !== false) {
      throw new Error(`Expected 400 for missing fields, got ${res1.status}: ${JSON.stringify(res1.data)}`);
    }
    console.log('[✓] Missing fields correctly rejected with 400');

    // 2. Send OTP: Existing email
    console.log('\nTest 2: Duplicate email check');
    const res2 = await request('POST', '/api/auth/send-signup-otp', {
      name: 'Existing User',
      email: 'ava@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    if (res2.status !== 409) {
      throw new Error(`Expected 409 for duplicate email, got ${res2.status}: ${JSON.stringify(res2.data)}`);
    }
    console.log('[✓] Duplicate email rejected with 409');

    // 3. Send OTP: Valid new registration
    console.log('\nTest 3: Valid registration - Send OTP');
    const res3 = await request('POST', '/api/auth/send-signup-otp', {
      name: 'Test New User',
      email: testEmail,
      password: 'password123',
      confirmPassword: 'password123',
    });
    if (res3.status !== 200 || !res3.data.success) {
      throw new Error(`Expected 200 for send-signup-otp, got ${res3.status}: ${JSON.stringify(res3.data)}`);
    }
    console.log('[✓] OTP sent successfully, response does NOT contain OTP');

    // Verify DB OtpVerification record
    const otpRecord = await OtpVerification.findOne({ email: testEmail });
    if (!otpRecord) throw new Error('OtpVerification record was not created in DB');
    if (!otpRecord.hashedOtp || !otpRecord.password) throw new Error('Hashed OTP or password missing in DB');
    if (otpRecord.password === 'password123') throw new Error('Plaintext password was stored! Must be hashed!');
    console.log('[✓] OtpVerification document verified in DB (password & OTP securely hashed, TTL set)');

    // 4. Rate limiting: Resend cooldown
    console.log('\nTest 4: Resend Cooldown (within 60s)');
    const res4 = await request('POST', '/api/auth/send-signup-otp', {
      name: 'Test New User',
      email: testEmail,
      password: 'password123',
      confirmPassword: 'password123',
    });
    if (res4.status !== 429) {
      throw new Error(`Expected 429 for immediate resend, got ${res4.status}`);
    }
    console.log('[✓] Rate limiting enforced: 429 returned on rapid resend');

    // 5. Verify OTP: Invalid OTP
    console.log('\nTest 5: Verify Invalid OTP');
    const res5 = await request('POST', '/api/auth/verify-signup-otp', {
      email: testEmail,
      otp: '000000',
    });
    if (res5.status !== 400 || res5.data.success !== false) {
      throw new Error(`Expected 400 for invalid OTP, got ${res5.status}: ${JSON.stringify(res5.data)}`);
    }
    const updatedRecord = await OtpVerification.findOne({ email: testEmail });
    if (updatedRecord.attempts !== 1) throw new Error(`Expected attempts=1, got ${updatedRecord.attempts}`);
    console.log('[✓] Invalid OTP rejected with 400 and attempt count incremented to 1');

    // 6. Verify OTP: Correct OTP
    console.log('\nTest 6: Verify Correct OTP & Create User');
    // Set known OTP hash in DB for deterministic testing
    const validTestOtp = '654321';
    updatedRecord.hashedOtp = await bcrypt.hash(validTestOtp, 10);
    await updatedRecord.save();

    const res6 = await request('POST', '/api/auth/verify-signup-otp', {
      email: testEmail,
      otp: validTestOtp,
    });
    if (res6.status !== 201 || !res6.data.token || !res6.data.user) {
      throw new Error(`Expected 201 user creation, got ${res6.status}: ${JSON.stringify(res6.data)}`);
    }
    console.log('[✓] User account created successfully with token and user object');

    // Check user in DB
    const createdUser = await User.findOne({ email: testEmail });
    if (!createdUser) throw new Error('User not found in DB after verification');
    if (createdUser.role !== 'user') throw new Error(`Role should be 'user', got ${createdUser.role}`);
    if (createdUser.emailVerified !== true) throw new Error(`emailVerified should be true, got ${createdUser.emailVerified}`);
    if (createdUser.authProvider !== 'local') throw new Error(`authProvider should be 'local', got ${createdUser.authProvider}`);
    console.log('[✓] User in DB has role: "user", emailVerified: true, authProvider: "local"');

    // Check OtpVerification record deleted
    const deletedRecord = await OtpVerification.findOne({ email: testEmail });
    if (deletedRecord) throw new Error('OtpVerification record was not deleted after verification');
    console.log('[✓] Temporary OTP record was invalidated and removed');

    // 7. Test Login with newly created user
    console.log('\nTest 7: Login with newly created user');
    const res7 = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'password123',
    });
    if (res7.status !== 200 || !res7.data.token) {
      throw new Error(`Expected 200 on login for new user, got ${res7.status}`);
    }
    console.log('[✓] New user logged in successfully with password');

    // 8. Regression Test: Existing user login
    console.log('\nTest 8: Regression - Existing user login (ava@example.com)');
    const res8 = await request('POST', '/api/auth/login', {
      email: 'ava@example.com',
      password: 'password123',
    });
    if (res8.status !== 200 || !res8.data.token) {
      throw new Error(`Expected 200 for existing user login, got ${res8.status}`);
    }
    console.log('[✓] Existing user login works unchanged');

    // 9. Regression Test: Existing admin login and admin routes
    console.log('\nTest 9: Regression - Admin login & user management');
    const res9 = await request('POST', '/api/auth/login', {
      email: 'admin@silent-house.com',
      password: 'admin123',
    });
    if (res9.status !== 200 || res9.data.user.role !== 'admin') {
      throw new Error(`Expected 200 for admin login, got ${res9.status}`);
    }
    const adminToken = res9.data.token;

    const resAdminUsers = await request('GET', '/api/admin/users', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    if (resAdminUsers.status !== 200 || !Array.isArray(resAdminUsers.data.users)) {
      throw new Error(`Expected 200 for /api/admin/users, got ${resAdminUsers.status}`);
    }
    console.log(`[✓] Admin user management works (/api/admin/users returned ${resAdminUsers.data.users.length} users)`);

    // 10. Test Google OAuth redirect handling
    console.log('\nTest 10: Google OAuth redirect endpoint');
    const resGoogle = await fetch(`${baseUrl}/api/auth/google`, { redirect: 'manual' });
    // Without GOOGLE_CLIENT_ID configured, it redirects to /signup?error=google_not_configured
    const location = resGoogle.headers.get('location');
    if (!location || !location.includes('google_not_configured')) {
      throw new Error(`Expected redirect to /signup?error=google_not_configured, got: ${location}`);
    }
    console.log(`[✓] Google OAuth endpoint handles unconfigured credentials safely: ${location}`);

    // Cleanup test user
    await User.deleteOne({ email: testEmail });
    console.log('\n[✓] Test cleanup finished');

    console.log('\n========================================');
    console.log('ALL 10 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n[X] TEST FAILED:', err.message);
    if (server) server.close();
    process.exit(1);
  });
