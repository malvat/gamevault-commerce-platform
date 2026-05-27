import { io } from "socket.io-client";
import { SOCKET_URL } from "./api.js";

let socket;

export const getSocket = (token) => {
  if (!token) {
    return null;
  }

  if (!socket || socket.auth?.token !== token) {
    socket?.disconnect();
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
