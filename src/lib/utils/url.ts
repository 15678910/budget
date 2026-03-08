/**
 * URL utilities for handling Korean budget path segments.
 *
 * Korean strings in URL paths must be percent-encoded. These helpers
 * provide a consistent encode/decode contract so that routing and
 * deep-link sharing work correctly across browsers.
 *
 * Segment separator: "/" (forward slash — NOT percent-encoded inside the path)
 * Each individual segment is encoded with encodeURIComponent so that Korean
 * characters, spaces, dots, and special characters are safely escaped.
 *
 * Example round-trip:
 *   encodeBudgetPath(['사회복지', '기초생활보장', '생계급여'])
 *   → '%EC%82%AC%ED%9A%8C%EB%B3%B5%EC%A7%80/%EA%B8%B0%EC%B4%88%EC%83%9D%ED%99%9C%EB%B3%B4%EC%9E%A5/%EC%83%9D%EA%B3%84%EA%B8%89%EC%97%AC'
 *
 *   decodeBudgetPath('%EC%82%AC%ED%9A%8C%EB%B3%B5%EC%A7%80/...')
 *   → ['사회복지', '기초생활보장', '생계급여']
 */

/**
 * Encodes an array of path segments into a URL-safe string.
 * Each segment is individually percent-encoded; segments are joined with "/".
 *
 * Empty segments are filtered out to avoid double slashes.
 */
export function encodeBudgetPath(segments: string[]): string {
  return segments
    .filter((s) => s.length > 0)
    .map((s) => encodeURIComponent(s))
    .join('/');
}

/**
 * Decodes a URL path string back into an array of plain-text segments.
 * Splits on "/" first, then decodes each segment individually.
 *
 * Returns an empty array for empty/blank input.
 */
export function decodeBudgetPath(encodedPath: string): string[] {
  if (!encodedPath || encodedPath.trim() === '') return [];

  return encodedPath
    .split('/')
    .filter((s) => s.length > 0)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        // If decoding fails (malformed URI), return the raw segment as-is.
        return s;
      }
    });
}
