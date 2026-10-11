import {
  createAuctionEventQueue,
  isTerminalAuctionEvent,
  runAuction,
} from "@bidding-agents/auction/run";

function sseLine(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { problem?: string };
  const problem = String(body.problem ?? "").trim();
  if (!problem) {
    return new Response(JSON.stringify({ error: "Problem is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const queue = createAuctionEventQueue();
      const run = runAuction(problem, queue);

      const onAbort = () => queue.close();
      request.signal.addEventListener("abort", onAbort, { once: true });

      try {
        while (true) {
          const event = await queue.take();
          if (event === null) break;
          try {
            controller.enqueue(sseLine(event));
          } catch {
            queue.close();
            break;
          }
          if (isTerminalAuctionEvent(event)) break;
        }
      } finally {
        request.signal.removeEventListener("abort", onAbort);
        await run;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
