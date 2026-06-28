import { Socket, Server } from "socket.io";
import { getSocketId, removeUser } from "../socket.store.js";

/*

chat -> privateChat(), roomChat(), typing()

*/

const privateChat = (socket: Socket, io: Server) => {
    socket.on("privateChat", (data: { userId: string; message: string }) => {
        console.log(`📩 Server received privateChat event from ${socket.data.userId} to ${data.userId}: "${data.message}"`);
        const targetSocketId = getSocketId(data.userId);

        if (targetSocketId) {
            io.to(targetSocketId).emit("privateChat", {
                from: socket.data.userId,
                message: data.message,
                timestamp: Date.now()
            });
            console.log(`📤 Private chat routed from ${socket.data.userId} to socket ${targetSocketId} (${data.userId})`);
        } else {
            console.log(`⚠️ User ${data.userId} is offline, cannot route message.`);
            socket.emit("error", { message: `User ${data.userId} is offline.` });
        }
    });


}

const roomChat = (socket: Socket, io: Server) => {
    socket.on("roomChat", (data: { roomId: string; message: string }) => {
        console.log(`📩 Server received roomChat event from ${socket.data.userId} to room ${data.roomId}: "${data.message}"`);
        io.to(data.roomId).emit("roomChatReceived", {
            roomId: data.roomId,
            from: socket.data.userId,
            text: data.message,
            timestamp: Date.now()
        });
    });
}

export function registerChatEvents(socket: Socket, io: Server) {
    privateChat(socket, io);
    roomChat(socket, io);
}