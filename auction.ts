import { runPiAgentTurn } from "./pi.ts";
import {
    DECOMPOSE_TASKS_TOOL_NAME,
    decomposeTasksTool,
    type TaskDecomposition,
} from "./tools/decompose-tasks.ts";
import {
    SUBMIT_BID_TOOL_NAME,
    submitBidTool,
    type AgentBid,
} from "./tools/submit-bid.ts";

const INITIAL_CREDITS = 1000;

enum AgentPersonality {
    DESIGNER = "designer",
    ENGINEER = "engineer",
    MARKETER = "marketer",
}

const agentPersonalitiesDescriptions = {
    [AgentPersonality.DESIGNER]: "A designer who is responsible for the design of the product.",
    [AgentPersonality.ENGINEER]: "An engineer who is responsible for the engineering of the product.",
    [AgentPersonality.MARKETER]: "A marketer who is responsible for the marketing of the product.",
}

type Agent = {
    sessionId: string;
    personality: AgentPersonality;
    credits: number;
    personalityDescription: string;
}

type Task = {
    title: string;
    description: string;
}

type TaskWithAgentOpinions = Task & {
    agentsOpinions: Record<AgentPersonality, AgentOpinion>;
}

type AgentOpinion = AgentBid;

class Agent {
    constructor(
        private readonly sessionId: string = crypto.randomUUID(),
        private readonly personality: AgentPersonality,
        private readonly credits: number,
        private readonly personalityDescription: string,
    ) {
    }

    public async run(task: Task): Promise<AgentOpinion> {
        const { reply } = await runPiAgentTurn(
            [
                `You are ${this.personalityDescription}`,
                `You have ${this.credits} credits available.`,
                "",
                `Task: ${task.title}`,
                task.description,
                "",
                "Submit your final bid and opinion for this task.",
            ].join("\n"),
            {
                sessionId: this.sessionId,
                customTools: [submitBidTool],
                returnTool: SUBMIT_BID_TOOL_NAME,
            },
        );
        return reply as AgentOpinion;
    }
}

class Auction {
    private agents: Agent[] = [];
    private tasks: Task[] = [];

    constructor(
        private readonly input: string,
        private readonly agentPersonalities: AgentPersonality[],
    ) { }

    async initialize(): Promise<void> {
        this.agents = this.createAgents(this.agentPersonalities);
        this.tasks = await this.planTask(this.input);
    }

    private createAgents(agentPersonalities: AgentPersonality[]): Agent[] {
        return agentPersonalities.map(personality => ({
            sessionId: "",
            personality,
            credits: INITIAL_CREDITS,
            personalityDescription: agentPersonalitiesDescriptions[personality],
        }));
    }


    private function startAuction(): Promise<void> {
    }

    bidForTask(task: Task): Promise<void> {
    }

    verifyBids(): Promise<void> { }


    private async planTask(taskDescription: string): Promise<Task[]> {
        const { reply } = await runPiAgentTurn(
            `Break this goal into concrete, ordered tasks:\n\n${taskDescription}`,
            {
                customTools: [decomposeTasksTool],
                returnTool: DECOMPOSE_TASKS_TOOL_NAME,
            },
        );
        const { tasks } = reply as TaskDecomposition;

        return tasks.map(task => ({
            title: task.title,
            description: task.description,
            agentsOpinions: Object.fromEntries(
                this.agents.map(agent => [agent.personality, { bid: 0, opinion: "" }]),
            ) as Record<AgentPersonality, { bid: number, opinion: string }>,
        }));
    }
}
