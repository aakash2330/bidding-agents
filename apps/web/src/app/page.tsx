import { AuctionDetailsView } from "@/components/auction/AuctionDetailsView";
import { AuctionForm } from "@/components/auction/Form";
import { CompareSection } from "@/components/compare/CompareSection";
import { DirectPlanView } from "@/components/direct/DirectPlanView";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <main className="flex w-full max-w-7xl flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bidding agents
        </h1>
        <AuctionForm />
        <CompareSection
          directDetails={<DirectPlanView />}
          auctionDetails={<AuctionDetailsView />}
        />
      </main>
    </div>
  );
}
