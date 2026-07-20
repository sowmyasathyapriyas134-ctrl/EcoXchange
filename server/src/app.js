const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
let compression;
try {
  compression = require("compression");
} catch (_e) {
  compression = null;
}
const cors = require("cors");

const { healthRouter } = require("./routes/healthRoutes");
let docsRouter;
try {
  docsRouter = require("./routes/docsRoutes").docsRouter;
} catch (_e) {
  docsRouter = null;
}

const { authRouter } = require("./routes/authRoutes");
const { userRouter } = require("./routes/userRoutes");
const { adminRoutes } = require("./routes/adminRoutes");
const { supervisorRoutes } = require("./routes/supervisorRoutes");
const { pickupRouter: pickupRoutes } = require("./routes/pickupRoutes");
const { notificationRoutes } = require("./routes/notificationRoutes");
const { rewardRoutes } = require("./routes/rewardRoutes");
const { membershipRoutes } = require("./routes/membershipRoutes");
const { analyticsRoutes } = require("./routes/analyticsRoutes");
const { recycleRoutes } = require("./routes/recycleRoutes");
const { marketplaceRoutes } = require("./routes/marketplaceRoutes");
const { walletRouter } = require("./routes/walletRoutes");
const { wasteRouter } = require("./routes/wasteRoutes");
const { aiRouter } = require("./routes/aiRoutes");
const { scheduleRouter } = require("./routes/scheduleRoutes");
const { shipmentRoutes } = require("./routes/shipmentRoutes");
const { revenueRoutes } = require("./routes/revenueRoutes");
const { trialRouter } = require("./routes/trialRoutes");
const { cartRouter } = require("./routes/cartRoutes");
const { paymentRoutes } = require("./routes/paymentRoutes");
const { orderRoutes } = require("./routes/orderRoutes");
const { dashboardRoutes } = require("./routes/dashboardRoutes");
const { deliveryRouter } = require("./routes/deliveryRoutes");
const { errorMiddleware } = require("./middleware/errorMiddleware");
const { validateEnv } = require("./config/env");

validateEnv();

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.CLIENT_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ].filter(Boolean);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(mongoSanitize());
if (typeof compression === "function") {
  app.use(compression());
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
});

app.use(limiter);

// Specific security rate limiter for chatbot, checkout and shipment confirmations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { success: false, message: "Too many requests, please try again later." }
});

app.use("/api/ai/chat", strictLimiter);
app.use("/api/payments/create-order", strictLimiter);
app.use("/api/payments/verify", strictLimiter);
app.use("/api/shipments/:id/confirm-receipt", strictLimiter);

// Routes
app.use(healthRouter);

// Swagger docs
if (docsRouter) {
  app.use("/api/docs", docsRouter);
}


app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/pickups", pickupRoutes);
app.use("/api/supervisor", supervisorRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/membership", membershipRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/recycler", recycleRoutes);
app.use("/api/recycler/schedules", scheduleRouter);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/waste", wasteRouter);
app.use("/api/ai", aiRouter);
app.use("/api/trial", trialRouter);
app.use("/api/cart", cartRouter);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/delivery", deliveryRouter);
app.use("/api/admin", adminRoutes);

// 404 handler (keep before error middleware)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use(errorMiddleware);

module.exports = { app };

