import type { AgentRole } from "@bidding-agents/auction/types";

export default function BidderSection({ role }: { role: AgentRole }) {
  return (
    <div className="text-sm font-medium capitalize">{role}</div>
  );
}
