"use client";

import { AGENT_ROLES } from "@bidding-agents/auction/types";
import { useShallow } from "zustand/react/shallow";

import {
  AuctionRunPhase,
  auctionProgressLabel,
  auctionRunPhase,
  auctionStatusLabel,
  roundLabel,
  taskLotState,
} from "@/components/auction/auction-run-display";
import BidderSection from "@/components/bidder/BidderSection";
import { BidderSectionLayout } from "@/components/bidder/BidderSectionLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuctionStore } from "@/stores/auction-store";

export function AuctionRunStatus() {
  const {
    phase,
    lotActivity,
    errorMessage,
    tasks,
    currentTaskIndex,
    currentRound,
  } = useAuctionStore(
    useShallow((s) => ({
      phase: auctionRunPhase(s.lastEventType),
      lotActivity: s.lotActivity,
      errorMessage: s.errorMessage,
      tasks: s.tasks,
      currentTaskIndex: s.currentTaskIndex,
      currentRound: s.currentRound,
    })),
  );

  const done = phase === AuctionRunPhase.Done;
  const hasRun = phase !== AuctionRunPhase.Idle;

  if (!hasRun) return null;

  const status = auctionStatusLabel({
    phase,
    lotActivity,
    currentTaskIndex,
  });
  const progress = auctionProgressLabel(
    phase,
    currentTaskIndex,
    tasks.length,
  );
  const round = roundLabel(currentRound);

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-sm">{status}</CardTitle>
          {progress ? (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-muted-foreground">{progress}</span>
            </>
          ) : null}
          {round ? (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-muted-foreground">{round}</span>
            </>
          ) : null}
        </div>
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        {tasks.length > 0 ? (
          <Accordion multiple>
            {tasks.map((task, index) => (
              <AccordionItem key={index} value={index}>
                <AccordionTrigger>
                  <span className="flex items-start gap-2">
                    <TaskMarker
                      state={taskLotState(index, currentTaskIndex, done)}
                    />
                    <span className="min-w-0 font-medium">
                      Lot {index + 1}. {task.title}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <BidderSectionLayout>
                    {AGENT_ROLES.map((role) => (
                      <BidderSection key={role} role={role} taskIndex={index} />
                    ))}
                  </BidderSectionLayout>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TaskMarker({
  state,
}: {
  state: "pending" | "active" | "complete";
}) {
  const className =
    state === "complete"
      ? "bg-primary"
      : state === "active"
        ? "bg-primary animate-pulse"
        : "border border-muted-foreground/40 bg-transparent";
  return (
    <span
      className={`mt-1.5 size-2 shrink-0 rounded-full ${className}`}
      aria-hidden
    />
  );
}
