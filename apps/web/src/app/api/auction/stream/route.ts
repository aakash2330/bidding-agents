import { runAuctionStream } from "@bidding-agents/auction/stream";

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
      try {
        for await (const event of runAuctionStream(problem)) {
          controller.enqueue(sseLine(event));
        }
      } catch (error) {
        controller.enqueue(
          sseLine({
            type: "error",
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      } finally {
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
