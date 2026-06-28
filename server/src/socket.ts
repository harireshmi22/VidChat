import { Server, Socket } from "socket.io";

export function setupSocket(io: Server): void {
    io.on("connection", (socket: Socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Ping check event
        socket.on("ping-test", (data: any, callback?: (response: any) => void) => {
            console.log(`🏓 Ping received from ${socket.id}:`, data);
            if (callback) {
                callback({ status: "success", message: "pong", timestamp: Date.now() });
            }
        });

        // Join room event for video calling
        socket.on("join-room", (roomId: string, userId: string) => {
            socket.join(roomId);
            console.log(`👤 User ${userId} (${socket.id}) joined room: ${roomId}`);
            
            // Notify other clients in the room that a new user has joined
            socket.to(roomId).emit("user-joined", { userId, socketId: socket.id });
        });

        // Leave room event
        socket.on("leave-room", (roomId: string, userId: string) => {
            socket.leave(roomId);
            console.log(`👤 User ${userId} (${socket.id}) left room: ${roomId}`);
            socket.to(roomId).emit("user-left", { userId, socketId: socket.id });
        });

        // Relay WebRTC Offer
        socket.on("offer", (data: { offer: any; to: string; senderId: string }) => {
            console.log(`✉️ Relay WebRTC offer from ${data.senderId} (${socket.id}) to socket ${data.to}`);
            io.to(data.to).emit("offer", {
                offer: data.offer,
                from: socket.id,
                senderId: data.senderId,
            });
        });

        // Relay WebRTC Answer
        socket.on("answer", (data: { answer: any; to: string; senderId: string }) => {
            console.log(`✉️ Relay WebRTC answer from ${data.senderId} (${socket.id}) to socket ${data.to}`);
            io.to(data.to).emit("answer", {
                answer: data.answer,
                from: socket.id,
                senderId: data.senderId,
            });
        });

        // Relay ICE Candidate
        socket.on("ice-candidate", (data: { candidate: any; to: string; senderId: string }) => {
            console.log(`✉️ Relay ICE candidate from ${data.senderId} (${socket.id}) to socket ${data.to}`);
            io.to(data.to).emit("ice-candidate", {
                candidate: data.candidate,
                from: socket.id,
                senderId: data.senderId,
            });
        });

        // Handle disconnecting (user leaves all joined rooms on connection loss)
        socket.on("disconnecting", () => {
            console.log(`🔌 Client disconnecting: ${socket.id}`);
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    socket.to(room).emit("user-disconnected", { socketId: socket.id });
                }
            }
        });

        // Handle complete disconnect
        socket.on("disconnect", () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
}
