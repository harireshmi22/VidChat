# VidChat - WebRTC Video Calling & Chat Application

VidChat is a full-stack real-time video calling and chat application built using WebRTC, Next.js, Express, and Socket.io.

This repository contains both the client and server code, containerized using Docker for easy development and seamless deployment on AWS.

---

## Repository Structure

```
videoCalling/
├── videocall-client/      # Next.js frontend (React 19, TailwindCSS, Socket.io-client)
├── server/                # Express & Socket.io backend (TypeScript, Tsx)
├── docker-compose.yml     # Root Docker Compose configuration
└── README.md              # Project documentation
```

---

## Tech Stack

### Frontend (`videocall-client`)

- **Framework**: Next.js 16 (App Router, Standalone build)
- **Library**: React 19
- **Styling**: TailwindCSS
- **Real-time Communication**: Socket.io-client, WebRTC APIs

### Backend (`server`)

- **Runtime**: Node.js & TypeScript
- **Framework**: Express
- **Real-time Server**: Socket.io

---

## Local Development (With Docker)

To run both services locally with hot-reloading or containerized environment using Docker:

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) installed on your system.

### Running the Project

1. **Clone the repository:**

   ```bash
   git clone https://github.com/harireshmi22/VidChat.git
   cd VidChat
   ```

2. **Start the containers:**

   ```bash
   docker-compose up -d --build
   ```

3. **Access the application:**
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API & WebSockets**: [http://localhost:3001](http://localhost:3001)

4. **Stop the containers:**

   ```bash
   docker-compose down
   ```

---

## Production Deployment on AWS

Both the frontend and backend are configured for optimized production builds.

### 1. Docker Images Optimization

- **Next.js Standalone Build**: The client uses Next.js `standalone` mode to package only the necessary dependencies, significantly reducing the image footprint.
- **Multi-stage Builds**: Both `Dockerfile`s compile code in builder stages and copy only production-ready artifacts into lightweight `node:20-alpine` runner containers.

### 2. Deployment Steps (Elastic Beanstalk / ECS / EC2)

#### Using Docker Compose on AWS EC2

1. Spin up an AWS EC2 instance (Ubuntu/Amazon Linux) and install Docker & Docker Compose.
2. Clone this repository on the instance.
3. Update the `docker-compose.yml` environment variables:
   - Change `NEXT_PUBLIC_API_URL` to your backend public URL/IP.
   - Change `CLIENT_URL` to your frontend public URL/IP.
4. Run:

   ```bash
   docker-compose up -d --build
   ```

5. Ensure that security groups in AWS permit traffic on port `3000` (client) and `3001` (server).
