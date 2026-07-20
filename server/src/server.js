const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");

const http = require("http");
const { app } = require("./app");
const { connectDB } = require("./config/db");

const DEFAULT_PORT = 5000;
const PORT = Number(process.env.PORT || DEFAULT_PORT);

const { initSocket } = require("./config/socket");

const startServer = async () => {
  await connectDB();
  if (mongoose.connection.readyState === 1) {
    console.log("✅ MongoDB Connected Successfully");
  } else {
    console.log("❌ MongoDB Disconnected");
  }

  const server = http.createServer(app);
  const io = initSocket(server);

  // Export io for other modules if needed
  app.set("io", io);

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.warn(
        `Port ${PORT} is already in use. Trying ${DEFAULT_PORT + 1}...`,
      );
      server.listen(DEFAULT_PORT + 1, () => {
        console.log(`Server running on http://localhost:${DEFAULT_PORT + 1}`);
      });
    } else {
      console.error("Server startup error:", error);
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
