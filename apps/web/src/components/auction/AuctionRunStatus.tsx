"use client";

import { useEffect, useState } from "react";
import { cn } from "cn";
import { useShallow } from "zustand/react/shallow";

import {
  AuctionRunPhase,
  auctionProgressLabel,
  auctionRunPhase,
  auctionStatusLabel,
  roundLabel,
  taskLotState,
} from "@/components/auction/auction-run-display";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuctionStore } from "@/stores/auction-store";

type AuctionRunStatusProps = {
  viewTaskIndex: number | null;
  onViewTaskIndexChange: (index: number) => void;
};

export function AuctionRunStatus({
  viewTaskIndex,
  onViewTaskIndexChange,
}: AuctionRunStatusProps) {
  const {
    problem,
    phase,
    lotActivity,
    errorMessage,
    tasks,
    currentTaskIndex,
    currentRound,
  } = useAuctionStore(
    useShallow((s) => ({
      problem: s.problem,
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
      {problem ? (
        <CardHeader>
          <CardDescription className="line-clamp-2">{problem}</CardDescription>
        </CardHeader>
      ) : null}
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
          <ol className="flex flex-col gap-1.5">
            {tasks.map((task, index) => {
              const state = taskLotState(index, currentTaskIndex, done);
              const selected = viewTaskIndex === index;
              return (
                <li key={index}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewTaskIndexChange(index)}
                    className={cn(
                      "h-auto w-full justify-start px-2 py-1.5 text-left font-normal",
                      selected && "bg-muted",
                    )}
                  >
                    <span className="flex items-start gap-2">
                      <TaskMarker state={state} />
                      <span className="min-w-0 font-medium">
                        Lot {index + 1}. {task.title}
                      </span>
                    </span>
                  </Button>
                </li>
              );
            })}
          </ol>
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

export function useViewTaskIndex() {
  const phase = useAuctionStore((s) => auctionRunPhase(s.lastEventType));
  const currentTaskIndex = useAuctionStore((s) => s.currentTaskIndex);
  const taskCount = useAuctionStore((s) => s.tasks.length);
  const [viewTaskIndex, setViewTaskIndex] = useState<number | null>(null);

  useEffect(() => {
    if (currentTaskIndex !== null) {
      setViewTaskIndex(currentTaskIndex);
    }
  }, [currentTaskIndex]);

  useEffect(() => {
    if (phase === AuctionRunPhase.Done && taskCount > 0) {
      setViewTaskIndex(taskCount - 1);
    }
  }, [phase, taskCount]);

  return [viewTaskIndex, setViewTaskIndex] as const;
}
