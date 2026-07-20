/**
 * Validates required environment variables at startup.
 * Fails fast in production; warns in development for optional keys.
 */

const REQUIRED_ALWAYS = ["MONGODB_URI", "JWT_SECRET"];

const REQUIRED_PRODUCTION = [
  "CLIENT_URL",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];

const FIREBASE_KEYS = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const CLOUDINARY_KEYS = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

function validateEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const missing = [];

  for (const key of REQUIRED_ALWAYS) {
    if (!process.env[key]) missing.push(key);
  }

  if (isProd) {
    for (const key of REQUIRED_PRODUCTION) {
      if (!process.env[key]) missing.push(key);
    }
    const hasFirebase = FIREBASE_KEYS.every((k) => Boolean(process.env[k]));
    if (!hasFirebase) {
      missing.push("FIREBASE_* (project, client email, private key)");
    }
    const hasCloudinary = CLOUDINARY_KEYS.every((k) => Boolean(process.env[k]));
    if (!hasCloudinary) {
      missing.push("CLOUDINARY_* (cloud name, api key, secret)");
    }
  } else {
    const optional = [];
    if (!FIREBASE_KEYS.every((k) => process.env[k])) {
      optional.push("Firebase Admin (OTP verify disabled without it)");
    }
    if (!CLOUDINARY_KEYS.every((k) => process.env[k])) {
      optional.push("Cloudinary (uploads may fail)");
    }
    if (!process.env.RAZORPAY_KEY_ID) {
      optional.push("RAZORPAY_KEY_ID");
    }
    if (optional.length) {
      console.warn("[env] Optional keys missing:", optional.join("; "));
    }
  }

  if (missing.length) {
    throw new Error(
      `Missing required environment variables:\n  - ${missing.join("\n  - ")}`,
    );
  }

  console.log("[env] Environment validation passed");
}

module.exports = { validateEnv };
