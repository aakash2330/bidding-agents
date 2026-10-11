import {
  AGENT_ROLE_LABEL,
  type AgentBid,
  type AgentRole,
} from "@bidding-agents/shared";

import { Separator } from "@/components/ui/separator";

export type BidderToolCall = {
  id: string;
  name: string;
  detail?: string;
};

export type BidderSectionProps = {
  role: AgentRole;
  creditsRemaining?: number;
  bidding?: Pick<AgentBid, "bid"> | null;
  toolCalls?: BidderToolCall[];
  decision?: AgentBid | null;
};

function Placeholder({ children }: { children: string }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export default function BidderSection({
  role,
  creditsRemaining,
  bidding,
  toolCalls = [],
  decision,
}: BidderSectionProps) {
  const hasBidding =
    creditsRemaining !== undefined || (bidding !== undefined && bidding !== null);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium">{AGENT_ROLE_LABEL[role]}</h2>

      <div className="space-y-2">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Bidding
        </h3>
        {hasBidding ? (
          <dl className="space-y-1 text-sm">
            {creditsRemaining !== undefined ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Credits</dt>
                <dd className="font-mono tabular-nums">{creditsRemaining}</dd>
              </div>
            ) : null}
            {bidding ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Current bid</dt>
                <dd className="font-mono tabular-nums">{bidding.bid}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <Placeholder>No bids yet.</Placeholder>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Tool calls
        </h3>
        {toolCalls.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {toolCalls.map((call) => (
              <li
                key={call.id}
                className="rounded-md border border-border bg-muted/30 px-2 py-1.5"
              >
                <span className="font-mono text-xs">{call.name}</span>
                {call.detail ? (
                  <p className="mt-0.5 text-muted-foreground">{call.detail}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <Placeholder>No tool activity yet.</Placeholder>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Decision
        </h3>
        {decision ? (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Bid</dt>
              <dd className="font-mono tabular-nums">{decision.bid} credits</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Opinion</dt>
              <dd>{decision.opinion}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Reason</dt>
              <dd>{decision.reason}</dd>
            </div>
          </dl>
        ) : (
          <Placeholder>No final decision yet.</Placeholder>
        )}
      </div>
    </section>
  );
}
