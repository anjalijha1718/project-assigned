const path = require('path');
const dotenv = require('dotenv');
const { Resend } = require('resend');

/**
 * Send 6-digit OTP verification email using Resend
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit numeric OTP string
 * @returns {Promise<{ success: boolean, id?: string, simulated?: boolean }>}
 */
const sendOtpEmail = async (toEmail, otp) => {
  // Always refresh environment variables from backend/.env so runtime edits take effect immediately
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const fromAddress = (process.env.EMAIL_FROM || 'Silent House <onboarding@resend.dev>').trim();

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n========================================`);
      console.log(`[EMAIL SERVICE DEV SIMULATION]`);
      console.log(`RESEND_API_KEY is not configured in backend/.env`);
      console.log(`To: ${toEmail}`);
      console.log(`Verification Code (OTP): ${otp}`);
      console.log(`Expires in: 10 minutes`);
      console.log(`========================================\n`);
      return { success: true, simulated: true };
    }
    throw new Error('Email service is not configured. Please set RESEND_API_KEY in backend/.env.');
  }

  try {
    const resend = new Resend(apiKey);
    console.log(`[Email Service] Sending OTP email to ${toEmail} via Resend...`);

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: 'Your Silent House Verification Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #ffffff; color: #111111; border: 1px solid #eaeaea; border-radius: 12px;">
          <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; letter-spacing: -0.02em;">Verify your email</h2>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: #555555;">
            Thank you for starting your registration with Silent House. Use the 6-digit code below to verify your email and activate your account:
          </p>
          <div style="background-color: #f7f7f7; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #000000; font-family: monospace;">${otp}</span>
          </div>
          <p style="margin: 0 0 12px; font-size: 13px; line-height: 1.5; color: #777777;">
            This verification code is valid for <strong>10 minutes</strong>. If you did not make this request, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0 16px;" />
          <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
            &copy; Silent House. All rights reserved.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[Resend Email Error]:', error.message || error);

      // Handle Resend's free-tier recipient limitation
      const isRestrictedRecipient = error.statusCode === 403 && error.message?.includes('only send testing emails to your own email address');
      const isPlaceholderDomain = error.statusCode === 422 && error.message?.includes('Invalid `to` field');

      if (isRestrictedRecipient || isPlaceholderDomain) {
        const allowedEmailMatch = error.message.match(/\(([^)]+)\)/);
        const allowedEmail = allowedEmailMatch ? allowedEmailMatch[1] : 'your registered Resend account email';

        console.warn(`\n[Resend Free-Tier Note]:`);
        console.warn(`On Resend's free tier without a custom domain, emails are delivered directly to: ${allowedEmail}`);
        console.warn(`To deliver to any email address, verify a domain at resend.com/domains.`);

        if (process.env.NODE_ENV !== 'production') {
          console.log(`[DEV OTP NOTIFICATION for ${toEmail}]: ${otp}\n`);
          return { success: true, simulated: true };
        }

        throw new Error(`On Resend's free tier, emails can only be sent to your registered account (${allowedEmail}). Please sign up with ${allowedEmail} or verify a custom domain at resend.com.`);
      }

      throw new Error(error.message || 'Failed to send verification email via provider.');
    }

    console.log(`[Email Service] OTP successfully sent via Resend! Message ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('[Email Service Exception]:', error.message);
    throw error;
  }
};

module.exports = { sendOtpEmail };
