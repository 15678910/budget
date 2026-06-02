import { NextRequest, NextResponse } from 'next/server';

// ─── 학교알리미 공시자료 셀프조회 프록시 ───
// 의원·시민이 시도/시군구/학교종류/공시항목을 선택하면 학교알리미 OpenAPI를
// 서버에서 호출(키 노출 방지)하여 학교 목록을 반환. 매년 반복 자료요구 셀프조회용.

const BASE = 'https://www.schoolinfo.go.kr/openApi.do';

interface CacheEntry { data: unknown; expiresAt: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30분

const ALLOWED_API_TYPES = new Set(['09', '62', '10', '08', '04', '90', '94', '43', '44', '34', '38', '56', '59', '27']);
const ALLOWED_KINDS = new Set(['02', '03', '04']);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sp = request.nextUrl.searchParams;
  const apiType = sp.get('apiType') ?? '';
  const year = sp.get('year') ?? '2024';
  const schulKndCode = sp.get('schulKndCode') ?? '';
  const sidoCode = sp.get('sidoCode') ?? '';
  const sggCode = sp.get('sggCode') ?? '';
  const depthNo = sp.get('depthNo') ?? '';
  const depthNo2 = sp.get('depthNo2') ?? '';

  // 입력 검증 (allowlist)
  if (!ALLOWED_API_TYPES.has(apiType)) {
    return NextResponse.json({ error: '지원하지 않는 공시항목입니다.' }, { status: 400 });
  }
  if (!ALLOWED_KINDS.has(schulKndCode)) {
    return NextResponse.json({ error: '학교종류를 선택해주세요.' }, { status: 400 });
  }
  if (!/^\d{2}$/.test(sidoCode) || !/^\d{5}$/.test(sggCode)) {
    return NextResponse.json({ error: '지역을 선택해주세요.' }, { status: 400 });
  }
  if (!/^\d{4}$/.test(year)) {
    return NextResponse.json({ error: '연도가 올바르지 않습니다.' }, { status: 400 });
  }

  const key = process.env.SCHOOLINFO_API_KEY;
  if (!key) {
    return NextResponse.json({ error: '서버에 학교알리미 인증키가 설정되지 않았습니다. (SCHOOLINFO_API_KEY)' }, { status: 503 });
  }

  const cacheKey = [apiType, year, schulKndCode, sidoCode, sggCode, depthNo, depthNo2].join(':');
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) {
    return NextResponse.json(hit.data);
  }

  // 학교알리미 호출 URL 구성
  const params = new URLSearchParams({
    apiKey: key, apiType, pbanYr: year, schulKndCode, sidoCode, sggCode,
  });
  if (depthNo) params.set('depthNo', depthNo);
  if (depthNo2) params.set('depthNo2', depthNo2);

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(`${BASE}?${params.toString()}`, { signal: ctrl.signal });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json({ error: `학교알리미 응답 오류 (${res.status})` }, { status: 502 });
    }
    const json = await res.json();
    if (json.resultCode !== 'success') {
      // 미공시·데이터없음 등은 빈 목록으로 정상 처리
      return NextResponse.json({ list: [], message: json.resultMsg ?? '해당 조건의 공시 데이터가 없습니다.' });
    }

    const data = { list: Array.isArray(json.list) ? json.list : [], message: '' };
    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL });
    if (cache.size > 200) cache.clear();
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error && e.name === 'AbortError' ? '요청 시간 초과' : '학교알리미 연결 실패';
    return NextResponse.json({ error: msg }, { status: 504 });
  }
}
