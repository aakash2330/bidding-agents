export const AGENT_ROLES = ["designer", "engineer", "marketer"] as const;

export type AgentRole = (typeof AGENT_ROLES)[number];

export const AuctionEventType = {
  PlanningStarted: "planning_started",
  TasksPlanned: "tasks_planned",
  LotStarted: "lot_started",
  RoundComplete: "round_complete",
  Done: "done",
  Error: "error",
} as const;

export type AuctionEventType =
  (typeof AuctionEventType)[keyof typeof AuctionEventType];

export const AuctionRound = {
  Initial: "initial",
  Verify: "verify",
} as const;

export type AuctionRound = (typeof AuctionRound)[keyof typeof AuctionRound];

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
  | { type: typeof AuctionEventType.PlanningStarted }
  | {
      type: typeof AuctionEventType.TasksPlanned;
      tasks: { title: string; description: string }[];
    }
  | {
      type: typeof AuctionEventType.LotStarted;
      index: number;
      title: string;
      description: string;
    }
  | {
      type: typeof AuctionEventType.RoundComplete;
      index: number;
      round: AuctionRound;
      opinions: Record<AgentRole, AgentBid>;
    }
  | { type: typeof AuctionEventType.Done; tasks: TaskWithAgentOpinions[]; plan: string }
  | { type: typeof AuctionEventType.Error; message: string };

export function isTerminalAuctionEvent(event: AuctionEvent): boolean {
  return (
    event.type === AuctionEventType.Done ||
    event.type === AuctionEventType.Error
  );
}
