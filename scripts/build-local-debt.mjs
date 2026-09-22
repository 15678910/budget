#!/usr/bin/env node
// scripts/build-local-debt.mjs
// 지방재정365 결산 채무잔액 원자료(data/regional/local-debt/all.csv)를 읽어
// src/lib/data/local-debt-official.ts (억원 단위, 2018~2024)를 생성한다.
// 실행: node scripts/build-local-debt.mjs
// 원자료가 없으면 python scripts/fetch-lofin-debt.py 를 먼저 실행하라는 안내와 함께 종료한다.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV_PATH = join(ROOT, 'data/regional/local-debt/all.csv');
const SOURCE_MD_PATH = join(ROOT, 'data/regional/local-debt/_source.md');
const OUT_PATH = join(ROOT, 'src/lib/data/local-debt-official.ts');

const OFFICIAL_DEBT_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024];

const SIDO_ABBR = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(CSV_PATH)) {
  fail(
    `원자료를 찾을 수 없습니다: ${CSV_PATH}\n` +
      '먼저 다음 명령으로 원자료를 수집하세요: python scripts/fetch-lofin-debt.py',
  );
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines.shift();
  if (header !== 'year,name,debt_won,budget_won,ratio_pct') {
    fail(`예상하지 못한 CSV 헤더입니다: ${header}`);
  }
  return lines.map((line) => {
    const [year, name, debtWon, budgetWon, ratioPct] = line.split(',');
    return {
      year: Number(year),
      name,
      debtWon: Number(debtWon),
      budgetWon: Number(budgetWon),
      ratioPct: Number(ratioPct),
    };
  });
}

function toEok(won) {
  return Math.round((won / 1e8) * 10) / 10;
}

function parseNameKey(key) {
  const prefix = key.slice(0, 2);
  if (!SIDO_ABBR.includes(prefix)) {
    fail(`시도 약칭을 알 수 없는 이름입니다: ${key}`);
  }
  const rest = key.slice(2);
  const name = rest === '본청' ? '본청' : rest;
  const level = rest === '본청' ? 'metro' : 'basic';
  return { region: prefix, name, level };
}

const rows = parseCsv(readFileSync(CSV_PATH, 'utf8'));

const rowsByYear = new Map();
for (const row of rows) {
  if (!OFFICIAL_DEBT_YEARS.includes(row.year)) continue;
  if (!rowsByYear.has(row.year)) rowsByYear.set(row.year, new Map());
  rowsByYear.get(row.year).set(row.name, row);
}

const rows2024 = rows.filter((r) => r.year === 2024);
if (rows2024.length === 0) {
  fail('원자료에 2024년 데이터가 없습니다.');
}

const entities = rows2024.map((row2024) => {
  const key = row2024.name;
  const { region, name, level } = parseNameKey(key);
  const debtEok = [];
  const budgetEok = [];
  for (const year of OFFICIAL_DEBT_YEARS) {
    const yearRows = rowsByYear.get(year);
    const r = yearRows ? yearRows.get(key) : undefined;
    debtEok.push(r ? toEok(r.debtWon) : null);
    budgetEok.push(r ? toEok(r.budgetWon) : null);
  }
  return { key, region, name, level, debtEok, budgetEok };
});

const sourceMd = readFileSync(SOURCE_MD_PATH, 'utf8');
const fetchedAtMatch = sourceMd.match(/수집일\s*(\d{4}-\d{2}-\d{2})/);
if (!fetchedAtMatch) {
  fail(`${SOURCE_MD_PATH}에서 수집일을 찾을 수 없습니다.`);
}
const fetchedAt = fetchedAtMatch[1];

const OFFICIAL_DEBT_SOURCE = {
  title: '지방재정365 지방재정통합공시 — 예산대비채무비율(결산기준, 지표 A015) 자치단체별',
  url: 'https://www.lofin365.go.kr/portal/LF2220000.do?fyr=2024&byatcClsTy=LCTSSTL21&pfaIndcCd=A015&rgnzDvCd=02&tab=gov',
  fetchedAt,
  note: '채무잔액=통합회계(일반회계+공기업특별회계+기타특별회계+기금). 산정공식 (채무잔액÷최종예산액)×100.',
};

const entityLines = entities
  .map((e) => `  { key: ${JSON.stringify(e.key)}, region: ${JSON.stringify(e.region)}, name: ${JSON.stringify(e.name)}, level: ${JSON.stringify(e.level)}, debtEok: ${JSON.stringify(e.debtEok)}, budgetEok: ${JSON.stringify(e.budgetEok)} },`)
  .join('\n');

const output = `// 자동생성 파일 — 수동 편집 금지.
// 생성 명령: node scripts/build-local-debt.mjs
// 원자료: data/regional/local-debt/all.csv (scripts/fetch-lofin-debt.py 로 수집)
// 출처: ${OFFICIAL_DEBT_SOURCE.title}
// URL: ${OFFICIAL_DEBT_SOURCE.url}
// 수집일: ${fetchedAt}
// 산정공식: 억원 = Math.round(원 / 1e8 * 10) / 10 (소수 1자리). 채무비율(%) = (채무잔액 ÷ 최종예산액) × 100.
// 단위: debtEok, budgetEok 모두 억원. 원자료 없는 해는 null.

export const OFFICIAL_DEBT_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024] as const;
export type OfficialDebtYear = (typeof OFFICIAL_DEBT_YEARS)[number];

export interface OfficialDebtEntity {
  /** 원자료 이름 그대로. 예: '서울본청', '경기수원시' */
  key: string;
  /** 시도 약칭: 서울·부산·대구·인천·광주·대전·울산·세종·경기·강원·충북·충남·전북·전남·경북·경남·제주 */
  region: string;
  /** 광역이면 '본청', 기초면 자치단체명(예: '수원시') */
  name: string;
  level: 'metro' | 'basic';
  /** 억원, OFFICIAL_DEBT_YEARS 순서. 원자료 없는 해는 null */
  debtEok: (number | null)[];
  budgetEok: (number | null)[];
}

export const OFFICIAL_LOCAL_DEBT: readonly OfficialDebtEntity[] = [
${entityLines}
];

export const OFFICIAL_DEBT_SOURCE: { title: string; url: string; fetchedAt: string; note: string } = ${JSON.stringify(OFFICIAL_DEBT_SOURCE, null, 2)};
`;

writeFileSync(OUT_PATH, output, 'utf8');
console.log(`생성 완료: ${OUT_PATH} (${entities.length}개 자치단체)`);
