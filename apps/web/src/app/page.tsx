import { AuctionForm } from "@/components/auction/Form";
import { AuctionRunView } from "@/components/auction/AuctionRunView";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <main className="flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bidding agents
        </h1>
        <AuctionForm />
        <AuctionRunView />
      </main>
    </div>
  );
}
