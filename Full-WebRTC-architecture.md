# WebRTC & Socket.io: From Basic PoC to Scaled Production Architecture

This guide details the evolutionary path of building a real-time WebRTC and Socket.io video calling application. It covers four phases: starting with a basic localhost setup, hardening it for the web, scaling it horizontally, and upgrading to production-grade media servers.

---

## Roadmap Overview

```
┌─────────────────────────┐      ┌─────────────────────────┐
│  Phase 1: Basic PoC    │      │  Phase 2: Hardening     │
│  - Localhost loopback   ├─────►│  - JWT Authentication   │
│  - Public STUN server   │      │  - TURN Server setup    │
│  - In-Memory states     │      │  - DB Persistence       │
└─────────────────────────┘      └────────────┬────────────┘
                                              │
                                              ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│  Phase 4: Media Server  │◄─────┤  Phase 3: Clustering    │
│  - SFU / MCU Engine     │      │  - Redis Pub/Sub adapter│
│  - Multi-party calling  │      │  - Sticky Sessions LB   │
│  - Bandwidth management │      │  - Scaled Node instances│
└─────────────────────────┘      └─────────────────────────┘
```

---

## Phase 1: The Basic Proof-of-Concept (Localhost)

In this phase, we establish the absolute minimum configuration needed to run WebRTC between two local browser tabs.

### Step 1.1: The Local Signaling Server

The server simply acts as a routing post office. It receives a signaling packet (Offer, Answer, or ICE candidate) from Client A and forwards it to Client B using Socket.io.

```javascript
// Minimal Node.js Server (Express + Socket.io)
const io = require("socket.io")(3001, { cors: { origin: "*" } });

const users = {}; // Map socket.id -> username

io.on("connection", (socket) => {
  socket.on("join-room", (username) => {
    users[socket.id] = username;
    socket.broadcast.emit("user-joined", { socketId: socket.id, username });
  });

  socket.on("webrtc-offer", ({ targetSocketId, offer }) => {
    io.to(targetSocketId).emit("webrtc-offer", { from: socket.id, offer });
  });

  socket.on("webrtc-answer", ({ targetSocketId, answer }) => {
    io.to(targetSocketId).emit("webrtc-answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit("ice-candidate", { from: socket.id, candidate });
  });
});
```

### Step 1.2: The Local Peer Connection Setup

1. Fetch media streams via `navigator.mediaDevices.getUserMedia`.
2. Instantiate `new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] })`.
3. Add local media tracks using `peerConnection.addTrack(track, localStream)`.
4. Listen to `peerConnection.onicecandidate` and emit discovered candidates to the signaling server.
5. Listen to `peerConnection.ontrack` and bind the incoming stream to a remote `<video>` element.

---

## Phase 2: Hardening for the Public Web

Localhost is highly forgiving. Once deployed to the internet, NATs, firewalls, and malicious users will break your application.

### Step 2.1: Implement STUN and TURN

Direct connections fail for 20-30% of internet users due to Symmetric NATs.

* **Action**: Set up a TURN server (using open-source `coturn` or commercial providers like Metered/Xirsys).
* **Coturn Configuration** (`turnserver.conf`):

  ```ini
  listening-port=3478
  tls-listening-port=5349
  realm=turn.mydomain.com
  fingerprint
  lt-cred-mech
  user=myuser:mypassword
  ```

* **Frontend Config**: Update the `RTCConfiguration` in your frontend client:

  ```javascript
  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: "turn:turn.mydomain.com:3478",
        username: "myuser",
        credential: "mypassword"
      }
    ]
  };
  ```

### Step 2.2: Add Cryptographic Authorization (JWT)

Ensure only authorized users can connect to your signaling channel.

* Add a handshake middleware in Socket.io to verify JSON Web Tokens (JWT) issued by your HTTP authentication server.
* Store persistent user records (profiles, friend lists, room history) in a database (e.g. PostgreSQL or MongoDB) instead of volatile in-memory JavaScript `Map` collections.

---

## Phase 3: Scaling Horizontally (Clustering)

A single Node.js signaling process can handle about 5,000–10,000 concurrent sockets before CPU bottlenecking occurs. To support millions, you must scale horizontally.

### Step 3.1: Add Redis Pub/Sub adapter

When a user on `Server Instance A` wants to call a user connected to `Server Instance B`, they cannot do so directly because their sockets belong to different memory spaces.

