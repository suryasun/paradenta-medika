"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/utils/cn";

export interface TabItem {
  key: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ items, defaultKey }: { items: TabItem[]; defaultKey?: string }) {
  const [active, setActive] = useState(defaultKey ?? items[0]?.key);
  const activeItem = items.find((item) => item.key === active);

  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-border">
        {items.map((item) => (
          <button
            key={item.key}
            role="tab"
            type="button"
            aria-selected={item.key === active}
            onClick={() => setActive(item.key)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              item.key === active ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {/* motion-standard cross-fade on tab switch (design-system.md §11.1)
          -- key={active} remounts the panel so the fade-in plays every
          switch; shell-level, applies to every consumer of Tabs
          (including EMR's VisitWorkspace, all 14 tabs) without any
          consumer needing its own transition code. */}
      <div key={active} role="tabpanel" className="animate-[tab-fade-in_180ms_ease-out] py-4">
        {activeItem?.content}
      </div>
    </div>
  );
}
