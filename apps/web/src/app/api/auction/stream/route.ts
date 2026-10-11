import {
  createAuctionEventQueue,
  isTerminalAuctionEvent,
  runAuction,
} from "@bidding-agents/auction/run";

export async function POST(request: Request) {
  const body = (await request.json()) as { problem?: string };
  const problem = String(body.problem ?? "").trim();
  if (!problem) {
    return Response.json({ error: "Problem is required" }, { status: 400 });
  }

  const queue = createAuctionEventQueue();
  const run = runAuction(problem, queue);

  while (true) {
    const event = await queue.take();
    if (event === null) break;
    console.log("[auction stream]", JSON.stringify(event));
    if (isTerminalAuctionEvent(event)) break;
  }

  await run;
  return Response.json({ ok: true });
}
