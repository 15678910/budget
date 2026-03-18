/**
 * Global Gemini API rate limiter.
 * Shared across all API routes to prevent 429 errors.
 *
 * Gemini free tier: ~15 RPM → minimum ~4s gap, but we use 8s for safety.
 */

const MIN_GAP_MS = 4_000; // minimum 4 seconds between Gemini API calls (15 RPM = 4s gap)
let lastCallTime = 0;

/**
 * Check if we can make a Gemini API call right now.
 * @returns `{ allowed: true }` if OK, or `{ allowed: false, retryAfter: seconds }` if too soon.
 */
export function checkGeminiRateLimit(): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  const elapsed = now - lastCallTime;

  if (elapsed < MIN_GAP_MS) {
    const waitMs = MIN_GAP_MS - elapsed;
    return { allowed: false, retryAfter: Math.ceil(waitMs / 1000) };
  }

  return { allowed: true };
}

/**
 * Mark that a Gemini API call was just made.
 * Call this right before the fetch to Gemini.
 */
export function markGeminiCall(): void {
  lastCallTime = Date.now();
}
