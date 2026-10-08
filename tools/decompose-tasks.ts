import { Type } from "@earendil-works/pi-ai";
import { defineTool } from "@earendil-works/pi-coding-agent";

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
	description: "Break a goal into an ordered list of concrete tasks.",
	promptGuidelines: [
		"Use decompose_tasks as your only action: call it once with the full breakdown.",
		"After calling decompose_tasks, do not send another assistant message in the same turn.",
	],
	parameters: Type.Object({
		tasks: Type.Array(
			Type.Object({
				title: Type.String({ description: "Short task title" }),
				description: Type.String({ description: "What to do" }),
			}),
			{ minItems: 1, description: "Ordered list of tasks" },
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
