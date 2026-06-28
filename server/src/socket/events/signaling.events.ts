import { Socket, Server } from "socket.io";
import { getSocketId } from "../socket.store.js";

// handle offer means sending Request to another user
const offer = (socket: Socket, io: Server) => {

    // listen for offer event
    socket.on("offer", (data: { userId: string; offer: any; fromName?: string }) => {
        console.log(`📩 Server received offer from ${socket.data.userId} to ${data.userId}`);

        // get the socket id of the target user
        const targetSocketId = getSocketId(data.userId);

        // if the target user is online, emit(send) the offer to them
        if (targetSocketId) {
            io.to(targetSocketId).emit("offer", {
                from: socket.data.userId,
                fromName: data.fromName,
                offer: data.offer,
                timestamp: Date.now() // add timestamp for debugging
            });
            console.log(`📤 Offer routed from ${socket.data.userId} to socket ${targetSocketId} (${data.userId})`);
        } else {
            console.log(`⚠️ User ${data.userId} is offline, cannot route offer.`);
            socket.emit("error", { message: `User ${data.userId} is offline.` });
        }
    });
}

// handle answer means sending Response to another user
const answer = (socket: Socket) => {
    socket.on("answer", (data: { userId: string; answer: any; fromName?: string }) => {
        console.log(`📩 Server received answer from ${socket.data.userId} to ${data.userId}`);

        // get the socket id of the target user
        const targetSocketId = getSocketId(data.userId);

        // if the target user is online, emit(send) the answer to them
        if (targetSocketId) {

            // emit(send) the answer to the target user 
            socket.to(targetSocketId).emit("answer", {
                from: socket.data.userId,
                fromName: data.fromName,
                answer: data.answer,
                timestamp: Date.now() // add timestamp for debugging
            });
            console.log(`📤 Answer routed from ${socket.data.userId} to socket ${targetSocketId} (${data.userId})`);
        } else {
            console.log(`⚠️ User ${data.userId} is offline, cannot route answer.`);
            socket.emit("error", { message: `User ${data.userId} is offline.` });
        }
    });
}

// handle iceCandidate means sending connection path info to another user
const iceCandidate = (socket: Socket) => {
    socket.on("iceCandidate", (data: { userId: string; candidate: any }) => {
        console.log(`📩 Server received iceCandidate from ${socket.data.userId} to ${data.userId}`);

        // get the socket id of the target user
        const targetSocketId = getSocketId(data.userId);

        // if the target user is online, emit the iceCandidate to them
        if (targetSocketId) {
            socket.to(targetSocketId).emit("iceCandidate", {
                from: socket.data.userId,
                candidate: data.candidate,
                timestamp: Date.now() // add timestamp for debugging
            });
            console.log(`📤 ICE Candidate routed from ${socket.data.userId} to socket ${targetSocketId} (${data.userId})`);
        } else {
            console.log(`⚠️ User ${data.userId} is offline, cannot route ICE candidate.`);
            socket.emit("error", { message: `User ${data.userId} is offline.` });
        }
    });
}

export function registerSignalingEvents(socket: Socket, io: Server) {
    offer(socket, io);
    answer(socket);
    iceCandidate(socket);
}
