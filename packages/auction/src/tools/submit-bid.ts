import type { AgentBid } from "../types";
import { defineTool, Type } from "@bidding-agents/pi";

export const SUBMIT_BID_TOOL_NAME = "submit_bid";

export type { AgentBid };

export const submitBidTool = defineTool({
	name: SUBMIT_BID_TOOL_NAME,
	label: "Submit bid",
	description: "Submit your final credit bid plus your opinion and reason.",
	promptGuidelines: [
		"Call submit_bid once when ready; you may use read/grep/find/ls first if the lot depends on the repo.",
		"opinion and reason may be as long as the lot needs — argue your case properly, no length cap.",
		"Bid must be a non-negative integer not exceeding your available credits.",
	],
	parameters: Type.Object({
		bid: Type.Number({ description: "Credits to bid for this task" }),
		opinion: Type.String({
			description: "How you would do this task from your role",
		}),
		reason: Type.String({
			description: "Why your role should own this lot and why your bid is fair",
		}),
	}),

	async execute(_toolCallId, params) {
		return {
			content: [{ type: "text", text: `Bid ${params.bid} credits.` }],
			details: params satisfies AgentBid,
			terminate: true,
		};
	},
});
