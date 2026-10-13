import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

export type CompareView = "details" | "output";

export function CompareColumn({
  title,
  view,
  outputPlaceholder,
  details,
}: {
  title: string;
  view: CompareView;
  outputPlaceholder: string;
  details: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="text-sm font-medium tracking-tight">{title}</h2>
      {view === "details" ? (
        <div className="flex flex-col gap-4">{details}</div>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="p-0">
            <div
              className="flex aspect-video w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground"
              aria-hidden
            >
              {outputPlaceholder}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
