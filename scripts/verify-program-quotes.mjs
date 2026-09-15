#!/usr/bin/env node
/**
 * 사업 검토 데이터(`src/lib/programs/data/*.ts`)의 인용문이 원자료에 실제로 있는지 검사한다.
 *
 * 로컬 전용. 원자료(`data/mpb2027/**`)는 .gitignore에 있어 저장소에도 CI에도 없다.
 * 원자료가 없는 환경에서는 검사할 대상이 없다고 알리고 종료한다(실패로 보지 않는다).
 *
 *   node scripts/verify-program-quotes.mjs
 *
 * 규칙: 인용문은 PDF 추출 텍스트의 줄바꿈만 이어 붙인 것이므로, 양쪽 모두 연속 공백을
 * 하나로 줄여서 비교한다(1차). PDF가 단어 한가운데에서 줄을 바꾼 자리(「이차\n보전」,
 * 「확대(200\n→3,000대)」)는 공백 없이 붙이는 쪽이 읽히는 대로이므로, 1차에서 못 찾으면
 * 양쪽의 공백을 전부 지우고 한 번 더 본다(2차). 글자 자체의 차이는 두 단계 모두 잡는다.
 * 의존성 없음(Node 18+ ESM).
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'src', 'lib', 'programs', 'data');
const SOURCE_DIR = join(ROOT, 'data', 'mpb2027');

const normalize = (s) => s.replace(/\s+/g, ' ').trim();
const squeeze = (s) => s.replace(/\s+/g, '');

function walkTxt(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkTxt(full));
    else if (full.endsWith('.txt')) out.push(full);
  }
  return out;
}

/** 소스 위치에서 자바스크립트 문자열 리터럴 하나를 읽는다. 없으면 null */
function readStringLiteral(src, from) {
  let i = from;
  while (i < src.length && /\s/.test(src[i])) i += 1;
  const q = src[i];
  if (q !== "'" && q !== '"' && q !== '`') return null;
  let out = '';
  i += 1;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      const next = src[i + 1];
      out += next === 'n' ? '\n' : next === 't' ? '\t' : next;
      i += 2;
      continue;
    }
    if (c === q) return { value: out, end: i + 1 };
    out += c;
    i += 1;
  }
  return null;
}

/** 행 식별을 위해 인용문 앞쪽에서 가장 가까운 `id: '...'`를 찾는다 */
function nearestId(src, at) {
  const before = src.slice(0, at);
  const matches = [...before.matchAll(/\bid:\s*'([^']+)'/g)];
  return matches.length ? matches[matches.length - 1][1] : '(행 미상)';
}

/** `const ROUTE_LINE = { key: '...' } as const;` 의 값들 (quote로 간접 인용된다) */
function routeLineValues(src, file) {
  const start = src.indexOf('const ROUTE_LINE');
  if (start < 0) return [];
  const end = src.indexOf('} as const;', start);
  const block = src.slice(start, end < 0 ? src.length : end);
  const out = [];
  const re = /(\w+):\s*(?=['"`])/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    const lit = readStringLiteral(block, m.index + m[0].length);
    if (lit) out.push({ file, row: `ROUTE_LINE.${m[1]}`, quote: lit.value });
  }
  return out;
}

function collectQuotes() {
  const out = [];
  for (const entry of readdirSync(DATA_DIR)) {
    if (!entry.endsWith('.ts')) continue;
    const file = join(DATA_DIR, entry);
    const src = readFileSync(file, 'utf8');
    out.push(...routeLineValues(src, file));
    const re = /\bquote:\s*/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const lit = readStringLiteral(src, m.index + m[0].length);
      if (!lit) continue; // ROUTE_LINE.xxx 같은 식별자 참조 — 위에서 이미 검사한다
      out.push({ file, row: nearestId(src, m.index), quote: lit.value });
    }
  }
  return out;
}

function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.log(`원자료 디렉터리가 없습니다: ${relative(ROOT, SOURCE_DIR)}`);
    console.log('이 검사는 로컬 전용입니다(원자료는 저장소에 없습니다). 건너뜁니다.');
    return 0;
  }
  const sources = walkTxt(SOURCE_DIR).map((f) => {
    const raw = readFileSync(f, 'utf8');
    return { file: f, text: normalize(raw), squeezed: squeeze(raw) };
  });
  if (sources.length === 0) {
    console.log('원자료 .txt 파일이 없습니다. 건너뜁니다.');
    return 0;
  }

  const quotes = collectQuotes();
  const missing = [];
  let relaxed = 0;
  for (const q of quotes) {
    if (sources.some((s) => s.text.includes(normalize(q.quote)))) continue;
    if (sources.some((s) => s.squeezed.includes(squeeze(q.quote)))) {
      relaxed += 1; // 단어 한가운데의 줄바꿈을 공백 없이 이어 붙인 인용문
      continue;
    }
    missing.push(q);
  }

  console.log(`인용문 ${quotes.length}건 / 원자료 ${sources.length}개 파일 대조`);
  if (relaxed > 0) console.log(`(그중 ${relaxed}건은 줄바꿈 자리의 공백만 다름 — 통과)`);
  for (const m of missing) {
    console.log(`\n✗ ${relative(ROOT, m.file)} — ${m.row}`);
    console.log(`  「${m.quote}」`);
  }
  if (missing.length > 0) {
    console.log(`\n원자료에서 찾지 못한 인용문 ${missing.length}건.`);
    return 1;
  }
  console.log('모든 인용문이 원자료에 있습니다.');
  return 0;
}

process.exit(main());
