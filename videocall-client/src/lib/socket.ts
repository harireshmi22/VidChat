import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket(userId?: string): Socket {
  if (typeof window === "undefined") {
    // Server-side: return a mock socket or noop socket
    return {} as Socket;
  }

  const activeUserId = userId || localStorage.getItem("auracall_userId");

  if (socket) {
    // If user changed, reconnect with new userId
    if (activeUserId && socket.auth && (socket.auth as any).userId !== activeUserId) {
      socket.disconnect();
      socket = null;
    } else {
      // Ensure we are connected
      if (!socket.connected) {
        socket.connect();
      }
      return socket;
    }
  }

  if (!activeUserId) {
    // If no user is logged in, create a socket that won't connect automatically
    socket = io(SOCKET_URL, {
      autoConnect: false,
    });
  } else {
    socket = io(SOCKET_URL, {
      auth: {
        userId: activeUserId,
      },
      autoConnect: true,
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
