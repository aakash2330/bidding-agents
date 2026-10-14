"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { openAuctionEventSource } from "./open-auction-event-source";
import { useAppBuildStore } from "@/stores/app-build-store";
import { useAuctionStore } from "@/stores/auction-store";
import { useDirectStore } from "@/stores/direct-store";

export function AuctionForm() {
  const problem = useAuctionStore((s) => s.problem);
  const setProblem = useAuctionStore((s) => s.setProblem);
  const resetRun = useAuctionStore((s) => s.resetRun);
  const applyEvent = useAuctionStore((s) => s.applyEvent);
  const startDirectPlan = useDirectStore((s) => s.startDirectPlan);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const closeStreamRef = useRef<(() => void) | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = problem.trim();
    if (!value) {
      setError("Problem is required");
      return;
    }

    setError(null);
    setProblem(value);
    resetRun();
    useAppBuildStore.getState().resetBuilds();
    void startDirectPlan(value);
    setPending(true);
    try {
      const response = await fetch("/api/auction/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: value }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Request failed");
        return;
      }
      const { id } = (await response.json()) as { id?: string };
      if (!id) {
        setError("Request failed");
        return;
      }
      const stream = openAuctionEventSource(id, applyEvent);
      closeStreamRef.current = stream.close;
      await stream.done;

      // The auction is final: implement its plan and deploy it.
      const plan = useAuctionStore.getState().plan;
      if (plan) {
        void useAppBuildStore.getState().startBuild("auction", plan);
      }
    } catch {
      setError("Auction stream failed");
    } finally {
      closeStreamRef.current = null;
      setPending(false);
    }
  }

  function onCancel() {
    closeStreamRef.current?.();
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl">
      <FieldSet>
        <FieldGroup>
          <Field data-invalid={error ? true : undefined}>
            <FieldContent>
              <Input
                id="auction-problem"
                name="problem"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="What should the agents bid on?"
                disabled={pending}
                aria-invalid={error ? true : undefined}
              />
              <FieldError>{error}</FieldError>
            </FieldContent>
          </Field>
        </FieldGroup>
        {pending ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button type="submit">Start auction</Button>
        )}
      </FieldSet>
    </form>
  );
}
