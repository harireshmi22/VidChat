import { Server, Socket } from "socket.io";
import { getSocketId, isUserOnline, getOnlineUsers as getOnlineUserIds } from "../socket.store.js";
import { registeredUsers } from "../user.store.js";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  getPendingIncomingRequests,
  getPendingOutgoingRequests,
  addDirectMessage,
  getDirectMessages,
  areFriends,
} from "../friends.store.js";

// Helper to push full online users list to a single socket
export function sendOnlineUsers(socket: Socket) {
  const onlineIds = getOnlineUserIds().filter(id => id !== socket.data.userId);
  const onlineUsers = onlineIds.map(id => {
    const u = registeredUsers.get(id);
    return {
      userId: id,
      name: u?.name || id,
      avatarColor: u?.avatarColor || "#60a5fa"
    };
  });
  socket.emit("onlineUsersList", onlineUsers);
}

// Broadcast online users update to everyone connected
export function broadcastOnlineUsers(io: Server) {
  const onlineIds = getOnlineUserIds();
  io.sockets.sockets.forEach(socket => {
    const targetUserId = socket.data.userId;
    if (targetUserId) {
      const filteredList = onlineIds
        .filter(id => id !== targetUserId)
        .map(id => {
          const u = registeredUsers.get(id);
          return {
            userId: id,
            name: u?.name || id,
            avatarColor: u?.avatarColor || "#60a5fa"
          };
        });
      socket.emit("onlineUsersUpdated", filteredList);
    }
  });
}

// Helper to push full friendship/requests updates to a user if online
export function sendFriendsUpdate(userId: string, io: Server) {
  const socketId = getSocketId(userId);
  if (!socketId) return;

  const friends = getFriends(userId).map((f) => {
    const u = registeredUsers.get(f);
    return {
      userId: f,
      name: u?.name || f,
      avatarColor: u?.avatarColor || "#60a5fa",
      isOnline: isUserOnline(f),
    };
  });

  const pendingIncoming = getPendingIncomingRequests(userId).map(id => {
    const u = registeredUsers.get(id);
    return { userId: id, name: u?.name || id, avatarColor: u?.avatarColor || "#60a5fa" };
  });

  const pendingOutgoing = getPendingOutgoingRequests(userId).map(id => {
    const u = registeredUsers.get(id);
    return { userId: id, name: u?.name || id, avatarColor: u?.avatarColor || "#60a5fa" };
  });

  io.to(socketId).emit("friendsDataUpdated", {
    friends,
    pendingIncoming,
    pendingOutgoing,
  });
}

// Helper to broadcast online status changes to all friends
export function notifyFriendsStatusChange(userId: string, io: Server) {
  const friends = getFriends(userId);
  friends.forEach((friendId) => {
    sendFriendsUpdate(friendId, io);
  });
}

export function registerFriendsEvents(socket: Socket, io: Server) {
  const userId = socket.data.userId;
  if (!userId) return;

  // Notify friends that this user is online on connection
  notifyFriendsStatusChange(userId, io);

  // Broadcast updated online list to everyone
  broadcastOnlineUsers(io);

  // Get friends list and pending requests
  socket.on("getFriendsData", () => {
    sendFriendsUpdate(userId, io);
  });

  // Get online users list for searches
  socket.on("getOnlineUsers", () => {
    sendOnlineUsers(socket);
  });

  // Send friend request
  socket.on("sendFriendRequest", ({ toUserId }) => {
    if (!toUserId || toUserId === userId) return;

    const success = sendFriendRequest(userId, toUserId);
    if (success) {
      sendFriendsUpdate(userId, io);
      sendFriendsUpdate(toUserId, io);
    }
  });

  // Accept friend request
  socket.on("acceptFriendRequest", ({ fromUserId }) => {
    if (!fromUserId) return;

    const success = acceptFriendRequest(fromUserId, userId);
    if (success) {
      sendFriendsUpdate(userId, io);
      sendFriendsUpdate(fromUserId, io);
      // Notify other friends that they can now see each other online
      notifyFriendsStatusChange(userId, io);
      notifyFriendsStatusChange(fromUserId, io);
    }
  });

  // Decline or Cancel friend request
  socket.on("declineFriendRequest", ({ fromUserId }) => {
    if (!fromUserId) return;

    const success = declineFriendRequest(fromUserId, userId);
    if (success) {
      sendFriendsUpdate(userId, io);
      sendFriendsUpdate(fromUserId, io);
    }
  });

  // Fetch DM history
  socket.on("getDirectMessageHistory", ({ toUserId }) => {
    if (!toUserId || !areFriends(userId, toUserId)) return;

    const history = getDirectMessages(userId, toUserId);
    socket.emit("directMessageHistory", { toUserId, history });
  });

  // Send Direct Message
  socket.on("sendDirectMessage", ({ toUserId, text }) => {
    if (!toUserId || !text || !areFriends(userId, toUserId)) return;

    const msg = addDirectMessage(userId, toUserId, text);
    
    // Send to recipient if online
    const receiverSocketId = getSocketId(toUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("directMessageReceived", {
        fromUserId: userId,
        message: msg,
      });
    }

    // Send back confirm to sender
    socket.emit("directMessageSent", {
      toUserId,
      message: msg,
    });
  });

  // Initiate call to user
  socket.on("initiateCall", ({ toUserId, room }) => {
    if (!toUserId || !room) return;

    const callerUser = registeredUsers.get(userId);
    const receiverSocketId = getSocketId(toUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", {
        fromUserId: userId,
        fromName: callerUser?.name || userId,
        room,
      });
    } else {
      socket.emit("callFailed", { error: "User is offline" });
    }
  });

  // Handle live user profile updates
  socket.on("updateProfile", () => {
    notifyFriendsStatusChange(userId, io);
    broadcastOnlineUsers(io);
  });

  // Decline call
  socket.on("declineCall", ({ toUserId }) => {
    if (!toUserId) return;

    const callerSocketId = getSocketId(toUserId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("callDeclined", {
        fromUserId: userId,
      });
    }
  });

  // Accept call
  socket.on("acceptCall", ({ toUserId, room }) => {
    if (!toUserId || !room) return;

    const callerSocketId = getSocketId(toUserId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("callAccepted", {
        fromUserId: userId,
        room,
      });
    }
  });
}
