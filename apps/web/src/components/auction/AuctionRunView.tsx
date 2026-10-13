"use client";

import { AuctionRunStatus } from "@/components/auction/AuctionRunStatus";
import { PlanCard } from "@/components/plan/PlanCard";
import { useAuctionStore } from "@/stores/auction-store";

export function AuctionRunView() {
  const plan = useAuctionStore((s) => s.plan);

  return (
    <div className="flex w-full flex-col gap-6">
      <AuctionRunStatus />
      <PlanCard
        title="Plan"
        description="Final plan from the auction"
        placeholder="The plan will go here."
        plan={plan}
      />
    </div>
  );
}
