import { AGENT_ROLES } from "./types";
import { Auction } from "./auction.ts";

const goal =
    process.argv.slice(2).join(" ").trim() ||
    "create a landing page for a barber shop";

for await (const _event of new Auction(goal).runStream([...AGENT_ROLES])) {
}
