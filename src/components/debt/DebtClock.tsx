'use client';

import { useEffect, useRef, useState } from 'react';

// ============================================================
// 2026년 기준 데이터 (기획재정부 발표)
// ============================================================

// === 국가채무 ===
const NATIONAL_DEBT = 1_415_200_000_000_000; // 1,415.2조원 (D1 기준)
const DEBT_BASE_DATE = new Date('2026-01-01T00:00:00+09:00');
const YEARLY_DEBT_INCREASE = 71_000_000_000_000; // 연간 71조원 증가 (2025 대비)

// === 일반정부 부채 (D2, IMF 기준) ===
const GENERAL_GOVT_DEBT = 1_588_000_000_000_000; // ~1,588조원 (IMF 추정)
const D2_YEARLY_INCREASE = 80_000_000_000_000; // 연간 ~80조원 증가

// === 인구/가구 ===
const POPULATION = 51_111_158;
const HOUSEHOLDS = 24_312_758;

// === GDP ===
const GDP = 2_742_000_000_000_000; // 2,742조원

// === 세입 (Revenue) ===
// 총수입 = 국세수입 + 세외수입 + 기금수입
const TOTAL_REVENUE = 674_200_000_000_000; // 674.2조원
const TAX_REVENUE = 390_200_000_000_000; // 국세수입 390.2조원
const NON_TAX_REVENUE = 37_400_000_000_000; // 세외수입 37.4조원
const FUND_REVENUE = 246_600_000_000_000; // 기금수입 246.6조원

// 국세 세목별 (합계 = 390.2조)
const TAX_ITEMS: { name: string; amount: number; glossary?: string }[] = [
  { name: '소득세', amount: 132_100_000_000_000, glossary: '소득세' },       // 132.1조 (확정)
  { name: '법인세', amount: 86_500_000_000_000, glossary: '법인세' },        // 86.5조 (확정)
  { name: '부가가치세', amount: 86_000_000_000_000, glossary: '부가가치세' }, // 86.0조
  { name: '교통·에너지·환경세', amount: 15_400_000_000_000 },                // 15.4조
  { name: '상속·증여세', amount: 13_600_000_000_000 },                       // 13.6조
  { name: '개별소비세', amount: 11_300_000_000_000 },                        // 11.3조
  { name: '관세', amount: 9_000_000_000_000 },                              // 9.0조
  { name: '교육세', amount: 5_500_000_000_000 },                            // 5.5조
  { name: '종합부동산세', amount: 5_000_000_000_000 },                       // 5.0조
  { name: '증권거래세', amount: 4_500_000_000_000 },                         // 4.5조
  { name: '주세', amount: 3_300_000_000_000 },                              // 3.3조
  { name: '인지세 등 기타', amount: 18_000_000_000_000 },                    // 18.0조
];

// === 세출 (Expenditure) - 16개 분야별 합계 = 728.3조 ≈ 728조 ===
const TOTAL_SPENDING = 728_000_000_000_000; // 728조원

// 분야별 세출 (budget-by-domain-2026.json 기준)
const SPENDING_ITEMS: { name: string; amount: number }[] = [
  { name: '사회복지', amount: 244_200_000_000_000 },
  { name: '교육', amount: 106_600_000_000_000 },
  { name: '일반·지방행정', amount: 98_800_000_000_000 },
  { name: '국방', amount: 65_800_000_000_000 },
  { name: '산업·중소기업·에너지', amount: 32_200_000_000_000 },
  { name: '교통·물류', amount: 28_900_000_000_000 },
  { name: '공공질서·안전', amount: 25_500_000_000_000 },
  { name: '농림수산', amount: 25_500_000_000_000 },
  { name: '보건', amount: 18_900_000_000_000 },
  { name: '환경', amount: 13_300_000_000_000 },
  { name: '과학기술', amount: 11_100_000_000_000 },
  { name: '문화·체육·관광', amount: 10_000_000_000_000 },
  { name: '외교·통일', amount: 6_700_000_000_000 },
  { name: '국토·지역개발', amount: 3_300_000_000_000 },
  { name: '통신', amount: 2_200_000_000_000 },
];

