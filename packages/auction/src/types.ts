export const AGENT_ROLES = ["designer", "engineer", "marketer"] as const;

export type AgentRole = (typeof AGENT_ROLES)[number];

export type AgentBid = {
  bid: number;
  opinion: string;
  reason: string;
};
