import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useKitchenStore } from "./use-kitchen-store";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

/**
 * Custom React hook to establish and manage a Socket.IO connection.
 * Automatically joins the appropriate multi-tenant isolated rooms on connect.
 * 
 * @param restaurantId Scoped restaurant tenant ID
 * @param role Client role ('staff' or 'customer')
 * @param tableId Physical dining table ID (for customers)
 */
export function useSocket(
  restaurantId: string | null,
  role: "staff" | "customer",
  tableId?: string
) {
  const socketRef = useRef<Socket | null>(null);
  const { setSseConnected } = useKitchenStore();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;

    console.log(`[Socket.IO Client] Initializing socket connection to ${SOCKET_URL}...`);
    setSseConnected("connecting");

    // Establish WebSocket connection with dynamic auth token fetch
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      auth: (cb) => {
        const fetchToken = async () => {
          try {
            let res;
            if (role === "staff") {
              res = await fetch("/api/auth/socket-token");
            } else {
              const sessionToken = localStorage.getItem(`qrd_session_${tableId}`);
              if (!sessionToken) {
                console.warn("[Socket.IO Client] No active session token found for table");
                cb({});
                return;
              }
              res = await fetch("/api/customer/socket-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionToken,
                  restaurantId,
                  tableId,
                }),
              });
            }

            if (!res.ok) {
              console.error("[Socket.IO Client] Failed to fetch socket token", res.status);
              cb({});
              return;
            }

            const data = await res.json();
            cb({ token: data.token });
          } catch (err) {
            console.error("[Socket.IO Client] Error fetching socket token", err);
            cb({});
          }
        };
        fetchToken();
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[Socket.IO Client] Connected successfully (ID: ${socket.id})`);
      setSseConnected("connected");
      setConnected(true);

      // Join tenant-isolated room
      socket.emit("join-room");
      console.log(`[Socket.IO Client] Emitted join-room`);
    });

    socket.on("disconnect", (reason) => {
      console.warn(`[Socket.IO Client] Disconnected from server. Reason: ${reason}`);
      setSseConnected("disconnected");
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket.IO Client] Connection error:", err.message);
      setSseConnected("connecting");
      setConnected(false);
    });

    return () => {
      console.log("[Socket.IO Client] Cleaning up socket connection...");
      socket.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [restaurantId, role, tableId, setSseConnected]);

  return { socket: socketRef.current, connected };
}
