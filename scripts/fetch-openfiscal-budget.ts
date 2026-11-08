/**
 * fetch-openfiscal-budget.ts
 *
 * 열린재정(openfiscaldata.go.kr) 재정상세통계 「세부사업 예산편성현황(총지출)」을
 * 회계연도별로 내려받아 기존 파이프라인(csv-to-json.ts → build-hierarchy.ts)이 읽는
 * 12열 CSV(data/raw/budget-{year}.csv)로 변환한다.
 *
 * 기준
 *   - 조회기준: 총지출 (ANEXP_INQ_STND_CD=1), 예산기금구분: 전체 (BDG_FND_DIV_CD=0)
 *   - 금액: 국회확정금액(천원) = 본예산. 정부안·전년도 금액은 쓰지 않는다.
 *   - 단위: 천원 → 백만원 (÷1,000, 소수 3자리까지 보존)
 *   - 국회확정금액이 0인 행(종료 사업 등)은 제외한다.
 *
 * 열 매핑 (열린재정 → CSV)
 *   FSCL_YY→회계연도, OFFC_NM(소관명)→부처명, FSCL_NM→회계명, FLD_NM→분야명(앱 표기로 정규화),
 *   SECT_NM→부문명, PGM_NM→프로그램명, ACTV_NM→단위사업명, SACTV_NM→세부사업명,
 *   예산구분 = 회계명에 '기금' 포함 시 '기금', 아니면 '예산'.
 *   분야코드 = 디지털예산회계 16개 분야 표준 코드(010~160).
 *   부문코드 = 원천에 없음 → 분야코드 + 분야 내 부문명 가나다순 2자리 일련번호(합성 코드, 화면 그룹 키 용도).
 *
 * Usage:
 *   tsx scripts/fetch-openfiscal-budget.ts                 # 2023~2026 수집
 *   tsx scripts/fetch-openfiscal-budget.ts 2025 2026       # 지정 연도만
 *   tsx scripts/fetch-openfiscal-budget.ts --input-dir DIR # 이미 받은 ofd-{year}.json 재사용(오프라인)
 *
 * Output: data/raw/budget-{year}.csv (UTF-8 BOM)
 */

import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

const ENDPOINT = 'https://www.openfiscaldata.go.kr/op/ko/sd/dtsStatsScol/gridExcelDownLoad.do';
const PAGE_URL = 'https://www.openfiscaldata.go.kr/op/ko/sd/UOPKOSDA01?odtId=5Y5A50K2L4CW2IRKI2J0F2C8T';
const ODT_ID = '5Y5A50K2L4CW2IRKI2J0F2C8T'; // 세부사업 예산편성현황(총지출)
const DS_ID = 'VW_OPFI940';
const PAGE_SIZE = 30000; // 연도당 약 1만 행 — 한 페이지로 충분
const TIMEOUT_MS = 60_000;
const MAX_RETRY = 3;
const DEFAULT_YEARS = [2023, 2024, 2025, 2026];

/** 열린재정 응답 1행 */
interface OpenFiscalRow {
  FSCL_YY: string;
  OFFC_NM: string;
  FSCL_NM: string;
  ACCT_NM?: string;
  FLD_NM: string;
  SECT_NM: string;
  PGM_NM: string;
  ACTV_NM: string;
  SACTV_NM: string;
  BZ_CLS_NM?: string;
  FIN_DE_EP_NM?: string;
  /** 국회확정금액(천원) — 본예산 */
  Y_YY_DFN_MEDI_KCUR_AMT: number | string;
  /** 정부안금액(천원) */
  Y_YY_MEDI_KCUR_AMT?: number | string;
  /** 전년도국회확정금액(천원) */
  Y_PREY_FIRST_KCUR_AMT?: number | string;
  PAGE_TOT_CNT?: number;
}

