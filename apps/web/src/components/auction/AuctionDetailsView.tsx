import { AuctionRunView } from "@/components/auction/AuctionRunView";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuctionDetailsView() {
  return (
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
  );
}
