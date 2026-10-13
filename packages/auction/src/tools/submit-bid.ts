import type { AgentBid } from "../types";
import { defineTool, Type } from "@bidding-agents/pi";

export const SUBMIT_BID_TOOL_NAME = "submit_bid";

export type { AgentBid };

const LINE_MAX = 240;

export const submitBidTool = defineTool({
	name: SUBMIT_BID_TOOL_NAME,
	label: "Submit bid",
	description: "Submit your final credit bid plus one-line opinion and one-line reason.",
	promptGuidelines: [
		"Call submit_bid once when ready; you may use read/grep/find/ls first if the lot depends on the repo.",
		"opinion and reason must each be a single line (no newlines); keep them short.",
		"Bid must be a non-negative integer not exceeding your available credits.",
	],
	parameters: Type.Object({
		bid: Type.Number({ description: "Credits to bid for this task" }),
		opinion: Type.String({
			description: "One line: how you would do this task from your role",
			maxLength: LINE_MAX,
			pattern: "^[^\n\r]*$",
		}),
		reason: Type.String({
			description: "One line: why your role should own this lot and why your bid is fair",
			maxLength: LINE_MAX,
			pattern: "^[^\n\r]*$",
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
