import { runPiAgentTurn } from "./pi.ts";

const prompt = process.argv.slice(2).join(" ").trim() || "Say hello in one sentence.";

const { reply } = await runPiAgentTurn(prompt);
console.log(reply);
