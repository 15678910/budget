#!/usr/bin/env node
/**
 * K-SDGs 17목표·세부목표 수집 — 지속가능발전포털(ncsd.go.kr)
 * 산출물: public/data/ksdgs.json
 *   { collectedAt, source:'ncsd.go.kr', sourceUrl, goals: { "1": { num, title, targets:[{code,text,note?}] }, … "17":… } }
 *
 * robots.txt 확인됨: ncsd.go.kr 은 `Disallow: /search`만 → /ksdgs/goals 수집 허용. (출처표기 필수)
 *
 * 수집 방식: `/ksdgs/goals` 는 서버 렌더(SSR) HTML 이며 세부목표가 마크업에 포함됨(SPA 아님).
 *   - 목표:   <h3 class="h-tit-l">목표 N. {title}</h3>
 *   - 세부목표: <b>세부목표 N-M (보완|신설|신규)?</b>"{text}"</span>
 *   세부목표 코드는 K-SDGs 표기(예: 1-1, 8-3, 16-12). 일부 코드엔 한국어 주석(보완/신설/신규)이 붙음.
 *
 * ⚠️ 정직성 정책: 공식 실데이터를 신뢰성 있게 추출하지 못하면(목표 17 미충족, 세부목표 과소 등)
 *     가짜 데이터를 생성하지 않고 BLOCKED 로 종료(exit 2)한다.
 *
 * 사용: node scripts/fetch-ksdgs.mjs   (또는 npm run ksdgs:fetch)
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const SOURCE_URL = 'https://www.ncsd.go.kr/ksdgs/goals';
const SOURCE = 'ncsd.go.kr';
const UA = 'Mozilla/5.0 (compatible; budget-ai-ontology-fetch/1.0; +https://budget.ai.kr)';
const TIMEOUT = 15000;
const MIN_TARGETS = 100; // 공식 K-SDGs 세부목표 ≈ 118개. 과소 추출 시 실패로 간주.

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(TIMEOUT),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** SSR HTML → { goals: { num,title,targets:[{code,text,note?}] } }. 추출 실패 시 null 반환. */
function parse(html) {
  const goalRe = /<h3 class="h-tit-l">목표\s*(\d+)\.\s*([^<]+)<\/h3>/g;
  const goalMarks = [];
  let m;
  while ((m = goalRe.exec(html)) !== null) {
    goalMarks.push({ num: Number(m[1]), title: m[2].trim().replace(/\s+/g, ' '), at: m.index });
  }
  if (goalMarks.length !== 17) return null;

  // code = N-M, optional 한국어 주석 (보완/신설/신규 등), then quoted text up to </span>
  const tgtRe = /<b>세부목표\s*(\d+)-([0-9A-Za-z]+)\s*(\([가-힣]+\))?\s*<\/b>\s*["“]?([^<]*?)["”]?\s*<\/span>/g;
  const allTargets = [];
  while ((m = tgtRe.exec(html)) !== null) {
    const text = m[4].trim().replace(/\s+/g, ' ');
    if (!text) continue;
    allTargets.push({ code: `${m[1]}-${m[2]}`, note: m[3] ? m[3].replace(/[()]/g, '') : undefined, text, at: m.index });
  }
  if (allTargets.length < MIN_TARGETS) return null;

  const goals = {};
  goalMarks.forEach((g, idx) => {
    const start = g.at;
    const end = idx + 1 < goalMarks.length ? goalMarks[idx + 1].at : html.length;
    const targets = allTargets
      .filter((t) => t.at >= start && t.at < end)
      .map((t) => (t.note ? { code: t.code, text: t.text, note: t.note } : { code: t.code, text: t.text }));
    goals[String(g.num)] = { num: g.num, title: g.title, targets };
  });
  return goals;
}

(async () => {
  let html;
  try {
    html = await fetchHtml(SOURCE_URL);
  } catch (e) {
    fail('네트워크 오류로 HTML 을 가져오지 못했습니다.', { error: String(e?.message || e) });
    return;
  }

  const goals = parse(html);
  if (!goals) {
    fail('SSR HTML 에서 목표 17개·세부목표를 신뢰성 있게 추출하지 못했습니다(마크업 변경 가능).', {
      htmlBytes: html.length,
      hasGoalAnchor: /id="goal_01"/.test(html),
      sebumokpyoCount: (html.match(/세부목표/g) || []).length,
    });
    return;
  }

  const goalCount = Object.keys(goals).length;
  const targetCount = Object.values(goals).reduce((s, g) => s + g.targets.length, 0);
  if (goalCount !== 17 || targetCount < MIN_TARGETS) {
    fail(`검수 실패: 목표 ${goalCount}/17, 세부목표 ${targetCount}(<${MIN_TARGETS}).`, { goalCount, targetCount });
    return;
  }

  mkdirSync('public/data', { recursive: true });
  const out = { collectedAt: new Date().toISOString(), source: SOURCE, sourceUrl: SOURCE_URL, goals };
  writeFileSync('public/data/ksdgs.json', JSON.stringify(out, null, 2));

  // ── 검수 로그 ──
  console.error(`✅ 저장: public/data/ksdgs.json`);
  console.error(`   목표 ${goalCount}개, 세부목표 ${targetCount}개 (출처: ${SOURCE} ${SOURCE_URL})`);
  for (const k of Object.keys(goals).map(Number).sort((a, b) => a - b)) {
    const g = goals[String(k)];
    console.error(`   목표 ${k} ${g.title}: 세부목표 ${g.targets.length}개`);
  }
  const s = goals['1'].targets[0];
  console.error(`   샘플 — ${s.code}: ${s.text}`);
})();

/** 실패 보고 후 종료. 가짜 데이터를 절대 만들지 않는다. */
function fail(reason, detail) {
  console.error('\n================ BLOCKED ================');
  console.error(reason);
  console.error('가짜 데이터 생성 금지 정책에 따라 ksdgs.json 을 생성하지 않습니다.');
  console.error('진단:', JSON.stringify(detail, null, 2));
  process.exit(2);
}
