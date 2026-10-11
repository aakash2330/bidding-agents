import { createAuctionEventQueue, runAuction } from "./run-auction.ts";

const goal =
	process.argv.slice(2).join(" ").trim() ||
	"create a landing page for a barber shop";

const queue = createAuctionEventQueue();
void runAuction(goal, queue);
