import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPiAgentTurn } from "@bidding-agents/pi";
import {
    DECOMPOSE_TASKS_TOOL_NAME,
    decomposeTasksTool,
    type TaskDecomposition,
} from "./tools/decompose-tasks.ts";
import {
    AuctionEventType,
    AuctionRound,
    type AgentBid,
    type AgentRole,
    type AuctionEvent,
    type TaskWithAgentOpinions,
} from "./types";
import {
    SUBMIT_BID_TOOL_NAME,
    submitBidTool,
} from "./tools/submit-bid.ts";
import { agentPersonas } from "./personas/load.ts";
import { buildFinalPlan } from "./final-plan.ts";

const INITIAL_CREDITS = 1000;

const DEMO_PROJECT_CWD = join(dirname(fileURLToPath(import.meta.url)), "../../../apps/demo-project");

type Task = {
    title: string;
    description: string;
}

type AgentOpinion = AgentBid;

function buildAuctionBrief(
    goal: string,
    participants: AgentRole[],
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
        "Credits:",
        `- You have ${INITIAL_CREDITS} credits — one shared budget covering every lot in this plan.`,
        "- Unspent credits are worth nothing at the end: they are not banked, refunded, or rewarded. There is no prize for finishing with credits left, so do not hoard them.",
        "- Bid carefully but fully: for each lot, bid what that lot is actually worth to you, while keeping enough to compete for the lots you still want to win.",
        "- Plan to consume the entire budget across the plan — by the final lot, aim to have spent your credits in proportion to how much each lot mattered to you.",
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
    private remainingLots = 0;

    constructor(
        private readonly sessionId: string,
        public readonly personality: AgentRole,
        private credits: number,
    ) {
    }

    setAuctionBrief(brief: string): void {
        this.auctionBrief = brief;
    }

    setRemainingLots(count: number): void {
        this.remainingLots = count;
    }

    public async bid(task: Task): Promise<AgentOpinion> {
        return this.submitBid("Submit your bid with your opinion and reason.", task);
    }

    public async verify(
        agentsOpinions: Record<AgentRole, AgentOpinion>,
    ): Promise<AgentOpinion> {
        const summary = Object.entries(agentsOpinions)
            .map(([personality, { bid, opinion, reason }]) =>
                [
                    `### ${personality} — ${bid} credits`,
                    `Opinion: ${opinion}`,
                    `Reason: ${reason}`,
                ].join("\n"))
            .join("\n\n");
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
        const spent = INITIAL_CREDITS - this.credits;
        const lotsLeft = this.remainingLots === 1
            ? "this is the final lot; leftover credits have no value after it"
            : `${this.remainingLots} lots left including this one`;
        promptParts.push(
            `You have ${this.credits} credits available (of ${INITIAL_CREDITS} total; ${spent} spent so far; ${lotsLeft}).`,
        );
        if (task) {
            promptParts.push("", `Task: ${task.title}`, task.description);
        }
        promptParts.push("", instruction);
        const { reply } = await runPiAgentTurn(promptParts.join("\n"), {
            cwd: DEMO_PROJECT_CWD,
            sessionId: this.sessionId,
            resume: this.sessionStarted,
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

    public async run(
        agentPersonalities: AgentRole[],
        onEvent: (event: AuctionEvent) => void,
    ): Promise<TaskWithAgentOpinions[]> {
        onEvent({ type: AuctionEventType.PlanningStarted });
        this.agents = this.createAgents(agentPersonalities);
        this.tasks = await this.planTask(this.input, agentPersonalities);
        onEvent({
            type: AuctionEventType.TasksPlanned,
            tasks: this.tasks.map(({ title, description }) => ({
                title,
                description,
            })),
        });
        const brief = buildAuctionBrief(
            this.input,
            agentPersonalities,
            this.tasks.map((t) => t.title),
        );
        for (const agent of this.agents) {
            agent.setAuctionBrief(brief);
        }

        for (const [index, task] of this.tasks.entries()) {
            onEvent({
                type: AuctionEventType.LotStarted,
                index,
                title: task.title,
                description: task.description,
            });
            for (const agent of this.agents) {
                agent.setRemainingLots(this.tasks.length - index);
            }
            await this.collectOpinions(task, (agent) => agent.bid(task));
            onEvent({
                type: AuctionEventType.RoundComplete,
                index,
                round: AuctionRound.Initial,
                opinions: { ...task.agentsOpinions },
            });
            await this.collectOpinions(
                task,
                (agent) => agent.verify(task.agentsOpinions),
                true,
            );
            onEvent({
                type: AuctionEventType.RoundComplete,
                index,
                round: AuctionRound.Verify,
                opinions: { ...task.agentsOpinions },
            });
        }
        onEvent({
            type: AuctionEventType.Done,
            tasks: this.tasks,
            plan: buildFinalPlan(this.tasks),
        });
        return this.tasks;
    }

    private createAgents(agentPersonalities: AgentRole[]): Agent[] {
        return agentPersonalities.map(personality => new Agent(crypto.randomUUID(), personality, INITIAL_CREDITS));
    }

    private async collectOpinions(
        task: TaskWithAgentOpinions,
        ask: (agent: Agent) => Promise<AgentOpinion>,
        deductCredits = false,
    ): Promise<void> {
        const entries = await Promise.all(
            this.agents.map(async (agent) => {
                const opinion = await ask(agent);
                return [agent.personality, opinion] as const;
            }),
        );
        task.agentsOpinions = Object.fromEntries(entries) as Record<AgentRole, AgentOpinion>;
        if (deductCredits) {
            for (const agent of this.agents) {
                agent.deductCredits(task.agentsOpinions[agent.personality].bid);
            }
        }
    }


    private async planTask(
        taskDescription: string,
        participants: AgentRole[],
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
            ) as Record<AgentRole, AgentBid>,
        }));
    }
}
