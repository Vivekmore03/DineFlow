import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { eventEmitter, EVENTS } from "@/lib/events";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ restaurantId: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { restaurantId } = await params;

    // Verify token from request. cookies are automatically transmitted.
    const user = await getAuthUser(request);
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (user.restaurantId !== restaurantId) {
      return new Response("Forbidden", { status: 403 });
    }

    const responseStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        const emitEvent = (eventName: string, data: any) => {
          try {
            controller.enqueue(
              encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch (e) {
            // Stream might already be closed/aborted
            cleanup();
          }
        };

        const onOrderCreated = (data: any) => {
          if (data.restaurantId === restaurantId) {
            emitEvent("order_created", data.order);
          }
        };

        const onOrderUpdated = (data: any) => {
          if (data.restaurantId === restaurantId) {
            emitEvent("order_updated", data.order);
          }
        };

        const onWaiterCall = (data: any) => {
          if (data.restaurantId === restaurantId) {
            emitEvent("waiter_call", data.waiterCall);
          }
        };

        const onBillRequest = (data: any) => {
          if (data.restaurantId === restaurantId) {
            emitEvent("bill_request", data.billRequest);
          }
        };

        // Register event listeners
        eventEmitter.on(EVENTS.ORDER_CREATED, onOrderCreated);
        eventEmitter.on(EVENTS.ORDER_UPDATED, onOrderUpdated);
        eventEmitter.on(EVENTS.WAITER_CALL, onWaiterCall);
        eventEmitter.on(EVENTS.BILL_REQUEST, onBillRequest);

        // Send confirmation of successful connection
        emitEvent("connected", { status: "ready" });

        // Keep connection alive with pings every 20 seconds to prevent proxy timeouts
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode("event: ping\ndata: {}\n\n"));
          } catch (e) {
            cleanup();
          }
        }, 20000);

        const cleanup = () => {
          clearInterval(pingInterval);
          eventEmitter.off(EVENTS.ORDER_CREATED, onOrderCreated);
          eventEmitter.off(EVENTS.ORDER_UPDATED, onOrderUpdated);
          eventEmitter.off(EVENTS.WAITER_CALL, onWaiterCall);
          eventEmitter.off(EVENTS.BILL_REQUEST, onBillRequest);
          try {
            controller.close();
          } catch (_) {}
        };

        // Clean up resources if client disconnects (tab closed, navigated away, etc.)
        request.signal.addEventListener("abort", cleanup);
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("SSE Route error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
