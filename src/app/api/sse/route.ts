import { NextResponse } from "next/server";
import { eventEmitter } from "@/lib/eventEmitter";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      controller.enqueue(encoder.encode(`data: connected\n\n`));

      const onUpdate = () => {
        try {
          controller.enqueue(encoder.encode(`data: update\n\n`));
        } catch (e) {
           // Controller might be closed
        }
      };

      eventEmitter.on("queue_updated", onUpdate);

      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:\n\n`));
        } catch (e) {
          clearInterval(interval);
        }
      }, 30000);

      req.signal.addEventListener("abort", () => {
        eventEmitter.off("queue_updated", onUpdate);
        clearInterval(interval);
        try { controller.close(); } catch(e){}
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
