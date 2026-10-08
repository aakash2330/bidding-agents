import { DEMO_PROJECT_CWD, runPiAgentTurn } from "./pi.ts";
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

export enum AgentPersonality {
    DESIGNER = "designer",
    ENGINEER = "engineer",
    MARKETER = "marketer",
}

const agentPersonalitiesDescriptions = {
    [AgentPersonality.DESIGNER]: "A designer who is responsible for the design of the product.",
    [AgentPersonality.ENGINEER]: "An engineer who is responsible for the engineering of the product.",
    [AgentPersonality.MARKETER]: "A marketer who is responsible for the marketing of the product.",
}

type Task = {
    title: string;
    description: string;
}

export type TaskWithAgentOpinions = Task & {
    agentsOpinions: Record<AgentPersonality, AgentOpinion>;
}

type AgentOpinion = AgentBid;

class Agent {
    constructor(
        private readonly sessionId: string,
        public readonly personality: AgentPersonality,
        private credits: number,
    ) {
    }

    public async bid(task: Task): Promise<AgentOpinion> {
        return this.submitBid(
            task,
            "Submit your final bid, opinion, and a strong reason defending your opinion for this task.",
            false,
        );
    }

    public async verify(
        task: Task,
        agentsOpinions: Record<AgentPersonality, AgentOpinion>,
    ): Promise<AgentOpinion> {
        const summary = Object.entries(agentsOpinions)
            .map(([personality, { bid, opinion, reason }]) =>
                `- ${personality}: ${bid} credits — ${opinion}\n  Reason: ${reason}`)
            .join("\n");
        const mine = agentsOpinions[this.personality];
        return this.submitBid(
            task,
            [
                "All agents' bids for this task:",
                summary,
                "",
                `Your previous bid: ${mine.bid} credits — ${mine.opinion}`,
                `Your previous reason: ${mine.reason}`,
                "",
                "Review the full list. Submit your bid again if you want to change it, or the same bid if you stand by your decision.",
            ].join("\n"),
            true,
        );
    }

    private async submitBid(task: Task, instruction: string, resume: boolean): Promise<AgentOpinion> {
        const { reply } = await runPiAgentTurn(
            [
                `You are ${agentPersonalitiesDescriptions[this.personality]}`,
                `You have ${this.credits} credits available.`,
                "",
                `Task: ${task.title}`,
                task.description,
                "",
                instruction,
            ].join("\n"),
            {
                cwd: DEMO_PROJECT_CWD,
                sessionId: this.sessionId,
                resume,
                customTools: [submitBidTool],
                returnTool: SUBMIT_BID_TOOL_NAME,
            },
        );
        const opinion = reply as AgentOpinion;
        if (!Number.isInteger(opinion.bid) || opinion.bid < 0 || opinion.bid > this.credits) {
            throw new Error(
                `Invalid bid ${opinion.bid} for ${this.personality}; ${this.credits} credits available`,
            );
        }
        return opinion;
    }

    public deductCredits(amount: number): void {
        this.credits -= amount;
    }
}

export class Auction {
    private input: string = "";
    private agents: Agent[] = [];
    private tasks: TaskWithAgentOpinions[] = [];

    constructor(
        input: string,
    ) {
        this.input = input;
    }

    public async initialize(agentPersonalities: AgentPersonality[]): Promise<void> {
        this.agents = this.createAgents(agentPersonalities);
        console.log(`Agents: ${agentPersonalities.join(", ")}`);
        console.log("Decomposing goal into tasks…");
        this.tasks = await this.planTask(this.input);
        console.log(`${this.tasks.length} task(s):`);
        for (const t of this.tasks) {
            console.log(`  • ${t.title}`);
        }
    }


    public async startAuction(): Promise<TaskWithAgentOpinions[]> {
        for (const [i, task] of this.tasks.entries()) {
            console.log(`\n[${i + 1}/${this.tasks.length}] ${task.title}`);
            await this.collectOpinions(task, "Initial bids", (agent) => agent.bid(task));
            await this.collectOpinions(
                task,
                "Verification",
                (agent) => agent.verify(task, task.agentsOpinions),
                true,
            );
        }
        return this.tasks;
    }

    private createAgents(agentPersonalities: AgentPersonality[]): Agent[] {
        return agentPersonalities.map(personality => new Agent(crypto.randomUUID(), personality, INITIAL_CREDITS));
    }

    private async collectOpinions(
        task: TaskWithAgentOpinions,
        phase: string,
        ask: (agent: Agent) => Promise<AgentOpinion>,
        deductCredits = false,
    ): Promise<void> {
        console.log(`  ${phase}:`);
        const entries = await Promise.all(
            this.agents.map(async (agent) => {
                const opinion = await ask(agent);
                console.log(`    ${agent.personality}: ${opinion.bid} credits — ${opinion.opinion}`);
                return [agent.personality, opinion] as const;
            }),
        );
        task.agentsOpinions = Object.fromEntries(entries) as Record<AgentPersonality, AgentOpinion>;
        if (deductCredits) {
            for (const agent of this.agents) {
                agent.deductCredits(task.agentsOpinions[agent.personality].bid);
            }
        }
    }


    private async planTask(taskDescription: string): Promise<TaskWithAgentOpinions[]> {
        const { reply } = await runPiAgentTurn(
            `Break this goal into concrete, ordered tasks:\n\n${taskDescription}`,
            {
                cwd: DEMO_PROJECT_CWD,
                customTools: [decomposeTasksTool],
                returnTool: DECOMPOSE_TASKS_TOOL_NAME,
            },
        );
        const { tasks } = reply as TaskDecomposition;

        return tasks.map(task => ({
            title: task.title,
            description: task.description,
            agentsOpinions: Object.fromEntries(
                this.agents.map(agent => [agent.personality, { bid: 0, opinion: "", reason: "" }]),
            ) as Record<AgentPersonality, AgentBid>,
        }));
    }
}
