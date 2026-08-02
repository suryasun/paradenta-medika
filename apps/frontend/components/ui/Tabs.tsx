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
      <div role="tabpanel" className="py-4">
        {activeItem?.content}
      </div>
    </div>
  );
}
