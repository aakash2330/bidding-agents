import { Auction } from "./auction.ts";
import { AGENT_ROLES, type AgentRole, type AuctionEvent } from "./types.ts";

export type { AuctionEvent, TaskWithAgentOpinions } from "./types.ts";

export async function* runAuctionStream(
    goal: string,
    roles: readonly AgentRole[] = AGENT_ROLES,
): AsyncGenerator<AuctionEvent, void> {
    const auction = new Auction(goal);
    try {
        yield* auction.runStream([...roles]);
    } catch (error) {
        yield {
            type: "error",
            message: error instanceof Error ? error.message : String(error),
        };
    }
}
