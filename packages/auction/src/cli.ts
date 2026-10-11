import { AGENT_ROLES } from "@bidding-agents/shared";
import { Auction } from "./auction.ts";

const goal =
    process.argv.slice(2).join(" ").trim() ||
    "create a landing page for a barber shop";

const auction = new Auction(goal);
await auction.initialize([...AGENT_ROLES]);
await auction.startAuction();
