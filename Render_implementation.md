# Render Backend Deployment & Connection Guide

Congratulations on successfully building the backend on Render! This guide explains the problem of connecting your frontend client to the deployed backend and provides the exact code/configuration solutions.

---

## 1. The Problem Explained

When running locally:

- Both client (`localhost:3002`) and server (`localhost:3001`) run on the same machine.
- They communicate using `http://localhost:3001`.

When deployed to Render:

- Your backend is hosted on a public URL (e.g., `https://vidchat-server.onrender.com`).
- Next.js compiles the frontend. If the frontend doesn't know the Render URL, it will fail to connect or attempt to connect to `localhost:3001` (which doesn't exist on the user's browser).
- **CORS (Cross-Origin Resource Sharing)**: The backend server restricts requests to only allowed domains. If your backend's `CLIENT_URL` is still set to `http://localhost:3002`, it will block requests coming from your production frontend URL.

---

## 2. The Solution

To connect them, you need to configure **Environment Variables** for both the client and the server.

### A. Client Configuration (Next.js)

Your client code already dynamically uses the environment variable `NEXT_PUBLIC_API_URL` to connect to the backend (in `videocall-client/src/lib/socket.ts` and `videocall-client/src/lib/proxy.ts`):

```typescript
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
```

#### What to do

When deploying your frontend (e.g., to Vercel, Netlify, or AWS), or running it locally against the Render backend, set this environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com
```

In Next.js, variables prefixed with `NEXT_PUBLIC_` are bundled into the browser client-side code during build time.

---

### B. Server Configuration (Render Environment)

Your backend code uses the `CLIENT_URL` environment variable for CORS (in `server/src/server.ts`):

```typescript
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";
app.use(cors({ origin: CLIENT_URL }));
```

#### What to do on Render Dashboard

1. Go to your **Render Dashboard** -> Select your **Web Service** (Server).
2. Click on **Environment** in the left sidebar.
3. Add/Edit the following Environment Variable:
   - **Key**: `CLIENT_URL`
   - **Value**: `http://localhost:3002` (if you are running the frontend locally) or `https://your-frontend-domain.vercel.app` (if your frontend is deployed).
4. Save the changes. Render will automatically redeploy the service with the new configuration.

---

## 3. Local Client Connecting to Render Backend (Testing)

If you want to run your client locally but have it connect to the live Render backend:

1. Create/update a file named `.env.local` inside the `videocall-client` directory:

   ```env
   NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com
   ```

2. Run your local client:

   ```bash
   cd videocall-client
   npm run dev
   ```

   Now, your local client will communicate directly with the live server hosted on Render!
