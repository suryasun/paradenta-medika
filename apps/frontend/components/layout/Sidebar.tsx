"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem, NAV_ITEMS } from "@/config/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/utils/cn";

function filterVisible(items: NavItem[], hasPermission: (code: string) => boolean): NavItem[] {
  return items
    .filter((item) => !item.permission || hasPermission(item.permission))
    .map((item) => ({ ...item, children: item.children ? filterVisible(item.children, hasPermission) : undefined }));
}

export function Sidebar() {
  const pathname = usePathname();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const visibleItems = filterVisible(NAV_ITEMS, hasPermission);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center border-b border-border px-4">
        <span className="text-lg font-semibold text-primary">Parakita</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-slate-100",
                )}
              >
                {item.label}
              </Link>
              {item.children && item.children.length > 0 && (
                <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-border pl-3">
                  {item.children.map((child) => {
                    const isChildActive = pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-sm transition-colors",
                          isChildActive ? "font-medium text-primary" : "text-muted hover:text-foreground",
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
