import {
  createAuctionEventQueue,
  runAuction,
  type AuctionEventQueue,
} from "@bidding-agents/auction/run";

type AuctionRun = {
  queue: AuctionEventQueue;
  run: Promise<void>;
};

const runs = new Map<string, AuctionRun>();

export function startAuctionRun(problem: string): string {
  const id = crypto.randomUUID();
  const queue = createAuctionEventQueue();
  const run = runAuction(problem, queue);
  runs.set(id, { queue, run });
  return id;
}

export function getAuctionRun(id: string): AuctionRun | undefined {
  return runs.get(id);
}

export function endAuctionRun(id: string): void {
  runs.delete(id);
}
