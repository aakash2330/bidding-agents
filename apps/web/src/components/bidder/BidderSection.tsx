import type { AgentRole } from "@bidding-agents/auction/types";

//TODO: this just contains whatever is needed to render the bidding and the tool calls and the decision taken by the bidder once we submit the problem statement for agents to work on
export default function BidderSection({ role }: { role: AgentRole }) {
  return (
    <div>
      <div className="text-sm font-medium capitalize">{role}</div>
      <div>Bidding</div>
      <div>Tool calls</div>
      <div>Decision</div>
    </div>
  );
}