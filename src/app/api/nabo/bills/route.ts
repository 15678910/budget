import { NextRequest, NextResponse } from 'next/server';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AssemblyBillRow {
  BILL_ID: string;
  BILL_NO: string;
  BILL_NAME: string;
  COMMITTEE: string | null;
  PROPOSE_DT: string;
  PROC_RESULT: string | null;
  AGE: string;
  DETAIL_LINK: string;
  PROPOSER: string;
  RST_PROPOSER: string;
  PUBL_PROPOSER: string | null;
  LAW_PROC_DT: string | null;
  CMT_PROC_DT: string | null;
  PROC_DT: string | null;
}

interface AssemblyApiHead {
  list_total_count?: number;
  RESULT?: { CODE: string; MESSAGE: string };
}

interface AssemblyApiResponse {
  nzmimeepazxkubdpn: [
    { head: AssemblyApiHead[] },
    { row: AssemblyBillRow[] },
  ];
}

interface Bill {
  id: string;
  billNo: string;
  name: string;
  proposer: string;
  proposeDate: string;
  committee: string | null;
  status: string | null;
  detailLink: string;
}

interface BillsResponse {
  bills: Bill[];
  total: number;
  page: number;
  size: number;
}

// ─── In-memory cache (5 minutes TTL) ─────────────────────────────────────────

interface CacheEntry {
  data: BillsResponse;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(search: string, proposer: string, page: number, size: number, committee: string): string {
  return `${search}|${proposer}|${page}|${size}|${committee}`;
}

function getFromCache(key: string): BillsResponse | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: BillsResponse): void {
  if (cache.size > 100) cache.clear();
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.NABO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'NABO_API_KEY is not configured. Service unavailable.' },
      { status: 503 }
    );
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') ?? '';
  const proposer = searchParams.get('proposer') ?? '';
  const committee = searchParams.get('committee') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const rawSize = parseInt(searchParams.get('size') ?? '10', 10);
  const size = Math.min(20, Math.max(1, isNaN(rawSize) ? 10 : rawSize));

  const cacheKey = getCacheKey(search, proposer, page, size, committee);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-Cache': 'HIT' },
    });
  }

  // Build external API URL
  const externalUrl = new URL('https://open.assembly.go.kr/portal/openapi/nzmimeepazxkubdpn');
  externalUrl.searchParams.set('KEY', apiKey);
  externalUrl.searchParams.set('Type', 'json');
  externalUrl.searchParams.set('pIndex', String(page));
  externalUrl.searchParams.set('pSize', String(size));
  externalUrl.searchParams.set('AGE', '22');
  if (search) {
    externalUrl.searchParams.set('BILL_NAME', search);
  }
  if (proposer) {
    externalUrl.searchParams.set('RST_PROPOSER', proposer);
  }
  if (committee) {
    externalUrl.searchParams.set('COMMITTEE', committee);
  }

  let raw: AssemblyApiResponse;
  try {
    const res = await fetch(externalUrl.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 }, // disable Next.js fetch cache; we handle caching ourselves
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `External API returned HTTP ${res.status}` },
        { status: 502 }
      );
    }

    raw = (await res.json()) as AssemblyApiResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown fetch error';
    return NextResponse.json(
      { error: `Failed to reach external API: ${message}` },
      { status: 502 }
    );
  }

  // Validate API-level result code
  const headSection = raw?.nzmimeepazxkubdpn?.[0]?.head;
  const resultEntry = headSection?.find((h) => h.RESULT !== undefined);
  const resultCode = resultEntry?.RESULT?.CODE;

  if (resultCode && resultCode !== 'INFO-000') {
    const resultMessage = resultEntry?.RESULT?.MESSAGE ?? 'Unknown error from external API';
    return NextResponse.json(
      { error: `External API error (${resultCode}): ${resultMessage}` },
      { status: 502 }
    );
  }

  const totalEntry = headSection?.find((h) => h.list_total_count !== undefined);
  const total = totalEntry?.list_total_count ?? 0;

  const rows: AssemblyBillRow[] = raw?.nzmimeepazxkubdpn?.[1]?.row ?? [];

  const bills: Bill[] = rows.map((row) => ({
    id: row.BILL_ID,
    billNo: row.BILL_NO,
    name: row.BILL_NAME,
    proposer: row.RST_PROPOSER || row.PROPOSER,
    proposeDate: row.PROPOSE_DT,
    committee: row.COMMITTEE ?? null,
    status: row.PROC_RESULT ?? null,
    detailLink: row.DETAIL_LINK,
  }));

  const response: BillsResponse = { bills, total, page, size };
  setCache(cacheKey, response);

  return NextResponse.json(response, {
    headers: { 'X-Cache': 'MISS' },
  });
}
