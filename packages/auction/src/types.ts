export const AGENT_ROLES = ["designer", "engineer", "marketer"] as const;

export type AgentRole = (typeof AGENT_ROLES)[number];

export type AgentBid = {
  bid: number;
  opinion: string;
  reason: string;
};

export type TaskWithAgentOpinions = {
  title: string;
  description: string;
  agentsOpinions: Record<AgentRole, AgentBid>;
};

export type AuctionEvent =
  | { type: "planning_started" }
  | {
      type: "tasks_planned";
      tasks: { title: string; description: string }[];
    }
  | {
      type: "lot_started";
      index: number;
      title: string;
      description: string;
    }
  | {
      type: "round_complete";
      index: number;
      round: "initial" | "verify";
      opinions: Record<AgentRole, AgentBid>;
    }
  | { type: "done"; tasks: TaskWithAgentOpinions[] }
  | { type: "error"; message: string };
