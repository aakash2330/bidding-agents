"use client";

import { useState } from "react";

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
import { useAuctionStore } from "@/stores/auction-store";

export function AuctionForm() {
  const problem = useAuctionStore((s) => s.problem);
  const setProblem = useAuctionStore((s) => s.setProblem);
  const resetRun = useAuctionStore((s) => s.resetRun);
  const applyEvent = useAuctionStore((s) => s.applyEvent);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
      await openAuctionEventSource(id, applyEvent);
    } catch {
      setError("Auction stream failed");
    } finally {
      setPending(false);
    }
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
        <Button type="submit" disabled={pending}>
          {pending ? "Running auction…" : "Start auction"}
        </Button>
      </FieldSet>
    </form>
  );
}
