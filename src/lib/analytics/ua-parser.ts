/**
 * Lightweight User-Agent parser for analytics.
 *
 * Detection order matters:
 *   - Whale must be checked BEFORE Chrome (Whale UA contains "Chrome")
 *   - Edge must be checked BEFORE Chrome
 *   - Opera must be checked BEFORE Chrome
 *   - Samsung Internet must be checked BEFORE Chrome
 */

export interface ParsedUA {
  browser: string;
  os: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

// ---------- Browser detection ----------

interface BrowserRule {
  name: string;
  test: (ua: string) => boolean;
}

const BROWSER_RULES: BrowserRule[] = [
  { name: 'Whale',           test: (ua) => ua.includes('Whale') },
  { name: 'Edge',            test: (ua) => ua.includes('Edg/') || ua.includes('Edge/') },
  { name: 'Opera',           test: (ua) => ua.includes('OPR/') || ua.includes('Opera') },
  { name: 'Samsung Internet', test: (ua) => ua.includes('SamsungBrowser') },
  { name: 'Chrome',          test: (ua) => ua.includes('Chrome') && !ua.includes('Chromium') },
  { name: 'Firefox',         test: (ua) => ua.includes('Firefox') },
  { name: 'Safari',          test: (ua) => ua.includes('Safari') && !ua.includes('Chrome') },
];

function detectBrowser(ua: string): string {
  for (const rule of BROWSER_RULES) {
    if (rule.test(ua)) return rule.name;
  }
  return 'Other';
}

// ---------- OS detection ----------

interface OSRule {
  name: string;
  test: (ua: string) => boolean;
}

const OS_RULES: OSRule[] = [
  // iOS must come before macOS because iPads in desktop mode contain "Macintosh"
  { name: 'iOS',     test: (ua) => /iPhone|iPad|iPod/.test(ua) },
  { name: 'Android', test: (ua) => ua.includes('Android') },
  { name: 'Windows', test: (ua) => ua.includes('Windows') },
  { name: 'macOS',   test: (ua) => ua.includes('Macintosh') || ua.includes('Mac OS') },
  { name: 'Linux',   test: (ua) => ua.includes('Linux') },
];

function detectOS(ua: string): string {
  for (const rule of OS_RULES) {
    if (rule.test(ua)) return rule.name;
  }
  return 'Other';
}

// ---------- Device type detection ----------

function detectDeviceType(ua: string): 'mobile' | 'tablet' | 'desktop' {
  // Tablets first — iPad, Android tablet (no "Mobile" token), Kindle, etc.
  if (/iPad|Android(?!.*Mobile)|Tablet|Kindle|Silk/i.test(ua)) {
    return 'tablet';
  }
  // Mobile
  if (/Mobile|iPhone|iPod|Android.*Mobile|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

// ---------- Public API ----------

export function parseUserAgent(ua: string): ParsedUA {
  if (!ua) {
    return { browser: 'Unknown', os: 'Unknown', deviceType: 'desktop' };
  }

  return {
    browser: detectBrowser(ua),
    os: detectOS(ua),
    deviceType: detectDeviceType(ua),
  };
}
