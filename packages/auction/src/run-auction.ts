import { Auction } from "./auction.ts";
import { createAsyncQueue, type AsyncQueue } from "./async-queue.ts";
import {
	AGENT_ROLES,
	AuctionEventType,
	type AgentRole,
	type AuctionEvent,
} from "./types.ts";

export type { AuctionEvent, TaskWithAgentOpinions } from "./types.ts";
export { isTerminalAuctionEvent } from "./types.ts";
export type { AsyncQueue } from "./async-queue.ts";
export { createAsyncQueue } from "./async-queue.ts";

export type AuctionEventQueue = AsyncQueue<AuctionEvent>;

export function createAuctionEventQueue(): AuctionEventQueue {
	return createAsyncQueue<AuctionEvent>();
}

export async function runAuction(
	goal: string,
	queue: AuctionEventQueue,
	roles: readonly AgentRole[] = AGENT_ROLES,
): Promise<void> {
	try {
		await new Auction(goal).run([...roles], (event) => queue.push(event));
	} catch (error) {
		queue.push({
			type: AuctionEventType.Error,
			message: error instanceof Error ? error.message : String(error),
		});
	} finally {
		queue.close();
	}
}

