import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

// Load environment variables manually from .env.local and .env
function loadEnv() {
  const envPaths = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const index = trimmed.indexOf("=");
        if (index === -1) return;
        const key = trimmed.substring(0, index).trim();
        let val = trimmed.substring(index + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      });
    }
  }
}
loadEnv();

// Fail startup if JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: Environment variable JWT_SECRET is missing.");
}

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.SOCKET_PORT || 3001;
const SECRET = process.env.SOCKET_SECRET || "change-me-socket-secret";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Create native Node HTTP server
const httpServer = createServer((req, res) => {
  // CORS Headers for internal Next.js server actions / API calls
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Webhook endpoint to allow Next.js server actions/API routes to emit events
  if (req.method === "POST" && req.url === "/api/internal/emit") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        const { secret, room, event, data } = parsed;

        if (secret !== SECRET) {
          console.warn(`[Socket.IO Server] [BLOCKED] Unauthorized emit attempt from IP: ${req.socket.remoteAddress}`);
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unauthorized" }));
          return;
        }

        if (!room || !event) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing room or event" }));
          return;
        }

        // Broadcast to specific room
        io.to(room).emit(event, data);
        console.log(`[Socket.IO Server] [EMIT] Event "${event}" broadcasted to room "${room}". Payload keys:`, Object.keys(data || {}));

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error("[Socket.IO Server] Error processing emit webhook:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

// Configure Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: [APP_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connection token verification middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    console.warn(`[Socket.IO Server] Connection rejected: No token provided (socket ID: ${socket.id})`);
    return next(new Error("Authentication error: Token required"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      role: "staff" | "customer";
      restaurantId: string;
      tableId?: string;
      userId?: string;
    };

    if (!decoded.role || !decoded.restaurantId) {
      console.warn(`[Socket.IO Server] Connection rejected: Invalid token claims (socket ID: ${socket.id})`);
      return next(new Error("Authentication error: Invalid token claims"));
    }

    socket.data = {
      role: decoded.role,
      restaurantId: decoded.restaurantId,
      tableId: decoded.tableId,
      userId: decoded.userId,
    };
    next();
  } catch (error) {
    console.warn(`[Socket.IO Server] Connection rejected: Invalid token (socket ID: ${socket.id})`);
    return next(new Error("Authentication error: Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket.IO Server] Client connected: ${socket.id} (Role: ${socket.data.role}, Restaurant: ${socket.data.restaurantId})`);

  // Room assignment based on verified token payload
  socket.on("join-room", () => {
    const { role, restaurantId, tableId } = socket.data;

    if (!restaurantId) {
      console.warn(`[Socket.IO Server] [ROOM REJECTED] Client ${socket.id} has no restaurantId in token`);
      return;
    }

    if (role === "staff") {
      const roomName = `restaurant:${restaurantId}`;
      socket.join(roomName);
      console.log(`[Socket.IO Server] [ROOM JOIN] Staff ${socket.id} joined: "${roomName}"`);
    } else if (role === "customer") {
      if (tableId) {
        const tableRoom = `restaurant:${restaurantId}:table:${tableId}`;
        socket.join(tableRoom);
        console.log(`[Socket.IO Server] [ROOM JOIN] Customer ${socket.id} joined: "${tableRoom}"`);
      } else {
        console.warn(`[Socket.IO Server] [ROOM REJECTED] Customer ${socket.id} lacks tableId in token`);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.IO Server] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Socket.IO Standalone Server running on port ${PORT}`);
  console.log(`CORS allowed origin: ${APP_URL}`);
  console.log(`======================================================\n`);
});
