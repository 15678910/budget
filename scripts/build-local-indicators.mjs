#!/usr/bin/env node
// scripts/build-local-indicators.mjs
// 지방재정365 결산 지표 12종 원자료(data/regional/local-indicators/all.csv)를 읽어
// src/lib/data/local-indicators-official.ts (2019~2024, 자치단체별)를 생성한다.
// typeCd(lafTyCd)/peerCd(smrCmtyTyCd)는 all.csv에 값이 비어 있어
// 원자료 JSON(data/regional/local-indicators/A023_2024.json)에서 lafCd로 조인해 채운다.
// 실행: node scripts/build-local-indicators.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV_PATH = join(ROOT, 'data/regional/local-indicators/all.csv');
const SOURCE_MD_PATH = join(ROOT, 'data/regional/local-indicators/_source.md');
const TYPE_JSON_PATH = join(ROOT, 'data/regional/local-indicators/A023_2024.json');
const OUT_PATH = join(ROOT, 'src/lib/data/local-indicators-official.ts');

const INDICATOR_YEARS = [2019, 2020, 2021, 2022, 2023, 2024];

const SIDO_ABBR = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(CSV_PATH)) {
  fail(`원자료를 찾을 수 없습니다: ${CSV_PATH}`);
}
if (!existsSync(TYPE_JSON_PATH)) {
  fail(`원자료를 찾을 수 없습니다: ${TYPE_JSON_PATH}`);
}

const EXPECTED_HEADER =
  'code,name,year,lafNm,lafCd,waLafNm,lafTyCd,txrvAmt,epAmt,nfnlnAmt,itgPfinScalAmt,ccgbRt,selfRvAmt,txrvStlAmt,firRt,expsAmt,aneStlAmt,expsRt,smkdAvgRt,grsbAmt,amtRt,boe,boeRt,ecaAmt,yndEpRt,pvcnOutAmt,ctrtOutTottAmt,pvcnRt,gurDbtAmt,gurDbtRt,pvcpAmt,btlOpct,btoSprf,smkdAvgAmt,pryrPsntAmt,variAmt,fndCompAmt,thyUseAmt,thyPsntAmt,lclAsmbExps,lclAsmbExpsRt,qkexTrgtAmt,qkexGlsAmt,exeAmt,trgtAmtCprnExeRt,glsAmtRt';

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines.shift();
  if (header !== EXPECTED_HEADER) {
    fail(`예상하지 못한 CSV 헤더입니다: ${header}`);
  }
  const cols = header.split(',');
  const idx = Object.fromEntries(cols.map((c, i) => [c, i]));
  return lines.map((line) => {
    const f = line.split(',');
    return { fields: f, idx };
  });
}

