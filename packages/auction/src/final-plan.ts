import { AGENT_ROLES, type TaskWithAgentOpinions } from "./types.ts";

export function buildFinalPlan(tasks: TaskWithAgentOpinions[]): string {
	return tasks
		.map((task, index) => {
			const winner = AGENT_ROLES.reduce((best, role) =>
				task.agentsOpinions[role].bid > task.agentsOpinions[best].bid ? role : best,
			);
			const { bid, opinion } = task.agentsOpinions[winner];
			return `${index + 1}. ${task.title} — ${winner} (${bid} credits): ${opinion}`;
		})
		.join("\n");
}
