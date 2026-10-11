import { Children, Fragment } from "react";

import { Separator } from "@/components/ui/separator";

export function BidderSectionLayout({ children }: { children: React.ReactNode }) {
  const items = Children.toArray(children);

  return (
    <div className="flex w-full">
      {items.map((child, i) => (
        <Fragment key={i}>
          {i > 0 ? <Separator orientation="vertical" /> : null}
          <div className="min-w-0 flex-1 px-4">{child}</div>
        </Fragment>
      ))}
    </div>
  );
}