// 횡단 테마 (분야별 합계에 포함됨, 별도 표기)
const RND_SPENDING = 35_300_000_000_000; // R&D 35.3조 (여러 분야에 걸침)
const AI_SPENDING = 10_100_000_000_000; // AI 10.1조 (R&D의 일부)

// === 재정건전성 ===
const FISCAL_BALANCE = -53_800_000_000_000; // 통합재정수지 -53.8조
const MANAGED_BALANCE = -109_000_000_000_000; // 관리재정수지 -109조
const INTEREST_COST = 30_100_000_000_000; // 이자비용 30.1조

// === 경제지표 ===
const GDP_GROWTH = 1.9; // %
const INFLATION = 2.0; // %
const UNEMPLOYMENT = 2.8; // %
const BASE_RATE = 2.5; // 기준금리 %

// === 4대보험 ===
const PENSION_RATE = 9.5; // 국민연금
const HEALTH_RATE = 7.19; // 건강보험

// ============================================================
// 용어 해설 (Glossary)
// ============================================================

const GLOSSARY: Record<string, string> = {
  '국가채무(D1)':
    '중앙정부가 직접 상환 의무를 지는 채무. 국채, 차입금, 국고채무부담행위를 포함. 한국 정부 공식 기준.',
  '일반정부 부채(D2)':
    'IMF/OECD 국제비교 기준. 중앙정부+지방정부+사회보장기금의 부채를 모두 포함하므로 D1보다 큰 값.',
  '국세수입':
    '중앙정부가 국세기본법에 따라 징수하는 세금의 총액. 소득세, 법인세, 부가가치세, 상속증여세 등을 포함.',
  '세외수입':
    '국세와 기금수입을 제외한 정부 수입. 정부사업 수익, 벌과금, 국유재산 수입, 수수료 등. 총수입=국세+세외수입+기금수입.',
  '기금수입':
    '국민연금, 고용보험, 산재보험 등 각종 기금의 수입. 보험료 수입, 기금 운용수익 등을 포함.',
  '통합재정수지':
    '총수입에서 총지출을 뺀 값. 정부의 전체적인 재정 상황을 보여주는 지표. 사회보장성기금 포함.',
  '관리재정수지':
    '통합재정수지에서 사회보장성기금(국민연금 등) 수지를 제외한 값. 정부의 실질적 재정 건전성을 나타냄.',
  '물가상승률(CPI)':
    '소비자물가지수(Consumer Price Index) 상승률. 가계가 소비하는 상품·서비스의 가격 변동을 측정.',
  '경제성장률':
    '실질 국내총생산(GDP)의 전년 대비 증가율. 경제 전체의 생산 활동이 얼마나 성장했는지를 나타냄.',
  '기준금리':
    '한국은행이 금융기관과 거래할 때 기준이 되는 금리. 시중 금리, 대출금리, 예금금리 등에 영향.',
  'GDP':
    '국내총생산(Gross Domestic Product). 일정 기간 국내에서 생산된 모든 최종 재화와 서비스의 시장 가치 합계.',
  '소득세':
    '개인이 벌어들인 소득에 대해 부과하는 세금. 근로소득, 사업소득, 이자·배당소득, 양도소득 등에 과세.',
  '법인세':
    '법인(기업)의 소득에 대해 부과하는 세금. 과세표준 구간별 차등 세율 적용.',
  '부가가치세':
    '재화·서비스의 거래 과정에서 발생하는 부가가치에 부과하는 간접세. 현행 세율 10%.',
  '국민연금':
    '국가가 운영하는 공적 연금제도. 근로자와 사업주가 각각 부담하며, 노후소득 보장이 목적.',
  '건강보험':
    '국민건강보험공단이 운영하는 사회보험. 질병·부상의 진료비를 보장. 근로자와 사업주가 각각 부담.',
  '재정적자 비율':
    '관리재정수지 적자액이 GDP에서 차지하는 비율. 국제적으로 3% 이내를 재정건전성 기준으로 봄.',
};

