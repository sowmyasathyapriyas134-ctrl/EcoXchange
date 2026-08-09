const nodemailer = require("nodemailer");

/**
 * Creates and returns a Nodemailer transporter.
 * Uses SMTP_* environment variables.
 * Falls back to console-only logging in development if SMTP is not configured.
 */
function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null; // No transporter — will log to console instead
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * Sends a password reset email.
 * If SMTP is not configured, logs the link to console (dev fallback).
 *
 * @param {string} email - Recipient email
 * @param {string} rawToken - The unhashed reset token
 * @param {string} resetUrl - Full reset URL (includes token + email params)
 */
async function sendPasswordResetEmail(email, rawToken, resetUrl) {
  const transporter = createTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">EcoXchange – Password Reset</h2>
      <p>You requested a password reset for your EcoXchange account.</p>
      <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}"
           style="background-color: #16a34a; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; font-weight: bold;">
          Reset My Password
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        If you did not request this, you can safely ignore this email.
        Your password will not change.
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        If the button doesn't work, copy and paste this URL:<br/>
        <a href="${resetUrl}">${resetUrl}</a>
      </p>
    </div>
  `;

  if (!transporter) {
    // Dev fallback: log to console
    console.log("\n=== PASSWORD RESET EMAIL (SMTP not configured) ===");
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Raw Token: ${rawToken}`);
    console.log("==================================================\n");
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `EcoXchange <${process.env.SMTP_USER}>`,
    to: email,
    subject: "EcoXchange – Password Reset Request",
    html,
  });
}

module.exports = { sendPasswordResetEmail };
