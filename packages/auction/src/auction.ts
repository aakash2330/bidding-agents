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
import { agentPersonas } from "./personas/load.ts";

const INITIAL_CREDITS = 1000;

export enum AgentPersonality {
    DESIGNER = "designer",
    ENGINEER = "engineer",
    MARKETER = "marketer",
}

type Task = {
    title: string;
    description: string;
}

export type TaskWithAgentOpinions = Task & {
    agentsOpinions: Record<AgentPersonality, AgentOpinion>;
}

type AgentOpinion = AgentBid;

function buildAuctionBrief(
    goal: string,
    participants: AgentPersonality[],
    lotTitles: string[],
): string {
    const roster = participants
        .map((role) => `- ${role}: ${agentPersonas[role].summary}`)
        .join("\n");
    const lots = lotTitles.map((title, i) => `${i + 1}. ${title}`).join("\n");
    return [
        "## Auction",
        `Goal: ${goal}`,
        "",
        "Ordered lots are auctioned one at a time. Each lot: submit_bid, then see every bidder's bids, then submit_bid again.",
        `Your final bid for a lot is deducted from your balance. Starting balance: ${INITIAL_CREDITS} credits across all lots.`,
        "",
        "Participants:",
        roster,
        "",
        "Lots (full brief when each lot opens):",
        lots,
    ].join("\n");
}

class Agent {
    private auctionBrief = "";
    private sessionStarted = false;

    constructor(
        private readonly sessionId: string,
        public readonly personality: AgentPersonality,
        private credits: number,
    ) {
    }

    setAuctionBrief(brief: string): void {
        this.auctionBrief = brief;
    }

    public async bid(task: Task): Promise<AgentOpinion> {
        return this.submitBid("Submit your bid with a one-line opinion and one-line reason.", task);
    }

    public async verify(
        agentsOpinions: Record<AgentPersonality, AgentOpinion>,
    ): Promise<AgentOpinion> {
        const summary = Object.entries(agentsOpinions)
            .map(([personality, { bid, opinion, reason }]) =>
                `- ${personality}: ${bid} credits — ${opinion} | ${reason}`)
            .join("\n");
        return this.submitBid(
            [
                "All agents' bids for this task:",
                summary,
                "",
                "Review the full list. Submit your bid again if you want to change it, or the same bid if you stand by your decision.",
            ].join("\n"),
        );
    }

    private async submitBid(instruction: string, task?: Task): Promise<AgentOpinion> {
        const promptParts: string[] = [];
        if (!this.sessionStarted) {
            promptParts.push(
                agentPersonas[this.personality].prompt,
                this.auctionBrief,
                "",
            );
        }
        promptParts.push(`You have ${this.credits} credits available.`);
        if (task) {
            promptParts.push("", `Task: ${task.title}`, task.description);
        }
        promptParts.push("", instruction);
        const { reply } = await runPiAgentTurn(promptParts.join("\n"), {
            cwd: DEMO_PROJECT_CWD,
            sessionId: this.sessionId,
            resume: this.sessionStarted,
            persona: this.personality,
            customTools: [submitBidTool],
            returnTool: SUBMIT_BID_TOOL_NAME,
        });
        this.sessionStarted = true;
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
        this.tasks = await this.planTask(this.input, agentPersonalities);
        const brief = buildAuctionBrief(
            this.input,
            agentPersonalities,
            this.tasks.map((t) => t.title),
        );
        for (const agent of this.agents) {
            agent.setAuctionBrief(brief);
        }
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
                (agent) => agent.verify(task.agentsOpinions),
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


    private async planTask(
        taskDescription: string,
        participants: AgentPersonality[],
    ): Promise<TaskWithAgentOpinions[]> {
        const bidderRoles = participants
            .map((role) => `- ${role}: ${agentPersonas[role].summary}`)
            .join("\n");
        const { reply } = await runPiAgentTurn(
            [
                "You are the auction planner for a small product team.",
                "Break the goal below into ordered auction lots (one bid round per lot).",
                "",
                "Bidders (each lot is shown to all of them; they bid credits and argue for their approach):",
                bidderRoles,
                "",
                "Each lot is a clear task brief: enough context to act on, without prescribing how bidders must solve it.",
                "You may name open judgment calls as questions only — no answer options; bidders supply their own opinions.",
                "Explore the repo with your tools when the goal depends on what is already there.",
                "",
                "Goal:",
                taskDescription,
            ].join("\n"),
            {
                cwd: DEMO_PROJECT_CWD,
                persona: "planner",
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
