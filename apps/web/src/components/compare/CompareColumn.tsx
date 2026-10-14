import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

export type CompareView = "details" | "output";

export function CompareColumn({
  title,
  view,
  output,
  details,
}: {
  title: string;
  view: CompareView;
  output: ReactNode;
  details: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="text-sm font-medium tracking-tight">{title}</h2>
      {view === "details" ? (
        <div className="flex flex-col gap-4">{details}</div>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="p-0">{output}</CardContent>
        </Card>
      )}
    </section>
  );
}
