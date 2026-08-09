/**
 * otpService.js — OTP Provider Abstraction
 *
 * Strategy pattern: selects provider based on OTP_PROVIDER env var.
 *
 * Providers:
 *   "console"  (default / dev) — logs OTP to server console, returns it in response
 *   "twilio"   — sends via Twilio SMS (requires TWILIO_* env vars)
 *   "fast2sms" — sends via Fast2SMS (requires FAST2SMS_API_KEY env var)
 *   "bypass"   — always uses DEMO_OTP value (useful for automated testing)
 *
 * Usage:
 *   const { otpService } = require("../services/otpService");
 *   const { otp, delivered, devOtp } = await otpService.send(phoneNumber);
 *     - delivered: true when SMS was sent via a real provider
 *     - devOtp:    otp string returned ONLY when NOT in production (for client display)
 */

const crypto = require("crypto");

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateCode() {
  if (process.env.OTP_BYPASS === "true") {
    return process.env.DEMO_OTP || "123456";
  }
  return crypto.randomInt(100000, 999999).toString();
}

// ─── Providers ───────────────────────────────────────────────────────────────

async function sendViaConsole(phone, otp) {
  console.log(`[OTP-CONSOLE] Phone: ${phone}  OTP: ${otp}`);
  return { delivered: false };
}

async function sendViaTwilio(phone, otp) {
  try {
    const client = require("twilio")(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    await client.messages.create({
      body: `Your EcoXchange verification code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return { delivered: true };
  } catch (err) {
    console.error("[OTP-TWILIO] Failed to send OTP:", err.message);
    // Fall back to console so auth flow is never fully broken
    return sendViaConsole(phone, otp);
  }
}

async function sendViaFast2SMS(phone, otp) {
  try {
    const axios = require("axios");
    const localPhone = phone.replace(/^\+91/, "");
    await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "otp",
        variables_values: otp,
        numbers: localPhone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    return { delivered: true };
  } catch (err) {
    console.error("[OTP-FAST2SMS] Failed to send OTP:", err.message);
    return sendViaConsole(phone, otp);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

const otpService = {
  /**
   * Send an OTP to the given phone number.
   * @param {string} phone - E.164 formatted phone number (+91XXXXXXXXXX)
   * @returns {{ otp: string, delivered: boolean, devOtp?: string }}
   */
  async send(phone) {
    const otp = generateCode();
    const provider = process.env.OTP_PROVIDER || "console";

    let result;
    switch (provider) {
      case "twilio":
        result = await sendViaTwilio(phone, otp);
        break;
      case "fast2sms":
        result = await sendViaFast2SMS(phone, otp);
        break;
      case "bypass":
        result = { delivered: false };
        break;
      default:
        result = await sendViaConsole(phone, otp);
    }

    const isProduction = process.env.NODE_ENV === "production";

    return {
      otp,
      delivered: result.delivered,
      // Only expose raw OTP in non-production environments (dev/staging/demo)
      devOtp: !isProduction ? otp : undefined,
    };
  },
};

module.exports = { otpService };
