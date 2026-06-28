import { io } from "socket.io-client";

const PORT = process.env.PORT || 3001;
const URL = `http://localhost:${PORT}`;

console.log(`Connecting to Socket.IO server at ${URL}...`);

const socket = io(URL, {
    transports: ["websocket"],
    reconnection: false
});

// Timeout to prevent hanging
const timeout = setTimeout(() => {
    console.error("❌ Connection timeout. Is the server running?");
    socket.close();
    process.exit(1);
}, 5000);

socket.on("connect", () => {
    clearTimeout(timeout);
    console.log(`✅ Connected successfully! Socket ID: ${socket.id}`);

    console.log("Testing ping-test event...");
    socket.emit("ping-test", { hello: "world" }, (response: any) => {
        console.log("🏓 Callback response received:", response);
        if (response && response.message === "pong") {
            console.log("✅ ping-test is working correctly!");
        } else {
            console.error("❌ ping-test response is invalid!");
        }

        // Test room joining
        console.log("Testing join-room event...");
        socket.emit("join-room", "test-room-123", "test-user-1");
        console.log("👤 Emitted join-room event for room 'test-room-123' and user 'test-user-1'");


        console.log("Testing private_chat event...");
        socket.emit("privateChat", { userId: "test-user-2", message: "Hey user-2! How are you?" });
        console.log("👤 Emitted private_chat event");


        console.log("Testing User Exist or not")
        const userExist = socket.emit("isUserOnline", "test-user-2");
        console.log(`👤 Emitted isUserOnline event for user 'test-user-2'`, userExist);


        socket.on("isUserOnline", (data: boolean) => {
            console.log("🏓 Callback response received:", data);
        })
        
        // Wait a brief moment to make sure events process, then close
        setTimeout(() => {
            console.log("🔌 Disconnecting test client...");
            socket.close();
            console.log("🎉 Socket.IO connection is working well!");
            process.exit(0);
        }, 1000);
    });
});

socket.on("connect_error", (error) => {
    clearTimeout(timeout);
    console.error("❌ Connection error:", error.message);
    process.exit(1);
});

socket.on("disconnect", (reason) => {
    console.log(`🔌 Disconnected: ${reason}`);
});