/** 분야 표준 코드 + 앱에서 쓰는 분야 표기 (src/lib/utils/colors.ts DOMAIN_COLORS 키와 일치) */
const DOMAIN_MAP: Readonly<Record<string, { code: string; name: string }>> = {
  '일반·지방행정': { code: '010', name: '일반·지방행정' },
  '공공질서및안전': { code: '020', name: '공공질서·안전' },
  '통일·외교': { code: '030', name: '외교·통일' },
  '국방': { code: '040', name: '국방' },
  '교육': { code: '050', name: '교육' },
  '문화및관광': { code: '060', name: '문화·체육·관광' },
  '환경': { code: '070', name: '환경' },
  '사회복지': { code: '080', name: '사회복지' },
  '보건': { code: '090', name: '보건' },
  '농림수산': { code: '100', name: '농림수산' },
  '산업·중소기업및에너지': { code: '110', name: '산업·중소기업·에너지' },
  '교통및물류': { code: '120', name: '교통·물류' },
  '통신': { code: '130', name: '통신' },
  '국토및지역개발': { code: '140', name: '국토·지역개발' },
  '과학기술': { code: '150', name: '과학기술' },
  '예비비': { code: '160', name: '예비비' },
};

function lookupDomain(name: string): { code: string; name: string } | undefined {
  return Object.hasOwn(DOMAIN_MAP, name) ? DOMAIN_MAP[name] : undefined;
}

const CSV_HEADER = [
  '회계연도', '부처명', '회계명', '분야명', '분야코드', '부문명', '부문코드',
  '프로그램명', '단위사업명', '세부사업명', '예산구분', '예산액',
] as const;

type CsvRow = Record<(typeof CSV_HEADER)[number], string>;

function parseArgs(argv: string[]): { years: number[]; inputDir: string | null } {
  let inputDir: string | null = null;
  const years: number[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--input-dir') {
      inputDir = argv[++i] ?? null;
      continue;
    }
    const n = Number(argv[i]);
    if (!Number.isInteger(n) || n < 2007 || n > 2100) {
      console.error(`[fetch-openfiscal] 잘못된 인자: ${argv[i]}`);
      process.exit(1);
    }
    years.push(n);
  }
  return { years: years.length ? years : DEFAULT_YEARS, inputDir };
}

function buildBody(year: number): string {
  return JSON.stringify({
    odtId: ODT_ID, dsId: DS_ID, rlsSvTyCd: 'S', odtSvSeq: '1',
    totalCnt: String(PAGE_SIZE), pageIndex: '1', pageSize: String(PAGE_SIZE), pageTotCnt: '0',
    traDataFextNm: 'CSV', selectWon: '', decimalPointLevel: '0', odtNm: '',
    BDG_FND_DIV_CD: '0', ANEXP_INQ_STND_CD: '1', FSCL_YY: String(year),
    OFFC_CD: '', FSCL_CD: '', ACCT_CD: '', FLD_CD: '', SECT_CD: '',
    PGM_NM: '', ACTV_NM: '', SACTV_NM: '', BZ_CLS_NM: '',
  });
}

