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

// docs/02-design/Parakita - Key Screens.dc.html sidebar: 232px, logo badge,
// pill nav items with a status dot (tinted bg + primary-700 text when
// active, rather than a solid primary fill), and an RBAC disclaimer
// footer -- reproduced here since it's the one screen the mockup fully
// specifies structurally, not just via tokens.
export function Sidebar() {
  const pathname = usePathname();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const visibleItems = filterVisible(NAV_ITEMS, hasPermission);

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2.5 px-[18px] py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">PM</div>
        <span className="text-sm font-bold text-foreground">Parakita Medika</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-1.5">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] font-semibold transition-colors",
                  isActive
                    ? "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]"
                    : "text-foreground hover:bg-slate-100",
                )}
              >
                <span
                  className={cn("h-2 w-2 shrink-0 rounded-full", isActive ? "bg-primary" : "bg-border")}
                  aria-hidden="true"
                />
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
      <div className="border-t border-border px-[18px] py-3.5 text-[11px] text-muted">
        Menu tampil sesuai role (RBAC) — visibilitas UI saja; otorisasi sebenarnya di server.
      </div>
    </aside>
  );
}
