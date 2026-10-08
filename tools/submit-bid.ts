import { Type } from "@earendil-works/pi-ai";
import { defineTool } from "@earendil-works/pi-coding-agent";

export const SUBMIT_BID_TOOL_NAME = "submit_bid";

export type AgentBid = {
	bid: number;
	opinion: string;
	reason: string;
};

export const submitBidTool = defineTool({
	name: SUBMIT_BID_TOOL_NAME,
	label: "Submit bid",
	description: "Submit your final credit bid, opinion, and a reason defending it for a task.",
	promptGuidelines: [
		"Use submit_bid as your only action: call it once with your final bid, opinion, and reason.",
		"After calling submit_bid, do not send another assistant message in the same turn.",
		"Bid must be a non-negative integer not exceeding your available credits.",
	],
	parameters: Type.Object({
		bid: Type.Number({ description: "Credits to bid for this task" }),
		opinion: Type.String({ description: "Your opinion on the task and how you would approach it" }),
		reason: Type.String({ description: "A strong argument defending your opinion and bid" }),
	}),

	async execute(_toolCallId, params) {
		return {
			content: [{ type: "text", text: `Bid ${params.bid} credits.` }],
			details: params satisfies AgentBid,
			terminate: true,
		};
	},
});