* **Solution**: Configure the `@socket.io/redis-adapter` to distribute messages to all nodes:

  ```typescript
  import { createClient } from "redis";
  import { createAdapter } from "@socket.io/redis-adapter";
  
  const pubClient = createClient({ url: "redis://localhost:6379" });
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
  ```

### Step 3.2: Configure Sticky Sessions on Load Balancer

WebSockets begin with an HTTP handshake that is upgraded to a TCP stream. If your load balancer (e.g. Nginx or AWS ALB) routes subsequent packets of the handshake to different nodes, the connection fails.

* **Action**: Configure your load balancer to use **Sticky Sessions** (Session Affinity via cookies).

---

## Phase 4: Production Media Servers (SFU / MCU)

In a mesh (peer-to-peer) layout, every client creates a connection to every other client. For $N$ users, each client uploads $N-1$ streams and downloads $N-1$ streams. This scales quadratically ($O(N^2)$) and quickly overwhelms client upload bandwidth and CPU.

```
       [ Mesh (P2P) ]                      [ SFU Server ]
      A ◄─────────► B                     A ───────► [ SFU ] ◄─────── B
      ▲             ▲                     │           │ │             │
      │   (O(N^2))  │                     ▼           │ │             ▼
      ▼             ▼                     C ◄─────────┘ └───────────► C
      C ◄─────────► D                     (Each uploads 1 stream, downloads N-1)
```

### Step 4.1: Integrate an SFU (Selective Forwarding Unit)

Instead of connecting directly to another peer, clients establish a WebRTC connection with a centralized media server.

* **How it works**: Client A uploads **1 stream** to the SFU. The SFU forwards this stream to Clients B, C, and D.
* **Benefits**:
  * Upload bandwidth for each client is always constant ($O(1)$).
  * The server can throttle resolutions based on network conditions (using Simulcast or SVC).
* **Recommended Open Source SFUs**:
  * **LiveKit**: Modern, built on Go & Rust, with built-in JWT authorization.
  * **Mediasoup**: Extremely performant Node.js C++ library.
  * **Pion**: Scalable WebRTC stack written in pure Go.

---

## Phase 5: Complete Frontend WebRTC & Socket.io Integration

This section provides the complete frontend code files and details the step-by-step setup required to integrate them with the backend signaling server.

### Step 5.1: Install Peer Dependencies

Make sure you install the standard Socket.io client dependency:

```bash
npm install socket.io-client
```

### Step 5.2: The Custom React Integration Hook

Create a file at `frontend/src/hooks/useWebRTC.ts` to manage client connections, listen to signaling events, configure local streams, and set up peer-to-peer tracking.

```typescript
// File: frontend/src/hooks/useWebRTC.ts
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  userName: string;
  token: string;
  serverUrl: string;
}

export function useWebRTC({ roomId, userId, userName, token, serverUrl }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    let active = true;

    // Connect to signaling server with JWT Token verification
    const socket = io(serverUrl, {
      auth: { token },
      transports: ["websocket"]
    });
    socketRef.current = socket;

    async function initMediaAndSignaling() {
      try {
        // 1. Fetch Local Stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        setLocalStream(stream);

        // 2. Notify Signaling Server
        socket.emit("join-room", roomId);
      } catch (err) {
        console.error("❌ Failed to obtain media devices:", err);
        setConnectionStatus("Media Access Denied");
      }
    }

    const createPeerConnection = (targetUserId: string) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      peerConnectionRef.current = pc;

      // Add local media tracks
      if (localStream) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle remote media track arrival
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          setConnectionStatus("Connected");
        }
      };

      // Emit generated ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            targetUserId,
            candidate: event.candidate
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (active) setConnectionStatus(pc.connectionState);
      };

      return pc;
    };

    // --- Signaling Event Routes ---
    socket.on("user-joined", async (data: { userId: string }) => {
      setConnectionStatus("Connecting...");
      const pc = createPeerConnection(data.userId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", { targetUserId: data.userId, offer });
    });

    socket.on("webrtc-offer", async (data: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
      setConnectionStatus("Connecting...");
      const pc = createPeerConnection(data.fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { targetUserId: data.fromUserId, answer });
    });

    socket.on("webrtc-answer", async (data: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    socket.on("ice-candidate", async (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    socket.on("user-left", () => {
      setRemoteStream(null);
      setConnectionStatus("Peer disconnected");
    });

    initMediaAndSignaling();

    return () => {
      active = false;
      socket.disconnect();
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      if (localStream) localStream.getTracks().forEach(t => t.stop());
    };
  }, [roomId, userId, userName, token, serverUrl, localStream]);

  return { localStream, remoteStream, connectionStatus };
}
```

