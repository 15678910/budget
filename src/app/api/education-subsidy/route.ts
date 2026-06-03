import { NextRequest, NextResponse } from 'next/server';

// ─── 지자체 교육관련지원 예산 프록시 (지방재정365 EUSPBG) ───
// 광역(본청) 법정전출금 + 시군구 교육경비보조금/급식보조 등을 자치단체별로 반환.
// 지방재정365 OpenAPI를 서버에서 호출(키 노출 방지)하며 매년 자동 갱신됨.
// 출처: lofin365.go.kr/lf/hub/EUSPBG

const BASE = 'https://www.lofin365.go.kr/lf/hub/EUSPBG';

interface CacheEntry { data: unknown; expiresAt: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간 (연 1회 갱신 데이터)

// 시도 약칭 allowlist (wa_laf_hg_nm 값과 동일)
const REGIONS = new Set([
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
]);

interface Row {
  fyr: string; wa_laf_hg_nm: string; laf_cd: string; laf_hg_nm: string;
  ref_mttr_cn: string; edu_bdg_dts_cd: string; edu_bdg_dts_nm: string; bdg_amt: number | string;
}

interface Muni {
  name: string;          // 시군구명 (시도 접두 제거)
  isBoncheong: boolean;  // 본청 여부(광역)
  totalWon: number;      // 교육관련지원 총액
  eduSubsidyWon: number; // 교육경비보조금
  byType: Record<string, number>; // 구분별 합계
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sp = request.nextUrl.searchParams;
  const region = sp.get('region') ?? '';
  const fyr = sp.get('fyr') ?? '2026';

  if (!REGIONS.has(region)) {
    return NextResponse.json({ error: '지원하지 않는 지역입니다.' }, { status: 400 });
  }
  if (!/^\d{4}$/.test(fyr)) {
    return NextResponse.json({ error: '회계연도가 올바르지 않습니다.' }, { status: 400 });
  }

  const key = process.env.LOFIN_API_KEY;
  if (!key) {
    return NextResponse.json({ error: '서버에 지방재정365 인증키가 설정되지 않았습니다. (LOFIN_API_KEY)' }, { status: 503 });
  }

  const cacheKey = `${region}:${fyr}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) {
    return NextResponse.json(hit.data);
  }

  const PAGE = 1000; // 지방재정365 1회 최대 1,000건

  async function fetchPage(pIndex: number): Promise<{ rows: Row[]; total: number; err?: string }> {
    const params = new URLSearchParams({
      Key: key as string, Type: 'json', pIndex: String(pIndex), pSize: String(PAGE), fyr, wa_laf_hg_nm: region,
    });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(`${BASE}?${params.toString()}`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return { rows: [], total: 0, err: `지방재정365 응답 오류 (${res.status})` };
    const json = await res.json();
    if (json.RESULT) return { rows: [], total: 0, err: json.RESULT?.[0]?.MESSAGE ?? '데이터 없음' };
    const block = Array.isArray(json.EUSPBG) ? json.EUSPBG : [];
    const headArr: { list_total_count?: number }[] = block.find((b: { head?: unknown }) => b.head)?.head ?? [];
    const total = headArr.find((h) => h.list_total_count != null)?.list_total_count ?? 0;
    const rows: Row[] = (block.find((b: { row?: Row[] }) => b.row)?.row) ?? [];
    return { rows, total };
  }

  try {
    const first = await fetchPage(1);
    if (first.err && first.rows.length === 0) {
      // INFO-200(데이터없음)도 빈 목록으로 정상 처리
      return NextResponse.json({ region, fyr, municipalities: [], regionTotalWon: 0, message: first.err });
    }
    const rows: Row[] = [...first.rows];
    const totalPages = Math.ceil((first.total || rows.length) / PAGE);
    for (let p = 2; p <= totalPages && p <= 6; p++) {
      const pg = await fetchPage(p);
      rows.push(...pg.rows);
    }

    // 자치단체별 집계
    const map = new Map<string, Muni>();
    let regionTotalWon = 0;
    for (const r of rows) {
      const won = Number(r.bdg_amt) || 0;
      regionTotalWon += won;
      const full = r.laf_hg_nm ?? '';
      const name = full.startsWith(region) ? full.slice(region.length) : full;
      const m = map.get(name) ?? { name, isBoncheong: name === '본청', totalWon: 0, eduSubsidyWon: 0, byType: {} };
      m.totalWon += won;
      if (r.ref_mttr_cn === '교육경비보조금') m.eduSubsidyWon += won;
      m.byType[r.ref_mttr_cn] = (m.byType[r.ref_mttr_cn] ?? 0) + won;
      map.set(name, m);
    }

    const municipalities = [...map.values()].sort((a, b) => {
      if (a.isBoncheong) return -1;
      if (b.isBoncheong) return 1;
      return b.totalWon - a.totalWon;
    });

    const data = { region, fyr, regionTotalWon, municipalities, message: '' };
    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL });
    if (cache.size > 100) cache.clear();
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error && e.name === 'AbortError' ? '요청 시간 초과' : '지방재정365 연결 실패';
    return NextResponse.json({ error: msg }, { status: 504 });
  }
}
