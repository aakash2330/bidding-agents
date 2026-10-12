import {
  AGENT_ROLES,
  AuctionEventType,
  AuctionRound,
  type AgentBid,
  type AgentRole,
  type AuctionEvent,
  type TaskWithAgentOpinions,
} from "@bidding-agents/auction/types";
import { create } from "zustand";

export type LotActivity = "bidding" | "verify" | null;

export type AuctionRunState = {
  lastEventType: AuctionEventType | null;
  lotActivity: LotActivity;
  errorMessage: string | null;
  tasks: TaskWithAgentOpinions[];
  currentTaskIndex: number | null;
  currentRound: AuctionRound | null;
};

function emptyAgentOpinions(): Record<AgentRole, AgentBid> {
  return Object.fromEntries(
    AGENT_ROLES.map((role) => [
      role,
      { bid: 0, opinion: "", reason: "" },
    ]),
  ) as Record<AgentRole, AgentBid>;
}

export function initialAuctionRunState(): AuctionRunState {
  return {
    lastEventType: null,
    lotActivity: null,
    errorMessage: null,
    tasks: [],
    currentTaskIndex: null,
    currentRound: null,
  };
}

export function applyAuctionEvent(
  state: AuctionRunState,
  event: AuctionEvent,
): AuctionRunState {
  switch (event.type) {
    case AuctionEventType.PlanningStarted:
      return {
        ...initialAuctionRunState(),
        lastEventType: event.type,
      };

    case AuctionEventType.TasksPlanned:
      return {
        ...state,
        lastEventType: event.type,
        tasks: event.tasks.map((task) => ({
          ...task,
          agentsOpinions: emptyAgentOpinions(),
        })),
        currentTaskIndex: null,
        currentRound: null,
        lotActivity: null,
      };

    case AuctionEventType.LotStarted:
      return {
        ...state,
        lastEventType: event.type,
        lotActivity: "bidding",
        currentTaskIndex: event.index,
        currentRound: null,
        tasks: state.tasks.map((task, index) =>
          index === event.index
            ? {
                title: event.title,
                description: event.description,
                agentsOpinions: task.agentsOpinions,
              }
            : task,
        ),
      };

    case AuctionEventType.RoundComplete:
      return {
        ...state,
        lastEventType: event.type,
        lotActivity:
          event.round === AuctionRound.Initial ? "verify" : null,
        currentRound: event.round,
        tasks: state.tasks.map((task, index) =>
          index === event.index
            ? { ...task, agentsOpinions: { ...event.opinions } }
            : task,
        ),
      };

    case AuctionEventType.Done:
      return {
        ...state,
        lastEventType: event.type,
        lotActivity: null,
        tasks: event.tasks,
        currentTaskIndex: null,
        currentRound: null,
      };

    case AuctionEventType.Error:
      return {
        ...state,
        lastEventType: event.type,
        errorMessage: event.message,
      };

    default:
      return state;
  }
}

type AuctionStore = AuctionRunState & {
  problem: string;
  setProblem: (problem: string) => void;
  applyEvent: (event: AuctionEvent) => void;
  resetRun: () => void;
  reset: () => void;
};

export const useAuctionStore = create<AuctionStore>((set) => ({
  problem: "",
  ...initialAuctionRunState(),
  setProblem: (problem) => set({ problem }),
  applyEvent: (event) =>
    set((state) => applyAuctionEvent(state, event)),
  resetRun: () => set(initialAuctionRunState()),
  reset: () => set({ problem: "", ...initialAuctionRunState() }),
}));
