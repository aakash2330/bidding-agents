import {
  isTerminalAuctionEvent,
  type AuctionEvent,
} from "@bidding-agents/auction/run";

import {
  endAuctionRun,
  getAuctionRun,
  startAuctionRun,
} from "@/server/auction-runs";

function sseChunk(event: AuctionEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as { problem?: string };
  const problem = String(body.problem ?? "").trim();
  if (!problem) {
    return Response.json({ error: "Problem is required" }, { status: 400 });
  }

  const id = startAuctionRun(problem);
  return Response.json({ id });
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const auctionRun = getAuctionRun(id);
  if (!auctionRun) {
    return Response.json({ error: "Unknown auction run" }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const { queue, run } = auctionRun;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const event = await queue.take();
          if (event === null) break;
          controller.enqueue(encoder.encode(sseChunk(event)));
          if (isTerminalAuctionEvent(event)) break;
        }
      } finally {
        await run;
        endAuctionRun(id);
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
