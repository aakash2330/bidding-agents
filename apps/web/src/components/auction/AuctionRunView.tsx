"use client";

import { AGENT_ROLES } from "@bidding-agents/auction/types";

import {
  AuctionRunStatus,
  useViewTaskIndex,
} from "@/components/auction/AuctionRunStatus";
import BidderSection from "@/components/bidder/BidderSection";
import { BidderSectionLayout } from "@/components/bidder/BidderSectionLayout";

export function AuctionRunView() {
  const [viewTaskIndex, setViewTaskIndex] = useViewTaskIndex();

  return (
    <div className="flex w-full flex-col gap-6">
      <AuctionRunStatus
        viewTaskIndex={viewTaskIndex}
        onViewTaskIndexChange={setViewTaskIndex}
      />
      <BidderSectionLayout>
        {AGENT_ROLES.map((role) => (
          <BidderSection key={role} role={role} taskIndex={viewTaskIndex} />
        ))}
      </BidderSectionLayout>
    </div>
  );
}
