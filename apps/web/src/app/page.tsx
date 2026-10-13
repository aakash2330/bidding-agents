import { AuctionForm } from "@/components/auction/Form";
import { AuctionRunView } from "@/components/auction/AuctionRunView";
import { CompareSection } from "@/components/compare/CompareSection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <main className="flex w-full max-w-7xl flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bidding agents
        </h1>
        <AuctionForm />
        <CompareSection
          directDetails={
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Process</CardTitle>
                <CardDescription>
                  Single-agent build transcript
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Transcript will go here.
                </p>
              </CardContent>
            </Card>
          }
          auctionDetails={
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Resolved plan</CardTitle>
                  <CardDescription>
                    Winning bid per lot after the auction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Lot winners will go here.
                  </p>
                </CardContent>
              </Card>
              <AuctionRunView />
            </>
          }
        />
      </main>
    </div>
  );
}
