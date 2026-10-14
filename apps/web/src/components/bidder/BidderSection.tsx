"use client";

import type { AgentBid, AgentRole } from "@bidding-agents/auction/types";

import { useAuctionStore } from "@/stores/auction-store";

function hasOpinion({ bid, opinion, reason }: AgentBid) {
  return bid > 0 || opinion.length > 0 || reason.length > 0;
}

export default function BidderSection({
  role,
  taskIndex,
}: {
  role: AgentRole;
  taskIndex: number | null;
}) {
  const opinion = useAuctionStore((s) => {
    if (taskIndex === null || taskIndex >= s.tasks.length) return null;
    return s.tasks[taskIndex].agentsOpinions[role];
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-medium capitalize">{role}</div>
      {opinion && hasOpinion(opinion) ? (
        <>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {opinion.bid}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              credits
            </span>
          </p>
          {opinion.opinion ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {opinion.opinion}
            </p>
          ) : null}
          {opinion.reason ? (
            <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {opinion.reason}
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Waiting for bid…</p>
      )}
    </div>
  );
}
