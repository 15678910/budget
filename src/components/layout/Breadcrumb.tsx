"use client";

import type { BreadcrumbItem } from "@/types/budget";
import { cn } from "@/lib/utils/format";

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (path: string[]) => void;
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      className="flex items-center gap-1 text-base mb-3 overflow-x-auto py-1"
      aria-label="breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} className="flex items-center gap-1 shrink-0">
            {index > 0 && (
              <span className="text-muted-foreground mx-0.5" aria-hidden>
                &gt;
              </span>
            )}
            {isLast ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <button
                onClick={() => onNavigate(item.path)}
                className={cn(
                  "text-muted-foreground hover:text-foreground hover:underline transition-colors",
                  "cursor-pointer"
                )}
              >
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
