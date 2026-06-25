#!/usr/bin/env node
/**
 * UN 169 세부목표(공식 영문) 수집 — UN Statistics Division SDG API
 * 산출물: public/data/un-targets.json
 *   { source, url, fetchedAt, goals: { "1":[{code,en}], … "17":[{code,en}] } }
 *
 * 출처: UN Statistics Division SDG API — Target/List (A/RES/70/1, 2030 Agenda).
 *   GET https://unstats.un.org/sdgapi/v1/sdg/Target/List?includechildren=false
 *   → 169개 평면 배열, 각 { goal:"1", code:"1.1", title, description }.
 *   en = title(공식 영문, 축자). 목표(goal)별로 그룹화한다.
 *
 * ⚠️ 정직성 정책: 총 169개가 아니거나 목표 1~17 중 누락이 있으면
 *     가짜/부분 데이터를 생성하지 않고 BLOCKED 로 종료(exit 2)한다.
 *     네트워크 실패 시에도 기존 파일을 보존(덮어쓰기 금지)한다.
 *
 * 국문(ko): 본 스크립트는 공식 영문(en)만 수집한다. 비공식 참고 번역(ko)은
 *   public/data/un-targets.json 에 사람이 채워 넣으며, 기존 ko 값이 있으면 보존한다.
 *
 * 사용: node scripts/fetch-un-targets.mjs   (또는 npm run un-targets:fetch)
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';

const API_URL =
  'https://unstats.un.org/sdgapi/v1/sdg/Target/List?includechildren=false';
const SOURCE = 'UN Statistics Division SDG API (A/RES/70/1)';
const OUT_PATH = 'public/data/un-targets.json';
const UA =
  'Mozilla/5.0 (compatible; budget-ai-ontology-fetch/1.0; +https://budget.ai.kr)';
const TIMEOUT = 20000;
const EXPECTED_TOTAL = 169;

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/**
 * API 평면 배열 → { "1":[{code,en}], … }.
 * 검증 실패(총수≠169 또는 목표 1~17 누락) 시 null 반환.
 */
function normalize(list) {
  if (!Array.isArray(list)) return null;

  const flat = [];
  for (const item of list) {
    const goal = Number(item?.goal);
    const code = typeof item?.code === 'string' ? item.code.trim() : '';
    const en = typeof item?.title === 'string' ? item.title.trim().replace(/\s+/g, ' ') : '';
    if (!Number.isInteger(goal) || goal < 1 || goal > 17) return null;
    if (!/^\d+\.[0-9a-z]+$/.test(code)) return null;
    if (!en) return null;
    flat.push({ goal, code, en });
  }

  if (flat.length !== EXPECTED_TOTAL) return null;

  const goals = {};
  for (const t of flat) {
    const key = String(t.goal);
    if (!goals[key]) goals[key] = [];
    goals[key].push({ code: t.code, en: t.en });
  }

  // 목표 1~17 전부 존재 + 각 목표 ≥1개.
  for (let g = 1; g <= 17; g += 1) {
    const arr = goals[String(g)];
    if (!Array.isArray(arr) || arr.length === 0) return null;
  }

  return goals;
}

/** 기존 파일의 ko 값을 code 기준으로 읽어온다(보존용). 없으면 빈 맵. */
function readExistingKo() {
  const map = new Map();
  if (!existsSync(OUT_PATH)) return map;
  try {
    const prev = JSON.parse(readFileSync(OUT_PATH, 'utf8'));
    for (const arr of Object.values(prev?.goals ?? {})) {
      if (!Array.isArray(arr)) continue;
      for (const t of arr) {
        if (t && typeof t.code === 'string' && typeof t.ko === 'string' && t.ko) {
          map.set(t.code, t.ko);
        }
      }
    }
  } catch {
    // 손상된 기존 파일은 무시(새로 작성).
  }
  return map;
}

(async () => {
  let list;
  try {
    list = await fetchJson(API_URL);
  } catch (e) {
    // 네트워크 실패 → 기존 파일 보존(덮어쓰기 금지).
    fail('네트워크 오류로 UN SDG API 응답을 가져오지 못했습니다(기존 파일 보존).', {
      error: String(e?.message || e),
    });
    return;
  }

  const goals = normalize(list);
  if (!goals) {
    fail('UN SDG API 응답에서 169개·목표1~17 을 신뢰성 있게 추출하지 못했습니다(스키마 변경 가능).', {
      received: Array.isArray(list) ? list.length : typeof list,
    });
    return;
  }

  const total = Object.values(goals).reduce((s, arr) => s + arr.length, 0);
  if (total !== EXPECTED_TOTAL || Object.keys(goals).length !== 17) {
    fail(`검수 실패: 목표 ${Object.keys(goals).length}/17, 세부목표 ${total}(≠${EXPECTED_TOTAL}).`, {
      goalCount: Object.keys(goals).length,
      total,
    });
    return;
  }

  // 기존 비공식 ko 번역 보존(영문 갱신만, 번역은 사람이 유지).
  const koMap = readExistingKo();
  for (const arr of Object.values(goals)) {
    for (const t of arr) {
      const ko = koMap.get(t.code);
      if (ko) t.ko = ko;
    }
  }

  mkdirSync('public/data', { recursive: true });
  const out = {
    source: SOURCE,
    url: API_URL,
    fetchedAt: new Date().toISOString(),
    goals,
  };
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

  // ── 검수 로그 ──
  console.error(`✅ 저장: ${OUT_PATH}`);
  console.error(`   목표 17개, UN 세부목표 ${total}개 (출처: ${SOURCE})`);
  for (let g = 1; g <= 17; g += 1) {
    const arr = goals[String(g)];
    console.error(`   목표 ${g}: ${arr.length}개`);
  }
  const s = goals['1'][0];
  console.error(`   샘플 — ${s.code}: ${s.en}`);
  const koCount = Object.values(goals)
    .flat()
    .filter((t) => typeof t.ko === 'string' && t.ko).length;
  console.error(`   비공식 국문(ko) 보존: ${koCount}/${total}`);
})();

/** 실패 보고 후 종료. 가짜/부분 데이터를 절대 만들지 않는다. */
function fail(reason, detail) {
  console.error('\n================ BLOCKED ================');
  console.error(reason);
  console.error('가짜/부분 데이터 생성 금지 정책에 따라 un-targets.json 을 덮어쓰지 않습니다.');
  console.error('진단:', JSON.stringify(detail, null, 2));
  process.exit(2);
}
