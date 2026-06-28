import { Socket, Server } from "socket.io";
import { customRoomsStore, registeredUsers } from "../user.store.js";
import { getSocketId } from "../socket.store.js";

const createRoom = (socket: Socket, io: Server) => {
    socket.on("create_room", () => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const userId = socket.data.userId;
        
        customRoomsStore.set(roomId, {
            roomId,
            ownerId: userId,
            members: new Set([userId])
        });
        
        socket.join(roomId);
        socket.emit("roomCreated", { roomId });
        console.log(`🏠 Custom Room Created: ${roomId} by owner ${userId}`);
    });
}

const createGroupChat = (socket: Socket, io: Server) => {
    socket.on("create_group_chat", (data: { invitedUserIds: string[] }) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const userId = socket.data.userId;
        const members = new Set([userId, ...data.invitedUserIds]);

        customRoomsStore.set(roomId, {
            roomId,
            ownerId: userId,
            members
        });

        socket.join(roomId);
        socket.emit("roomCreated", { roomId });
        console.log(`👥 Group Chat Room Created: ${roomId} by owner ${userId} with members [${Array.from(members).join(", ")}]`);

        // Notify invitees who are online
        data.invitedUserIds.forEach((invitedId) => {
            const socketId = getSocketId(invitedId);
            if (socketId) {
                io.to(socketId).emit("invitedToGroup", { roomId });
            }
        });
    });
}

const joinRoom = (socket: Socket) => {
    socket.on("join_room", (roomId: string) => {
        const userId = socket.data.userId;
        socket.join(roomId);

        if (customRoomsStore.has(roomId)) {
            const room = customRoomsStore.get(roomId);
            room?.members.add(userId);
            console.log(`User ${userId} added to custom room members list for ${roomId}`);
        }

        socket.to(roomId).emit("user-joined", {
            userId: userId
        });

        console.log(`User ${userId} joined room ${roomId}`);
    });
}

const leaveRoom = (socket: Socket) => {
    socket.on("leave_room", (roomId: string) => {
        const userId = socket.data.userId;
        socket.leave(roomId);

        socket.to(roomId).emit("user-left", {
            userId: userId
        });

        console.log(`User ${userId} left room ${roomId}`);
    });
}

const exitRoom = (socket: Socket) => {
    socket.on("exit_room", (roomId: string) => {
        const userId = socket.data.userId;
        socket.leave(roomId);

        if (customRoomsStore.has(roomId)) {
            const room = customRoomsStore.get(roomId);
            room?.members.delete(userId);
            if (room?.members.size === 0) {
                customRoomsStore.delete(roomId);
                console.log(`🏠 Cleaned up empty Custom Room ${roomId}`);
            }
        }

        socket.to(roomId).emit("user-left", {
            userId: userId
        });

        console.log(`User ${userId} exited room ${roomId}`);
    });
}

const roomMessage = (socket: Socket, io: Server) => {
    socket.on("roomMessage", (data: { roomId: string; message: string }) => {
        const userId = socket.data.userId;
        const { roomId, message } = data;

        const isGeneralRoom = roomId === "general" || roomId === "random" || roomId === "voice-lobby" || roomId === "dev-channel";
        let isMember = isGeneralRoom;
        
        if (!isMember && customRoomsStore.has(roomId)) {
            isMember = customRoomsStore.get(roomId)!.members.has(userId);
        }

        if (isMember) {
            const u = registeredUsers.get(userId);
            io.to(roomId).emit("roomMessage", {
                roomId,
                from: userId,
                fromName: u?.name || userId,
                text: message,
                timestamp: Date.now()
            });
            console.log(`📩 Room message in ${roomId} from ${userId} (${u?.name}): "${message}"`);
        } else {
            console.log(`⚠️ User ${userId} is not a member of room ${roomId}, message blocked.`);
            socket.emit("error", { message: `You are not a member of room ${roomId}.` });
        }
    });
}

export function registerRoomEvents(socket: Socket, io: Server) {
    createRoom(socket, io);
    createGroupChat(socket, io);
    joinRoom(socket);
    leaveRoom(socket);
    exitRoom(socket);
    roomMessage(socket, io);
}