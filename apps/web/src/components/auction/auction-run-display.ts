import {
  AuctionEventType,
  type AuctionRound,
} from "@bidding-agents/auction/types";

import type { LotActivity } from "@/stores/auction-store";

export const AuctionRunPhase = {
  Idle: "idle",
  Planning: "planning",
  Planned: "planned",
  Lot: "lot",
  Done: "done",
  Error: "error",
} as const;

export type AuctionRunPhase =
  (typeof AuctionRunPhase)[keyof typeof AuctionRunPhase];

export function auctionRunPhase(
  lastEventType: AuctionEventType | null,
): AuctionRunPhase {
  if (lastEventType === null) return AuctionRunPhase.Idle;

  switch (lastEventType) {
    case AuctionEventType.PlanningStarted:
      return AuctionRunPhase.Planning;
    case AuctionEventType.TasksPlanned:
      return AuctionRunPhase.Planned;
    case AuctionEventType.LotStarted:
    case AuctionEventType.RoundComplete:
      return AuctionRunPhase.Lot;
    case AuctionEventType.Done:
      return AuctionRunPhase.Done;
    case AuctionEventType.Error:
      return AuctionRunPhase.Error;
  }
}

export function auctionStatusLabel(input: {
  phase: AuctionRunPhase;
  lotActivity: LotActivity;
  currentTaskIndex: number | null;
}): string {
  const { phase, lotActivity, currentTaskIndex } = input;
  switch (phase) {
    case AuctionRunPhase.Idle:
      return "Idle";
    case AuctionRunPhase.Planning:
      return "Planning tasks…";
    case AuctionRunPhase.Planned:
      return "Tasks planned";
    case AuctionRunPhase.Lot: {
      const lot = currentTaskIndex !== null ? currentTaskIndex + 1 : "?";
      if (lotActivity === "bidding") return `Lot ${lot} — bidding`;
      if (lotActivity === "verify") return `Lot ${lot} — verify round`;
      return `Lot ${lot}`;
    }
    case AuctionRunPhase.Done:
      return "Auction complete";
    case AuctionRunPhase.Error:
      return "Error";
    default:
      return "Running";
  }
}

export function auctionProgressLabel(
  phase: AuctionRunPhase,
  currentTaskIndex: number | null,
  taskCount: number,
): string | null {
  if (taskCount === 0) return null;
  if (phase === AuctionRunPhase.Done) {
    return `${taskCount} of ${taskCount} lots`;
  }
  if (currentTaskIndex === null) {
    return `0 of ${taskCount} lots`;
  }
  return `Lot ${currentTaskIndex + 1} of ${taskCount}`;
}

export function taskLotState(
  index: number,
  currentTaskIndex: number | null,
  done: boolean,
): "pending" | "active" | "complete" {
  if (done) return "complete";
  if (currentTaskIndex === null) return "pending";
  if (index < currentTaskIndex) return "complete";
  if (index === currentTaskIndex) return "active";
  return "pending";
}

export function roundLabel(round: AuctionRound | null): string | null {
  if (!round) return null;
  return round === "verify" ? "Verify" : "Initial";
}
