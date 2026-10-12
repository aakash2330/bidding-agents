import { AGENT_ROLES } from "@bidding-agents/auction/types";

import BidderSection from "@/components/bidder/BidderSection";
import { BidderSectionLayout } from "@/components/bidder/BidderSectionLayout";
import { AuctionForm } from "@/components/auction/Form";
import { AuctionStateDebug } from "@/components/auction/AuctionStateDebug";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <main className="flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bidding agents
        </h1>
        <AuctionForm />
        <AuctionStateDebug />
        <BidderSectionLayout>
          {AGENT_ROLES.map((role) => (
            <BidderSection key={role} role={role} />
          ))}
        </BidderSectionLayout>
      </main>
    </div>
  );
}
