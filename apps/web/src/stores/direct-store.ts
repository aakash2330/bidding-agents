import { create } from "zustand";

type DirectStore = {
  plan: string | null;
  pending: boolean;
  error: string | null;
  startDirectPlan: (problem: string) => Promise<void>;
};

export const useDirectStore = create<DirectStore>((set) => {
  let inFlight: AbortController | null = null;

  return {
    plan: null,
    pending: false,
    error: null,
    startDirectPlan: async (problem) => {
      inFlight?.abort();
      const controller = new AbortController();
      inFlight = controller;

      set({ plan: null, pending: true, error: null });
      try {
        const response = await fetch("/api/direct/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problem }),
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => null)) as {
          plan?: string;
          error?: string;
        } | null;
        if (!response.ok || typeof data?.plan !== "string") {
          set({ pending: false, error: data?.error ?? "Request failed" });
          return;
        }
        set({ plan: data.plan, pending: false });
      } catch {
        if (controller.signal.aborted) return;
        set({ pending: false, error: "Direct plan failed" });
      }
    },
  };
});
