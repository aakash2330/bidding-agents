import { AgentPersonality, Auction } from "./auction.ts";

const goal =
    process.argv.slice(2).join(" ").trim() ||
    "create a landing page for a barber shop";

console.log(`Goal: ${goal}\n`);

const auction = new Auction(goal);
await auction.initialize([
    AgentPersonality.DESIGNER,
    AgentPersonality.ENGINEER,
    AgentPersonality.MARKETER,
]);

console.log("\nAuction\n");
await auction.startAuction();
