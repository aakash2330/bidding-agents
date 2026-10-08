import { runPiAgent } from "./pi.ts";
import {
    DECOMPOSE_TASKS_TOOL_NAME,
    decomposeTasksTool,
    type TaskDecomposition,
} from "./tools/decompose-tasks.ts";

const INITIAL_CREDITS = 1000;

enum AgentPersonality {
    DESIGNER = "designer",
    ENGINEER = "engineer",
    MARKETER = "marketer",
}

type Agent = {
    personality: AgentPersonality;
    credits: number;
}

type Task = {
    title: string;
    description: string;
    agentsOpinions: Record<AgentPersonality, { bid: number, opinion: string }>;
}

class Auction {
    private readonly agents: Agent[];
    private readonly taskDescription: string;
    private readonly tasks: Task[];

    constructor(input: string, agentPersonalities: AgentPersonality[]) { }

    private async planTask(): Promise<Tasks> {
        const { tasks } = await runPiAgent(
            `Break this goal into concrete, ordered tasks:\n\n${this.taskDescription}`,
            {
                customTools: [decomposeTasksTool],
                returnTool: DECOMPOSE_TASKS_TOOL_NAME,
            },
        ) as TaskDecomposition;

        return tasks.map(task => ({
            title: task.title,
            description: task.description,
            agentsChoices: Object.fromEntries(this.agents.map(agent => [agent.personality, { bid: 0, opinion: "" }])) as Record<AgentPersonality, { bid: number, opinion: string }>,
        }));
    }
}
