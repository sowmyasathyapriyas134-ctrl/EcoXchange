// src/config/cloudinary.js

const cloudinary = require("cloudinary").v2;

// Validate required environment variables
const requiredEnvVars = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missing.length > 0) {
  // Allow server to boot in development/CI; uploads will fail if used.
  // eslint-disable-next-line no-console
  console.warn(
    `Cloudinary not fully configured. Missing env vars: ${missing.join(", ")}.",
    `,
  );
}

// Configure Cloudinary (even with partial/missing envs, so require() doesn't fail)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

// Helper function to upload a file buffer to Cloudinary (with Data URI dev fallback)
const uploadToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    // If Cloudinary environment variables are missing, fallback to Data URI
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      const mime = options.mimetype || "image/jpeg";
      const base64 = buffer ? buffer.toString("base64") : "";
      const dataUri = `data:${mime};base64,${base64}`;
      return resolve({
        secure_url: dataUri,
        url: dataUri,
        public_id: `dev_proof_${Date.now()}`,
      });
    }

    const uploadOptions = {
      folder: "ecoxchange",
      resource_type: "image",
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          // Fallback to Data URI if Cloudinary fails (e.g. invalid credentials)
          const mime = options.mimetype || "image/jpeg";
          const base64 = buffer ? buffer.toString("base64") : "";
          const dataUri = `data:${mime};base64,${base64}`;
          return resolve({
            secure_url: dataUri,
            url: dataUri,
            public_id: `dev_proof_${Date.now()}`,
          });
        }
        resolve(result);
      },
    );

    stream.end(buffer);
  });

// Helper function to delete an uploaded asset
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;

  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};
