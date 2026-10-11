import type { AgentBid, AgentRole } from "@bidding-agents/auction/types";

export default function BidderSection({
  role,
  status,
  bid,
}: {
  role: AgentRole;
  status: string;
  bid?: AgentBid;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="font-medium capitalize">{role}</div>
      <p className="text-muted-foreground">{status}</p>
      {bid ? (
        <div className="rounded-md border p-2">
          <div className="font-medium">{bid.bid} credits</div>
          <div>{bid.opinion}</div>
          <div className="text-muted-foreground">{bid.reason}</div>
        </div>
      ) : null}
    </div>
  );
}