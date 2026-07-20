const { Server } = require("socket.io");

const jwt = require("jsonwebtoken");

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(); // allow unauthenticated connection for public areas

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.user) {
      socket.join(String(socket.user.id));
      socket.join(`role:${socket.user.role}`);
    }

    socket.on("join", (userId) => {
      if (!userId) return;
      socket.join(String(userId));
    });
  });

  return io;
};

module.exports = { initSocket };
