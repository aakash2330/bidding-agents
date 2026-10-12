"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAuctionStore } from "@/stores/auction-store";

export function AuctionStateDebug() {
  const raw = useAuctionStore(
    useShallow((s) => ({
      problem: s.problem,
      lastEvent: s.lastEvent,
      tasks: s.tasks,
      currentTaskIndex: s.currentTaskIndex,
      currentRound: s.currentRound,
    })),
  );

  useEffect(() => {
    console.log("[auction-store]", raw);
  }, [raw]);

  return (
    <pre className="max-h-96 overflow-auto rounded border border-border bg-muted/50 p-3 text-xs">
      {JSON.stringify(raw, null, 2)}
    </pre>
  );
}
