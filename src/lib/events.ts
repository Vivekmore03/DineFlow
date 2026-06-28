import { EventEmitter } from "events";

const globalForEvents = globalThis as unknown as { eventEmitter: EventEmitter };

export const eventEmitter = globalForEvents.eventEmitter || new EventEmitter();

// Set high limit to support many concurrent dashboard connections
eventEmitter.setMaxListeners(200);

if (process.env.NODE_ENV !== "production") {
  globalForEvents.eventEmitter = eventEmitter;
}

export const EVENTS = {
  ORDER_CREATED: "order_created",
  ORDER_UPDATED: "order_updated",
  WAITER_CALL: "waiter_call",
  BILL_REQUEST: "bill_request",
  BILL_GENERATED: "bill_generated",
  BILL_PAID: "bill_paid",
  SESSION_UPDATED: "session_updated"
};
