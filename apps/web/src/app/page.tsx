import { AGENT_ROLES } from "@bidding-agents/shared";

import BidderSection from "@/components/bidder/BidderSection";
import { BidderSectionLayout } from "@/components/bidder/BidderSectionLayout";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <main className="flex w-full max-w-5xl flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bidding agents
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Describe the problem and optional prompt; agents will decompose it
            and run the auction.
          </p>
        </div>
        <BidderSectionLayout>
          {AGENT_ROLES.map((role) => (
            <BidderSection key={role} role={role} />
          ))}
        </BidderSectionLayout>
      </main>
    </div>
  );
}