// ============================================================
// Utilities
// ============================================================

const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;

function getElapsedFraction(): number {
  const now = new Date();
  const elapsedMs = now.getTime() - DEBT_BASE_DATE.getTime();
  return elapsedMs / 1000 / SECONDS_PER_YEAR;
}

function getCurrentDebt(): number {
  return NATIONAL_DEBT + getElapsedFraction() * YEARLY_DEBT_INCREASE;
}

function getCurrentD2Debt(): number {
  return GENERAL_GOVT_DEBT + getElapsedFraction() * D2_YEARLY_INCREASE;
}

/** Get a YTD accumulation of a yearly amount (linear interpolation through the year) */
function getYTDAmount(yearlyAmount: number): number {
  const now = new Date();
  const yearStart = new Date('2026-01-01T00:00:00+09:00');
  const yearEnd = new Date('2027-01-01T00:00:00+09:00');
  const totalMs = yearEnd.getTime() - yearStart.getTime();
  const elapsedMs = now.getTime() - yearStart.getTime();
  const fraction = Math.max(0, Math.min(1, elapsedMs / totalMs));
  return yearlyAmount * fraction;
}

/** Format as compact KRW with 조/억/만 */
function formatKRW(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000_000) {
    const jo = abs / 1_000_000_000_000;
    return `${sign}${jo.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}조원`;
  }
  if (abs >= 100_000_000) {
    const eok = abs / 100_000_000;
    return `${sign}${eok.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}억원`;
  }
  if (abs >= 10_000) {
    const man = abs / 10_000;
    return `${sign}${man.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}만원`;
  }
  return `${sign}${Math.floor(abs).toLocaleString('ko-KR')}원`;
}

/** Format raw won with commas */
function formatRawWon(amount: number): string {
  return Math.floor(amount).toLocaleString('ko-KR') + '원';
}

