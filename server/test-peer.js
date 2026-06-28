import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  auth: {
    userId: "userB"
  }
});

console.log("🤖 Test Peer 'userB' starting...");

socket.on("connect", () => {
  console.log("🤖 Connected to socket server with ID:", socket.id);
  socket.emit("getFriendsData");
});

socket.on("friendsDataUpdated", (data) => {
  console.log("🤖 friendsDataUpdated received:", JSON.stringify(data));
  if (data.pendingIncoming && data.pendingIncoming.includes("HariReshmi")) {
    console.log("🤖 Found pending friend request from HariReshmi. Accepting...");
    socket.emit("acceptFriendRequest", { fromUserId: "HariReshmi" });
  }
});

socket.on("directMessageReceived", ({ fromUserId, message }) => {
  console.log(`🤖 Received DM from ${fromUserId}: "${message.text}"`);
  socket.emit("sendDirectMessage", {
    toUserId: fromUserId,
    text: `Hello! I received your message: "${message.text}"`
  });
});

socket.on("incomingCall", ({ fromUserId, room }) => {
  console.log(`🤖 Incoming call from ${fromUserId} in room: ${room}`);
  console.log("🤖 Accepting call...");
  socket.emit("acceptCall", { toUserId: fromUserId, room });
});

socket.on("disconnect", () => {
  console.log("🤖 Disconnected from server.");
});
