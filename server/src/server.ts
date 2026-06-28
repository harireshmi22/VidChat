import express, { Express, Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { initSocket } from "./socket/index.js";
import { registeredUsers } from "./socket/user.store.js";

const app: Express = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";
const PORT = Number(process.env.PORT) || 3001;

// Express Middlewares
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to generate a nice color from username string
const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 65%, 55%)`;
};

// Signup Endpoint
app.post("/api/signup", (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const existingUser = Array.from(registeredUsers.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        return res.status(400).json({ error: "Email already registered." });
    }

    const userId = name.trim().replace(/\s+/g, "") || email.split("@")[0];
    const avatarColor = getAvatarColor(name);

    const newUser = { userId, email, password, name, avatarColor };
    registeredUsers.set(userId, newUser);

    console.log(`👤 New User Signed Up: ${name} (${userId}) with color ${avatarColor}`);

    return res.status(201).json({
        accessToken: "mock-access-token-" + Date.now(),
        refreshToken: "mock-refresh-token-" + Date.now(),
        userId,
        name,
        avatarColor
    });
});

// Login Endpoint
app.post("/api/login", (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const user = Array.from(registeredUsers.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
        return res.status(404).json({ error: "User does not exist. Redirecting to signup." });
    }

    if (user.password !== password) {
        return res.status(401).json({ error: "Incorrect password." });
    }

    console.log(`👤 User Logged In: ${user.name} (${user.userId})`);

    return res.status(200).json({
        accessToken: "mock-access-token-" + Date.now(),
        refreshToken: "mock-refresh-token-" + Date.now(),
        userId: user.userId,
        name: user.name,
        avatarColor: user.avatarColor
    });
});

// Socket.IO Server initialization via modular helper
initSocket(server);

// Profile Update Endpoint
app.post("/api/user/update", (req: Request, res: Response) => {
    const { userId, name, avatarColor } = req.body;
    if (!userId) {
        return res.status(400).json({ error: "Missing userId." });
    }

    const user = registeredUsers.get(userId);
    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    if (name) user.name = name;
    if (avatarColor) user.avatarColor = avatarColor;

    registeredUsers.set(userId, user);
    console.log(`👤 User Details Updated: ${user.name} (${user.userId}) with color ${user.avatarColor}`);

    return res.status(200).json({
        userId: user.userId,
        name: user.name,
        avatarColor: user.avatarColor
    });
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "OK",
        message: "Server is running",
        timestamp: Date.now()
    });
});

// Start the server
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO available at http://localhost:${PORT}/socket.io`);
});

// Graceful shutdown logic
process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down gracefully...");
    server.close(() => {
        console.log("💥 Server closed");
        process.exit(0);
    });
});