/** Format percentage */
function formatPct(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Format per-second rate */
function formatPerSecond(yearlyAmount: number): string {
  const perSec = yearlyAmount / SECONDS_PER_YEAR;
  if (perSec >= 100_000_000) {
    return `${(perSec / 100_000_000).toFixed(1)}억원/초`;
  }
  if (perSec >= 10_000) {
    return `${Math.round(perSec / 10_000).toLocaleString('ko-KR')}만원/초`;
  }
  return `${Math.round(perSec).toLocaleString('ko-KR')}원/초`;
}

// ============================================================
// Sub-components
// ============================================================

interface CellProps {
  label: string;
  value: string;
  color: string;
  sub?: string;
  glossaryKey?: string;
}

function Cell({ label, value, color, sub, glossaryKey }: CellProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltip = glossaryKey ? GLOSSARY[glossaryKey] : undefined;

  return (
    <div
      className="border border-gray-800 p-2 md:p-3 min-w-0 relative"
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="text-[10px] md:text-xs text-gray-500 leading-tight truncate flex items-center gap-1">
        {label}
        {tooltip && (
          <span className="inline-flex items-center justify-center w-3 h-3 rounded-full border border-gray-600 text-[8px] text-gray-500 cursor-help flex-shrink-0">
            ?
          </span>
        )}
      </div>
      <div
        className={`text-sm md:text-base font-mono font-bold tabular-nums leading-tight truncate ${color}`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[9px] md:text-[10px] text-gray-600 leading-tight truncate">
          {sub}
        </div>
      )}
      {/* Tooltip */}
      {showTooltip && tooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 md:w-72 p-2.5 bg-gray-800 border border-gray-600 rounded-lg shadow-xl text-[11px] text-gray-300 leading-relaxed pointer-events-none">
          <div className="font-semibold text-gray-100 mb-1 text-xs">{glossaryKey}</div>
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800" />
        </div>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  color: string;
}

function SectionHeader({ title, color }: SectionHeaderProps) {
  return (
    <div
      className={`col-span-full border border-gray-800 px-3 py-1.5 ${color}`}
    >
      <span className="text-[10px] md:text-xs font-semibold uppercase tracking-widest">
        {title}
      </span>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function DebtClock() {
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let lastUpdate = 0;

    function loop(timestamp: number) {
      if (timestamp - lastUpdate >= 100) {
        setTick((t) => t + 1);
        lastUpdate = timestamp;
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Suppress unused variable warning -- tick drives re-renders
  void tick;

  // === Computed values ===
  const debt = getCurrentDebt();
  const d2Debt = getCurrentD2Debt();
  const debtPerCapita = debt / POPULATION;
  const debtPerHousehold = debt / HOUSEHOLDS;
  const debtToGdp = (debt / GDP) * 100;
  const d2ToGdp = (d2Debt / GDP) * 100;
  const perSecIncrease = YEARLY_DEBT_INCREASE / SECONDS_PER_YEAR;

  // YTD accumulations (ticking through the year)
  const ytdRevenue = getYTDAmount(TOTAL_REVENUE);
  const ytdTax = getYTDAmount(TAX_REVENUE);
  const ytdNonTax = getYTDAmount(NON_TAX_REVENUE);
  const ytdFund = getYTDAmount(FUND_REVENUE);

  const ytdSpending = getYTDAmount(TOTAL_SPENDING);
  const ytdRnd = getYTDAmount(RND_SPENDING);
  const ytdAi = getYTDAmount(AI_SPENDING);

  const ytdInterest = getYTDAmount(INTEREST_COST);
  const ytdFiscalBalance = getYTDAmount(FISCAL_BALANCE);
  const ytdManagedBalance = getYTDAmount(MANAGED_BALANCE);
  const deficitToGdp = (Math.abs(MANAGED_BALANCE) / GDP) * 100;

  const taxPerCapita = TAX_REVENUE / POPULATION;
  const taxPerHousehold = TAX_REVENUE / HOUSEHOLDS;

  // Hero counter string
  const heroString = formatRawWon(debt);

  return (
    <div className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-3 py-2 text-center">
        <h1 className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-gray-400">
          대한민국 국가재정 실시간 현황판
        </h1>
        <p className="text-[10px] text-gray-600 mt-0.5">
          Republic of Korea National Fiscal Dashboard &mdash; 2026
        </p>
      </div>

      {/* ====== HERO: 국가채무 총액 ====== */}
      <div className="border border-gray-800 p-3 md:p-5 text-center">
        <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-1">
          국가채무 총액(D1) &middot; National Debt
        </div>
        <div
          className="text-3xl sm:text-4xl md:text-6xl font-mono font-bold text-red-500 tabular-nums leading-none tracking-tight"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`국가채무 총액: ${heroString}`}
        >
          {heroString}
        </div>
        <div className="text-[10px] md:text-xs text-gray-600 mt-1.5">
          ≈ {formatKRW(debt)}
        </div>
      </div>

      {/* ====== SECTION 1: 국가채무 상세 (Red) ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <SectionHeader title="국가채무 National Debt" color="text-red-500" />
        <Cell
          label="1인당 국가채무"
          value={formatRawWon(debtPerCapita)}
          color="text-red-500"
          sub={`인구 ${POPULATION.toLocaleString('ko-KR')}명`}
        />
        <Cell
          label="가구당 국가채무"
          value={formatRawWon(debtPerHousehold)}
          color="text-red-500"
          sub={`가구 ${HOUSEHOLDS.toLocaleString('ko-KR')}`}
        />
        <Cell
          label="GDP 대비 D1"
          value={formatPct(debtToGdp)}
          color="text-red-500"
          sub="기획재정부 기준"
          glossaryKey="국가채무(D1)"
        />
        <Cell
          label="GDP 대비 D2"
          value={formatPct(d2ToGdp)}
          color="text-red-400"
          sub="IMF/OECD 기준"
          glossaryKey="일반정부 부채(D2)"
        />
        <Cell
          label="연간 이자비용"
          value={formatKRW(INTEREST_COST)}
          color="text-red-400"
          sub={`YTD ${formatKRW(ytdInterest)}`}
        />
        <Cell
          label="초당 증가액"
          value={formatPerSecond(YEARLY_DEBT_INCREASE)}
          color="text-red-400"
          sub={`≈ ${Math.round(perSecIncrease).toLocaleString('ko-KR')}원`}
        />
      </div>

      {/* ====== SECTION 2A: 세입 총괄 (Green) ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <SectionHeader title="세입 Revenue (총수입 구성)" color="text-emerald-400" />
        <Cell
          label="총수입"
          value={formatKRW(TOTAL_REVENUE)}
          color="text-emerald-500"
          sub={`YTD ${formatKRW(ytdRevenue)}`}
        />
        <Cell
          label="국세수입"
          value={formatKRW(TAX_REVENUE)}
          color="text-emerald-400"
          sub={`YTD ${formatKRW(ytdTax)}`}
          glossaryKey="국세수입"
        />
        <Cell
          label="세외수입"
          value={formatKRW(NON_TAX_REVENUE)}
          color="text-emerald-400"
          sub={`YTD ${formatKRW(ytdNonTax)}`}
          glossaryKey="세외수입"
        />
        <Cell
          label="기금수입"
          value={formatKRW(FUND_REVENUE)}
          color="text-emerald-400"
          sub={`YTD ${formatKRW(ytdFund)}`}
          glossaryKey="기금수입"
        />
      </div>

      {/* ====== SECTION 2A-2: 국세 세목별 (Green) ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <SectionHeader title="국세수입 세목별 (합계 390.2조)" color="text-emerald-400" />
        {TAX_ITEMS.map((item) => (
          <Cell
            key={item.name}
            label={item.name}
            value={formatKRW(item.amount)}
            color="text-emerald-400"
            sub={`YTD ${formatKRW(getYTDAmount(item.amount))}`}
            glossaryKey={item.glossary}
          />
        ))}
      </div>

      {/* ====== SECTION 2B: 세출 - 분야별 전체 (Red) ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <SectionHeader title="세출 Expenditure (분야별)" color="text-red-400" />
        <Cell
          label="총지출"
          value={formatKRW(TOTAL_SPENDING)}
          color="text-red-500"
          sub={`YTD ${formatKRW(ytdSpending)}`}
        />
        {SPENDING_ITEMS.map((item) => (
          <Cell
            key={item.name}
            label={item.name}
            value={formatKRW(item.amount)}
            color="text-red-400"
            sub={`YTD ${formatKRW(getYTDAmount(item.amount))}`}
          />
        ))}
      </div>

      {/* ====== SECTION 2C: 횡단 테마 (Purple) ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <SectionHeader title="횡단 테마 (분야별 합계에 포함)" color="text-purple-400" />
        <Cell
          label="R&D (여러 분야 합산)"
          value={formatKRW(RND_SPENDING)}
          color="text-purple-400"
          sub={`YTD ${formatKRW(ytdRnd)}`}
        />
        <Cell
          label="AI (R&D 내)"
          value={formatKRW(AI_SPENDING)}
          color="text-purple-400"
          sub={`YTD ${formatKRW(ytdAi)}`}
        />
      </div>

      {/* ====== SECTION 3: 재정건전성 (Amber) ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader
          title="재정건전성 Fiscal Health"
          color="text-amber-400"
        />
        <Cell
          label="통합재정수지"
          value={formatKRW(FISCAL_BALANCE)}
          color="text-amber-400"
          sub={`YTD ${formatKRW(ytdFiscalBalance)}`}
          glossaryKey="통합재정수지"
        />
        <Cell
          label="관리재정수지"
          value={formatKRW(MANAGED_BALANCE)}
          color="text-amber-400"
          sub={`YTD ${formatKRW(ytdManagedBalance)}`}
          glossaryKey="관리재정수지"
        />
        <Cell
          label="재정적자 비율 (GDP)"
          value={formatPct(deficitToGdp)}
          color="text-amber-400"
          sub="관리재정수지 / GDP"
          glossaryKey="재정적자 비율"
        />
      </div>

      {/* ====== SECTION 4: 경제지표 (Cyan) ====== */}
      <div className="grid grid-cols-2 md:grid-cols-5">
        <SectionHeader
          title="경제지표 Economic Indicators"
          color="text-cyan-400"
        />
        <Cell
          label="GDP"
          value={formatKRW(GDP)}
          color="text-cyan-400"
          sub="명목 GDP"
          glossaryKey="GDP"
        />
        <Cell
          label="경제성장률"
          value={formatPct(GDP_GROWTH)}
          color="text-cyan-400"
          glossaryKey="경제성장률"
        />
        <Cell
          label="물가상승률"
          value={formatPct(INFLATION)}
          color="text-cyan-400"
          sub="CPI 기준"
          glossaryKey="물가상승률(CPI)"
        />
        <Cell
          label="실업률"
          value={formatPct(UNEMPLOYMENT)}
          color="text-cyan-400"
        />
        <Cell
          label="기준금리"
          value={formatPct(BASE_RATE)}
          color="text-cyan-400"
          sub="한국은행"
          glossaryKey="기준금리"
        />
      </div>

      {/* ====== SECTION 5: 국민 부담 (Orange) ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <SectionHeader
          title="국민 부담 Citizen Tax Burden"
          color="text-orange-400"
        />
        <Cell
          label="1인당 세부담"
          value={formatRawWon(taxPerCapita)}
          color="text-orange-400"
          sub="국세 / 인구"
        />
        <Cell
          label="가구당 세부담"
          value={formatRawWon(taxPerHousehold)}
          color="text-orange-400"
          sub="국세 / 가구수"
        />
        <Cell
          label="국민연금 요율"
          value={formatPct(PENSION_RATE)}
          color="text-orange-400"
          sub="근로자+사업주"
          glossaryKey="국민연금"
        />
        <Cell
          label="건강보험 요율"
          value={formatPct(HEALTH_RATE, 2)}
          color="text-orange-400"
          sub="근로자+사업주"
          glossaryKey="건강보험"
        />
      </div>

      {/* ====== FOOTER: 데이터 출처 ====== */}
      <div className="border border-gray-800 px-3 py-2">
        <div className="text-[9px] md:text-[10px] text-gray-600 text-center space-y-0.5">
          <p className="text-gray-500 font-semibold uppercase tracking-widest text-[8px] md:text-[9px] mb-1">
            데이터 출처 Sources
          </p>
          <p>
            기획재정부 2026년 예산안 (2025.08) &middot; 국회예산정책처 (NABO)
            &middot; 통계청 인구통계 (2026.01) &middot; 한국은행 경제전망
            &middot; IMF World Economic Outlook
          </p>
          <p className="text-gray-700">
            * D1(국가채무)은 기획재정부 기준, D2(일반정부 부채)는 IMF/OECD 기준입니다.
            usdebtclock.org 등 해외 사이트는 D2 기준을 사용합니다.
          </p>
          <p className="text-gray-700">
            * 실시간 카운터는 연간 수치를 선형 보간하여 표시합니다. 실제
            집행/징수 시점과 차이가 있을 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
