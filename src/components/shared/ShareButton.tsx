"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils/format";

/**
 * A minimal share button that copies the current page URL to the clipboard.
 * Shows a "copied" tooltip for 2 seconds after a successful copy.
 */
export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / insecure contexts
      const textarea = document.createElement("textarea");
      textarea.value = window.location.href;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <div className="relative inline-block">
      <button
        onClick={handleCopy}
        className={cn(
          "p-2 rounded-md transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "border border-border"
        )}
        aria-label="URL 복사"
        title="URL 복사"
      >
        {/* Clipboard icon (Heroicons outline) */}
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
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>

      {/* Tooltip */}
      {copied && (
        <span
          className={cn(
            "absolute -top-9 left-1/2 -translate-x-1/2",
            "px-2 py-1 text-xs rounded-md whitespace-nowrap",
            "bg-foreground text-background",
            "animate-in fade-in slide-in-from-bottom-1 duration-200"
          )}
        >
          복사됨!
        </span>
      )}
    </div>
  );
}
