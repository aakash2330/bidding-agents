"use client";

import type { AgentBid, AgentRole, AuctionEvent } from "@bidding-agents/auction/types";
import { AGENT_ROLES } from "@bidding-agents/auction/types";
import { useState } from "react";

import BidderSection from "@/components/bidder/BidderSection";
import { BidderSectionLayout } from "@/components/bidder/BidderSectionLayout";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type BidderState = {
  status: string;
  bid?: AgentBid;
};

function applyEvent(
  prev: Record<AgentRole, BidderState>,
  event: AuctionEvent,
): Record<AgentRole, BidderState> {
  const next = { ...prev };
  switch (event.type) {
    case "planning_started":
      for (const role of AGENT_ROLES) {
        next[role] = { status: "Waiting for lots…" };
      }
      break;
    case "lot_started":
      for (const role of AGENT_ROLES) {
        next[role] = {
          status: `Bidding on lot ${event.index + 1}: ${event.title}`,
        };
      }
      break;
    case "round_complete":
      for (const role of AGENT_ROLES) {
        next[role] = {
          status:
            event.round === "verify"
              ? `Final bid on lot ${event.index + 1}`
              : `First bid on lot ${event.index + 1}`,
          bid: event.opinions[role],
        };
      }
      break;
    case "done":
      for (const role of AGENT_ROLES) {
        next[role] = { ...next[role], status: "Auction complete" };
      }
      break;
    case "error":
      for (const role of AGENT_ROLES) {
        next[role] = { status: `Error: ${event.message}` };
      }
      break;
    default:
      break;
  }
  return next;
}

const initialBidders = (): Record<AgentRole, BidderState> =>
  Object.fromEntries(
    AGENT_ROLES.map((role) => [role, { status: "Idle" }]),
  ) as Record<AgentRole, BidderState>;

export function AuctionForm() {
  const [problem, setProblem] = useState("");
  const [running, setRunning] = useState(false);
  const [bidders, setBidders] = useState(initialBidders);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = problem.trim();
    if (!trimmed || running) return;

    setRunning(true);
    setBidders(initialBidders());

    const response = await fetch("/api/auction/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem: trimmed }),
    });

    if (!response.ok || !response.body) {
      setBidders(
        Object.fromEntries(
          AGENT_ROLES.map((role) => [
            role,
            { status: `Request failed (${response.status})` },
          ]),
        ) as Record<AgentRole, BidderState>,
      );
      setRunning(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data: ")) continue;
        const event = JSON.parse(line.slice(6)) as AuctionEvent;
        setBidders((prev) => applyEvent(prev, event));
      }
    }

    setRunning(false);
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-4">
        <FieldGroup>
          <Field>
            <Input
              id="problem"
              name="problem"
              placeholder="Describe the problem"
              required
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              disabled={running}
            />
            <FieldDescription>
              We&apos;ll break this into auction lots for designer, engineer, and
              marketer agents.
            </FieldDescription>
          </Field>
          <Button type="submit" disabled={running}>
            {running ? "Running auction…" : "Run auction"}
          </Button>
        </FieldGroup>
      </form>
      <BidderSectionLayout>
        {AGENT_ROLES.map((role) => (
          <BidderSection
            key={role}
            role={role}
            status={bidders[role].status}
            bid={bidders[role].bid}
          />
        ))}
      </BidderSectionLayout>
    </>
  );
}
