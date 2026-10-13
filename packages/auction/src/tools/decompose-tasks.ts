import { defineTool, Type } from "@bidding-agents/pi";

export const DECOMPOSE_TASKS_TOOL_NAME = "decompose_tasks";

export type DecomposedTask = {
	title: string;
	description: string;
};

export type TaskDecomposition = {
	tasks: DecomposedTask[];
};

export const decomposeTasksTool = defineTool({
	name: DECOMPOSE_TASKS_TOOL_NAME,
	label: "Decompose tasks",
	description:
		"Break a product goal into ordered auction lots. Each lot is one bid round for designer, engineer, and marketer agents.",
	promptGuidelines: [
		"Use read/grep/find/ls on the repo first when the goal touches existing code.",
		"Use decompose_tasks as your only action: call it once with the full breakdown.",
		"After calling decompose_tasks, do not send another assistant message in the same turn.",
		"Each task description is shown verbatim to bidders. Write one concise brief: what to deliver, how to approach it (steps, files, stack, constraints), and any judgment calls still open.",
		"Do not list answer options or multiple-choice paths — bidders will propose their own opinions on how to handle ambiguity.",
		"Order tasks so later lots can assume earlier outcomes. Prefer fewer, sharper lots over a long chore list.",
	],
	parameters: Type.Object({
		tasks: Type.Array(
			Type.Object({
				title: Type.String({ description: "Short lot title for the auction round" }),
				description: Type.String({
					description:
						"Full task brief for bidders: scope, instructions, context. They bid and share their own implementation opinions.",
				}),
			}),
			{ minItems: 1, description: "Ordered auction lots" },
		),
	}),

	async execute(_toolCallId, params) {
		return {
			content: [{ type: "text", text: `Planned ${params.tasks.length} task(s).` }],
			details: params satisfies TaskDecomposition,
			terminate: true,
		};
	},
});
