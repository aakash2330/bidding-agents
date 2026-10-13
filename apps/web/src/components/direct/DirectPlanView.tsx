"use client";

import { useShallow } from "zustand/react/shallow";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDirectStore } from "@/stores/direct-store";

export function DirectPlanView() {
  const { plan, pending, error } = useDirectStore(
    useShallow((s) => ({ plan: s.plan, pending: s.pending, error: s.error })),
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">Plan</CardTitle>
        <CardDescription>Final plan from the single agent</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {pending ? (
          <p className="text-sm text-muted-foreground">Planning…</p>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {plan ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {plan}
          </p>
        ) : null}
        {!pending && !error && !plan ? (
          <p className="text-sm text-muted-foreground">
            The plan will go here.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
