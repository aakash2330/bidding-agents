"use client";

import { useState, type ReactNode } from "react";

import {
  CompareColumn,
  type CompareView,
} from "@/components/compare/CompareColumn";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CompareSection({
  directDetails,
  auctionDetails,
}: {
  directDetails: ReactNode;
  auctionDetails: ReactNode;
}) {
  const [view, setView] = useState<CompareView>("details");

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        value={view}
        onValueChange={(value) => setView(value as CompareView)}
      >
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="grid gap-8 lg:grid-cols-2">
        <CompareColumn
          title="Auction"
          view={view}
          outputPlaceholder="Auction app"
          details={auctionDetails}
        />
        <CompareColumn
          title="Direct"
          view={view}
          outputPlaceholder="Direct app"
          details={directDetails}
        />
      </div>
    </div>
  );
}