function num(row, name) {
  const v = row.fields[row.idx[name]];
  if (v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function str(row, name) {
  const v = row.fields[row.idx[name]];
  return v === undefined || v === '' ? null : v;
}

// 지표 키 정의: key -> { code, name(한글), valueField, unit, avgField(있으면), note }
const INDICATOR_DEFS = [
  { key: 'fiscalBalance', code: 'A064', name: '통합재정수지비율', valueField: 'ccgbRt', unit: '%', avgField: null },
  { key: 'festival', code: 'A001', name: '행사축제경비비율', valueField: 'expsRt', unit: '%', avgField: 'smkdAvgRt' },
  { key: 'subsidy', code: 'A002', name: '지방보조금비율', valueField: 'amtRt', unit: '%', avgField: 'smkdAvgRt' },
  { key: 'entertainment', code: 'A003', name: '업무추진비비율', valueField: 'boeRt', unit: '%', avgField: 'smkdAvgRt' },
  { key: 'yearEnd', code: 'A013', name: '연말지출비율', valueField: 'yndEpRt', unit: '%', avgField: 'smkdAvgRt' },
  { key: 'privateContract', code: 'A026', name: '수의계약비율', valueField: 'pvcnRt', unit: '%', avgField: 'smkdAvgRt' },
  { key: 'guarantee', code: 'A030', name: '보증채무비율', valueField: 'gurDbtRt', unit: '%', avgField: 'smkdAvgRt' },
  { key: 'ppp', code: 'A032', name: '민자사업재정부담액', valueField: 'pvcpAmt', unit: '억원', avgField: null },
  { key: 'fundBalance', code: 'A023', name: '기금현재액', valueField: 'thyPsntAmt', unit: '억원', avgField: null },
  { key: 'council', code: 'A005', name: '지방의회경비비율', valueField: 'lclAsmbExpsRt', unit: '%', avgField: 'smkdAvgRt' },
  { key: 'independence', code: 'A060', name: '재정자립도(결산)', valueField: 'firRt', unit: '%', avgField: null },
  { key: 'quickExec', code: 'A046', name: '신속집행실적', valueField: 'trgtAmtCprnExeRt', unit: '%', avgField: null },
];

const INDICATOR_KEYS = INDICATOR_DEFS.map((d) => d.key);

function toEok(won) {
  if (won === null) return null;
  return Math.round((won / 1e8) * 10) / 10;
}

function round2(pct) {
  if (pct === null) return null;
  return Math.round(pct * 100) / 100;
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

// code -> year -> lafNm -> row
const byCodeYearName = new Map();
for (const row of rows) {
  const code = str(row, 'code');
  const year = Number(str(row, 'year'));
  const lafNm = str(row, 'lafNm');
  if (!byCodeYearName.has(code)) byCodeYearName.set(code, new Map());
  const byYear = byCodeYearName.get(code);
  if (!byYear.has(year)) byYear.set(year, new Map());
  byYear.get(year).set(lafNm, row);
}

// 자치단체 목록/순서 = A064 2024
const a064_2024 = rows.filter((r) => str(r, 'code') === 'A064' && Number(str(r, 'year')) === 2024);
if (a064_2024.length === 0) {
  fail('원자료에 A064 2024년 데이터가 없습니다.');
}

// typeCd/peerCd: A023_2024.json에서 lafCd로 조인
const typeJson = JSON.parse(readFileSync(TYPE_JSON_PATH, 'utf8'));
const typeArrKey = Object.keys(typeJson)[0];
const typeArr = typeJson[typeArrKey];
const typeByLafCd = new Map(typeArr.map((x) => [x.lafCd, x]));

const entities = a064_2024.map((row2024) => {
  const key = str(row2024, 'lafNm');
  const lafCd = str(row2024, 'lafCd');
  const { region, name, level } = parseNameKey(key);

  const typeInfo = typeByLafCd.get(lafCd);
  if (!typeInfo) {
    fail(`${TYPE_JSON_PATH}에서 lafCd=${lafCd}(${key})를 찾을 수 없습니다.`);
  }
  const typeCd = typeInfo.lafTyCd;
  const peerCd = typeInfo.smrCmtyTyCd;

  const values = {};
  const peerAvg = {};

  for (const def of INDICATOR_DEFS) {
    const yearValues = [];
    const yearAvgValues = [];
    let hasAnyAvg = false;
    for (const year of INDICATOR_YEARS) {
      const byYear = byCodeYearName.get(def.code);
      const yearRows = byYear ? byYear.get(year) : undefined;
      const r = yearRows ? yearRows.get(key) : undefined;
      const raw = r ? num(r, def.valueField) : null;
      const converted = def.unit === '억원' ? toEok(raw) : round2(raw);
      yearValues.push(converted);

      if (def.avgField) {
        const rawAvg = r ? num(r, def.avgField) : null;
        const convertedAvg = def.unit === '억원' ? toEok(rawAvg) : round2(rawAvg);
        yearAvgValues.push(convertedAvg);
        if (convertedAvg !== null) hasAnyAvg = true;
      }
    }
    values[def.key] = yearValues;
    if (def.avgField && hasAnyAvg) {
      peerAvg[def.key] = yearAvgValues;
    }
  }

  return { key, lafCd, region, name, level, typeCd, peerCd, values, peerAvg };
});

const sourceMd = readFileSync(SOURCE_MD_PATH, 'utf8');
const fetchedAtMatch = sourceMd.match(/수집일\s*(\d{4}-\d{2}-\d{2})/);
if (!fetchedAtMatch) {
  fail(`${SOURCE_MD_PATH}에서 수집일을 찾을 수 없습니다.`);
}
const fetchedAt = fetchedAtMatch[1];

const INDICATOR_SOURCE = {
  title: '지방재정365 지방재정통합공시 — 항목별 현황(결산기준) 자치단체별 지표 12종',
  url: 'https://www.lofin365.go.kr/portal/LF2220000.do?fyr=2024&byatcClsTy=LCTSSTL21&rgnzDvCd=02&tab=gov',
  fetchedAt,
  note: '지표 12종: A064 통합재정수지비율, A001 행사축제경비비율, A002 지방보조금비율, A003 업무추진비비율, A013 연말지출비율, A026 수의계약비율, A030 보증채무비율, A032 민자사업재정부담액, A023 기금현재액, A005 지방의회경비비율, A060 재정자립도(결산), A046 신속집행실적.',
};

function fmtNum(n) {
  return n === null ? 'null' : String(n);
}

function fmtArr(arr) {
  return `[${arr.map(fmtNum).join(',')}]`;
}

const entityLines = entities
  .map((e) => {
    const valuesStr = INDICATOR_KEYS.map((k) => `${k}:${fmtArr(e.values[k])}`).join(',');
    const peerAvgKeys = Object.keys(e.peerAvg);
    const peerAvgStr = peerAvgKeys.map((k) => `${k}:${fmtArr(e.peerAvg[k])}`).join(',');
    return `  { key:${JSON.stringify(e.key)},lafCd:${JSON.stringify(e.lafCd)},region:${JSON.stringify(e.region)},name:${JSON.stringify(e.name)},level:${JSON.stringify(e.level)},typeCd:${JSON.stringify(e.typeCd)},peerCd:${JSON.stringify(e.peerCd)},values:{${valuesStr}},peerAvg:{${peerAvgStr}} },`;
  })
  .join('\n');

const metaLines = INDICATOR_DEFS
  .map(
    (d) =>
      `  { key: ${JSON.stringify(d.key)}, code: ${JSON.stringify(d.code)}, name: ${JSON.stringify(d.name)}, unit: ${JSON.stringify(d.unit)}, valueField: ${JSON.stringify(d.valueField)}, note: ${JSON.stringify(`${d.name}(${d.code}) — 값 필드 ${d.valueField}${d.avgField ? `, 동종단체 평균 ${d.avgField}` : ''}`)} },`,
  )
  .join('\n');

const output = `// 자동생성 파일 — 수동 편집 금지.
// 생성 명령: node scripts/build-local-indicators.mjs
// 원자료: data/regional/local-indicators/all.csv (+ A023_2024.json — typeCd/peerCd 조인용)
// 출처: ${INDICATOR_SOURCE.title}
// URL: ${INDICATOR_SOURCE.url}
// 수집일: ${fetchedAt}
// 단위: % 지표는 소수 2자리, 억원 지표(ppp, fundBalance)는 억원 = Math.round(원 / 1e8 * 10) / 10 (소수 1자리).
// 원자료 없는 해/자치단체는 null. peerAvg는 원자료 smkdAvgRt가 전부 null인 지표는 키 자체를 생략.

export const INDICATOR_YEARS = [2019, 2020, 2021, 2022, 2023, 2024] as const;
export type IndicatorYear = (typeof INDICATOR_YEARS)[number];

export const INDICATOR_KEYS = ['fiscalBalance','festival','subsidy','entertainment','yearEnd','privateContract','guarantee','ppp','fundBalance','council','independence','quickExec'] as const;
export type IndicatorKey = (typeof INDICATOR_KEYS)[number];

export interface IndicatorMeta {
  key: IndicatorKey;
  code: string;
  name: string;
  unit: '%' | '억원';
  valueField: string;
  note: string;
}

export const INDICATOR_META: readonly IndicatorMeta[] = [
${metaLines}
];

export interface IndicatorEntity {
  /** 원자료 이름 그대로. 예: '서울본청', '경기수원시' */
  key: string;
  /** 7자리 자치단체 코드 */
  lafCd: string;
  /** 시도 약칭 */
  region: string;
  /** 광역이면 '본청', 기초면 자치단체명(예: '수원시') */
  name: string;
  level: 'metro' | 'basic';
  /** lafTyCd: '22' 광역 / '31' 시 / '32' 군 / '33' 자치구 */
  typeCd: string;
  /** smrCmtyTyCd: 동종단체 구분 코드, 예: '31A' */
  peerCd: string;
  /** values[indicatorKey][yearIndex], null when missing. % indicators keep 2 decimals; 억원 = Math.round(원/1e8*10)/10 */
  values: Record<IndicatorKey, (number | null)[]>;
  /** 동종단체 평균(smkdAvgRt) when the source provides it, same shape; keys without it are omitted */
  peerAvg: Partial<Record<IndicatorKey, (number | null)[]>>;
}

export const OFFICIAL_INDICATORS: readonly IndicatorEntity[] = [
${entityLines}
];

export const INDICATOR_SOURCE: { title: string; url: string; fetchedAt: string; note: string } = ${JSON.stringify(INDICATOR_SOURCE, null, 2)};
`;

writeFileSync(OUT_PATH, output, 'utf8');
console.log(`생성 완료: ${OUT_PATH} (${entities.length}개 자치단체, 지표 ${INDICATOR_KEYS.length}종)`);
