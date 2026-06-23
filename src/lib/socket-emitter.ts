const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
const SOCKET_SECRET = process.env.SOCKET_SECRET || "change-me-socket-secret";

/**
 * Emit a socket event through the standalone Socket.IO server webhook bridge.
 * 
 * @param room Multi-tenant isolated room name (e.g. 'restaurant:123')
 * @param event Event type string (e.g. 'order_created')
 * @param data Payload data object
 */
export async function emitSocketEvent(room: string, event: string, data: any): Promise<boolean> {
  try {
    const res = await fetch(`${SOCKET_URL}/api/internal/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: SOCKET_SECRET,
        room,
        event,
        data,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error(`[Socket Emitter] [Failed] "${event}" to "${room}". Response status: ${res.status}`, errData);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[Socket Emitter] [Connection Error] Failed to connect to Socket.IO server at ${SOCKET_URL}:`, err);
    return false;
  }
}
