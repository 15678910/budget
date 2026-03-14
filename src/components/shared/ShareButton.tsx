"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/format";
import { ShareModal } from "./ShareModal";

/**
 * Share button that opens a modal with multiple sharing options:
 * URL copy, image save, embed code, and native share.
 */
export function ShareButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "p-2 rounded-md transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "border border-border"
        )}
        aria-label="공유하기"
        title="공유하기"
      >
        {/* Share icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>

      <ShareModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