async function fetchYear(year: number): Promise<OpenFiscalRow[]> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Referer: PAGE_URL },
        body: buildBody(year),
        signal: controller.signal,
        redirect: 'error',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as unknown;
      if (!Array.isArray(data)) throw new Error('응답이 배열이 아님');
      if (data.length === 0) throw new Error('빈 응답(연도 미제공 또는 요청 조건 오류)');
      const rows = data as OpenFiscalRow[];
      const total = rows[0].PAGE_TOT_CNT ?? rows.length;
      if (total > rows.length) throw new Error(`전체 ${total}행 중 ${rows.length}행만 수신 — PAGE_SIZE 확대 필요`);
      return rows;
    } catch (err) {
      lastError = err;
      console.warn(`[fetch-openfiscal] ${year} 시도 ${attempt}/${MAX_RETRY} 실패: ${String(err)}`);
      if (attempt < MAX_RETRY) await new Promise((r) => setTimeout(r, 3000 * attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`[fetch-openfiscal] ${year} 수집 실패: ${String(lastError)}`);
}

function loadLocal(dir: string, year: number): OpenFiscalRow[] {
  const file = path.join(dir, `ofd-${year}.json`);
  if (!fs.existsSync(file)) throw new Error(`[fetch-openfiscal] 파일 없음: ${file}`);
  const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as unknown;
  if (!Array.isArray(data)) throw new Error(`[fetch-openfiscal] 배열이 아님: ${file}`);
  return data as OpenFiscalRow[];
}

function toNumber(v: number | string | undefined): number {
  if (v === undefined || v === null) return 0;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** 천원 → 백만원 문자열 (소수 3자리, 불필요한 0 제거) */
function thousandWonToMillion(kw: number): string {
  return (kw / 1000).toFixed(3).replace(/\.?0+$/, '');
}

function convert(year: number, rows: OpenFiscalRow[]): { csv: string; kept: number; dropped: number; totalMillion: number } {
  const unknownDomains = new Set<string>();
  // 분야별 부문명 → 합성 부문코드 (가나다순)
  const sectorsByDomain = new Map<string, Set<string>>();
  for (const r of rows) {
    const d = lookupDomain(r.FLD_NM)?.code ?? '';
    if (!sectorsByDomain.has(d)) sectorsByDomain.set(d, new Set());
    sectorsByDomain.get(d)!.add(r.SECT_NM);
  }
  const sectorCode = new Map<string, string>();
  for (const [domainCode, names] of sectorsByDomain) {
    [...names].sort((a, b) => a.localeCompare(b, 'ko')).forEach((name, i) => {
      sectorCode.set(`${domainCode}::${name}`, `${domainCode}${String(i + 1).padStart(2, '0')}`);
    });
  }

  const out: CsvRow[] = [];
  let dropped = 0;
  let totalKw = 0;
  for (const r of rows) {
    const amountKw = toNumber(r.Y_YY_DFN_MEDI_KCUR_AMT);
    if (amountKw === 0) { dropped++; continue; }
    const domain = lookupDomain(r.FLD_NM);
    if (!domain) unknownDomains.add(r.FLD_NM);
    const domainCode = domain?.code ?? '';
    const accountName = (r.FSCL_NM ?? '').trim();
    out.push({
      회계연도: String(r.FSCL_YY ?? year),
      부처명: (r.OFFC_NM ?? '').trim(),
      회계명: accountName,
      분야명: domain?.name ?? (r.FLD_NM ?? '').trim(),
      분야코드: domainCode,
      부문명: (r.SECT_NM ?? '').trim(),
      부문코드: sectorCode.get(`${domainCode}::${r.SECT_NM}`) ?? '',
      프로그램명: (r.PGM_NM ?? '').trim(),
      단위사업명: (r.ACTV_NM ?? '').trim(),
      세부사업명: (r.SACTV_NM ?? '').trim(),
      예산구분: accountName.includes('기금') ? '기금' : '예산',
      예산액: thousandWonToMillion(amountKw),
    });
    totalKw += amountKw;
  }
  if (unknownDomains.size) {
    console.warn(`[fetch-openfiscal] ${year}: DOMAIN_MAP에 없는 분야 → 원문 유지, 코드 공백: ${[...unknownDomains].join(', ')}`);
  }
  const csv = '﻿' + Papa.unparse({ fields: [...CSV_HEADER], data: out.map((r) => CSV_HEADER.map((h) => r[h])) }, { newline: '\n' });
  return { csv, kept: out.length, dropped, totalMillion: totalKw / 1000 };
}

async function main(): Promise<void> {
  const { years, inputDir } = parseArgs(process.argv.slice(2));
  const outDir = path.join(process.cwd(), 'data', 'raw');
  fs.mkdirSync(outDir, { recursive: true });

  for (const year of years) {
    const rows = inputDir ? loadLocal(inputDir, year) : await fetchYear(year);
    const { csv, kept, dropped, totalMillion } = convert(year, rows);
    const outPath = path.join(outDir, `budget-${year}.csv`);
    fs.writeFileSync(outPath, csv, 'utf-8');
    console.log(
      `[fetch-openfiscal] ${year}: ${rows.length}행 수신 → ${kept}행 기록 (0원 ${dropped}행 제외), ` +
      `총지출 본예산 ${(totalMillion / 1_000_000).toFixed(1)}조원 → ${outPath}`,
    );
  }
}

main().catch((err) => {
  console.error(String(err));
  process.exit(1);
});
