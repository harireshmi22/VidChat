import { Server } from "socket.io";

import { addUser, removeUser, socketMap } from "./socket.store.js";

import { registerRoomEvents } from "./events/rooms.events.js";
import { registerChatEvents } from "./events/chat.events.js";
import { registerSignalingEvents } from "./events/signaling.events.js";
import { registerFriendsEvents, notifyFriendsStatusChange, broadcastOnlineUsers } from "./events/friends.events.js";


export function initSocket(server: any) {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const io = new Server(server, {
        cors: {
            origin: clientUrl,
            methods: ["GET", "POST"],
            credentials: true,
        }
    });


    io.on("connection", (socket) => {
        console.log("User connected from server:", socket.id)


        const userId = socket.handshake.auth.userId;

        addUser(userId, socket.id)

        socket.data.userId = userId;

        registerRoomEvents(socket, io)
        registerChatEvents(socket, io)
        registerSignalingEvents(socket, io)
        registerFriendsEvents(socket, io)

        // Broadcast updated online list on connection
        broadcastOnlineUsers(io);

        socket.on("disconnect", () => {
            removeUser(userId)
            notifyFriendsStatusChange(userId, io)
            // Broadcast updated online list on disconnection
            broadcastOnlineUsers(io);
            console.log(`🔌 User ${userId} disconnected`);
        })
    })
}