import { AGENT_ROLES } from "@bidding-agents/shared";

import { runAuctionPipeline } from "@/app/actions/run-auction";
import BidderSection from "@/components/bidder/BidderSection";
import { BidderSectionLayout } from "@/components/bidder/BidderSectionLayout";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <main className="flex w-full max-w-5xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bidding agents
          </h1>
          <form action={runAuctionPipeline} className="mt-4">
            <FieldGroup>
              <Field>
                <Input
                  id="problem"
                  name="problem"
                  placeholder="Describe the problem"
                  required
                />
                <FieldDescription>
                  We&apos;ll break this into auction lots for designer,
                  engineer, and marketer agents.
                </FieldDescription>
              </Field>
              <Button type="submit">Run auction</Button>
            </FieldGroup>
          </form>
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
