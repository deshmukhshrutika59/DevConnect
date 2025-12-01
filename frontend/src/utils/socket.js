// frontend/src/utils/socket.js
import { io } from "socket.io-client";

let socket = null;

export const initSocket = (token) => {
  if (socket) return socket;
  const BACKEND = import.meta.env.VITE_BACKEND_URL;
  socket = io(BACKEND, {
    auth: { token: `Bearer ${token}` },
    transports: ["websocket", "polling"],
  });
  socket.on("connect", () => console.log("socket connected", socket.id));
  socket.on("connect_error", (err) => console.error("socket connect_error", err.message));
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