### Step 5.3: The Video Calling Component

Create a page or component at `frontend/src/components/VideoRoom.tsx` to handle the media playback tags and layout.

```tsx
// File: frontend/src/components/VideoRoom.tsx
import React, { useEffect, useRef } from "react";
import { useWebRTC } from "../hooks/useWebRTC";

interface VideoRoomProps {
  roomId: string;
  userId: string;
  userName: string;
  token: string;
  serverUrl: string;
}

export function VideoRoom({ roomId, userId, userName, token, serverUrl }: VideoRoomProps) {
  const { localStream, remoteStream, connectionStatus } = useWebRTC({
    roomId,
    userId,
    userName,
    token,
    serverUrl
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div style={{ padding: "20px", background: "#1e293b", color: "#fff", borderRadius: "8px" }}>
      <h3>Room ID: {roomId} ({connectionStatus})</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <h4>Local (You)</h4>
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", background: "#000" }} />
        </div>
        <div>
          <h4>Remote Partner</h4>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", background: "#000" }} />
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 6: Production Database Integration

To move past volatile in-memory arrays and support stateless horizontal scaling, we need a persistent database layer. For this guide, we use **MongoDB** coupled with **Prisma ORM** as it offers high-performance document storage, flexible indexing, and scales horizontally with ease.

### Step 6.1: Database Schema Design (MongoDB)

In MongoDB, IDs must be mapped to the `_id` field and typed as `ObjectId`.

Create `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL") // Example: mongodb+srv://username:password@cluster.mongodb.net/webrtc?retryWrites=true&w=majority
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String          @id @default(auto()) @map("_id") @db.ObjectId
  email        String          @unique
  passwordHash String
  name         String
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  roomsOwned   Room[]          @relation("RoomOwner")
  sessions     ActiveSession[]
}

model Room {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  ownerId   String   @db.ObjectId
  owner     User     @relation("RoomOwner", fields: [ownerId], references: [id])
  createdAt DateTime @default(now())
}

model ActiveSession {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  socketId  String   @unique
  nodeIp    String   // Tracks which server instance (IP) the user is connected to
  createdAt DateTime @default(now())
}
```

### Step 6.2: Backend DB Helpers & Auth Controllers

Below is the controller code to register/login a user, hash their passwords securely, issue JWT tokens, and manage `ActiveSession` state.

```typescript
// File: backend/src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "super-secure-jwt-key";

export async function signup(req: Request, res: Response) {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name }
    });

    const token = jwt.sign({ userId: user.id, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    return res.status(201).json({ token, userId: user.id, name: user.name });
  } catch (err) {
    return res.status(400).json({ error: "User already exists or DB error" });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user.id, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
  return res.status(200).json({ token, userId: user.id, name: user.name });
}
```

### Step 6.3: Tracking WebSocket Sessions in DB

Modify the connection handler in `backend/src/socket/index.ts` to sync socket mappings to PostgreSQL:

```typescript
// Replace the in-memory socketMap helper with DB sessions:
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const NODE_IP = process.env.HOST_IP || "127.0.0.1";

async function registerSocketSession(userId: string, socketId: string) {
  // Upsert session details to track which Node instance holds this client connection
  await prisma.activeSession.upsert({
    where: { socketId },
    update: { userId, nodeIp: NODE_IP },
    create: { userId, socketId, nodeIp: NODE_IP }
  });
}

async function removeSocketSession(socketId: string) {
  await prisma.activeSession.delete({
    where: { socketId }
  }).catch(() => {}); // Gracefully ignore if already deleted
}
```

### Step 6.4: Frontend Token and DB Session Persistence

Integrate user login flow, persist credentials and DB-signed tokens into `localStorage`, and inject it into the Hook during page load.

```tsx
// File: frontend/src/pages/VideoCallRoom.tsx
import React, { useState, useEffect } from "react";
import { VideoRoom } from "../components/VideoRoom";

export function VideoCallRoom() {
  const [authData, setAuthData] = useState<{ token: string; userId: string; name: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const name = localStorage.getItem("name");

    if (token && userId && name) {
      setAuthData({ token, userId, name });
    } else {
      // Redirect user to login or request them to sign in
      window.location.href = "/login";
    }
  }, []);

  if (!authData) return <div>Authenticating...</div>;

  return (
    <VideoRoom
      roomId="voice-lobby"
      userId={authData.userId}
      userName={authData.name}
      token={authData.token}
      serverUrl={process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}
    />
  );
}
```
