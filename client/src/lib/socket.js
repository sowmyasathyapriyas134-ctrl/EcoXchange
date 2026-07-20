import { io } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

let socket = null;
let status = "disconnected";
const statusListeners = new Set();

function setStatus(next) {
  status = next;
  statusListeners.forEach((fn) => fn(next));
}

export function subscribeSocketStatus(listener) {
  statusListeners.add(listener);
  listener(status);
  return () => statusListeners.delete(listener);
}

export function getSocketStatus() {
  return status;
}

export function connectSocket() {
  const token = useAuthStore.getState().token;
  if (!token) return null;
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
  });

  socket.on("connect", () => {
    setStatus("connected");
    const userId = useAuthStore.getState().user?.id;
    if (userId) socket?.emit("join", userId);
  });

  socket.on("disconnect", () => setStatus("disconnected"));
  socket.io.on("reconnect", () => setStatus("connected"));

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    setStatus("disconnected");
  }
}

export function getSocket() {
  return socket;
}
