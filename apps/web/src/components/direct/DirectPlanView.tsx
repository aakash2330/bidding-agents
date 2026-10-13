"use client";

import { useShallow } from "zustand/react/shallow";

import { PlanCard } from "@/components/plan/PlanCard";
import { useDirectStore } from "@/stores/direct-store";

export function DirectPlanView() {
  const { plan, pending, error } = useDirectStore(
    useShallow((s) => ({ plan: s.plan, pending: s.pending, error: s.error })),
  );

  return (
    <PlanCard
      title="Plan"
      description="Final plan from the single agent"
      placeholder="The plan will go here."
      plan={plan}
      pending={pending}
      error={error}
    />
  );
}
