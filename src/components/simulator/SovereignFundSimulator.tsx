'use client';

import React, { useState, useMemo } from 'react';
import { DataSources } from '@/components/shared/DataSources';

// ============================================================
// 2026년 기준 공공부문 데이터
// ============================================================

const PUBLIC_SECTOR_TOTAL = 1500; // 조원 (중앙정부 728 + 공공기관 ~770)
const CENTRAL_GOVT = 728;         // 조원
const PUBLIC_CORP = 772;          // 조원 (공기업+준정부기관+기타공공기관)
const POPULATION = 51_350_000;    // 명
const GDP = 2742;                 // 조원
const NATIONAL_DEBT = 1415;       // 조원
const MANAGED_DEFICIT = 109;      // 조원 (관리재정수지 적자)

// 펀드 적립 시작 효율화율 임계값
const FUND_THRESHOLD = (MANAGED_DEFICIT / PUBLIC_SECTOR_TOTAL) * 100; // ~7.27%

// 노르웨이 국부펀드 참고 데이터
const NORWAY = {
  fundSize: '~$1.7조',
  fundSizeKRW: '~2,300조원',
  population: '~550만명',
  perCapita: '~$310,000',
  annualReturn: '~6.3%',
  withdrawalRule: '3%',
};

// ============================================================
// Sub-components
// ============================================================

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  subLabel,
  color,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  subLabel?: string;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm md:text-base text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-lg md:text-xl font-mono font-bold ${color}`}>
            {value}{unit}
          </span>
          {subLabel && <span className="text-xs md:text-sm text-gray-500">({subLabel})</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2.5 rounded-full appearance-none cursor-pointer bg-gray-800
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
      />
    </div>
  );
}

function Cell({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="border border-gray-800 p-3 md:p-4 min-w-0">
      <div className="text-xs md:text-sm text-gray-500 leading-tight truncate">{label}</div>
      <div className={`text-lg md:text-xl font-mono font-bold tabular-nums leading-tight truncate ${color}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] md:text-xs text-gray-600 leading-tight truncate">{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className={`col-span-full border border-gray-800 px-4 py-2 ${color}`}>
      <span className="text-xs md:text-sm font-semibold uppercase tracking-widest">
        {title}
      </span>
    </div>
  );
}

function InfoSection({ title, color, children, defaultOpen = false }: { title: string; color: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-800 rounded overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 ${color} hover:bg-gray-900/50 transition-colors text-left`}
      >
        <span className="text-xs md:text-sm font-semibold uppercase tracking-widest">{title}</span>
        <span className="text-gray-500 text-lg leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 py-4 md:px-5 md:py-5 border-t border-gray-800 bg-gray-950/50 space-y-4 text-sm md:text-base text-gray-400 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Formatting helpers
// ============================================================

/** Format 조원 amounts for display */
function formatJo(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}천조원`;
  }
  return `${value.toFixed(1)}조원`;
}

/** Format 만원 amounts for display */
function formatManWon(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}억원`;
  }
  return `${Math.round(value).toLocaleString('ko-KR')}만원`;
}

// ============================================================
// Main Component
// ============================================================

export function SovereignFundSimulator() {
  // === Slider states ===
  const [efficiencyRate, setEfficiencyRate] = useState(5);    // 효율화율 1~15%
  const [fundReturnRate, setFundReturnRate] = useState(7);     // 펀드 수익률 3~12%
  const [years, setYears] = useState(20);                      // 운용기간 5~50년
  const [withdrawalRate, setWithdrawalRate] = useState(4);     // 인출률 2~6%

  // === Simulation calculation ===
  const simulation = useMemo(() => {
    const annualSavings = PUBLIC_SECTOR_TOTAL * (efficiencyRate / 100); // 연간 절감액 (조원)
    const deficitCoverage = Math.min(annualSavings, MANAGED_DEFICIT);   // 적자 보전분
    const fundContribution = Math.max(0, annualSavings - deficitCoverage); // 펀드 적립액

    // Year-by-year fund growth
    const yearlyData: { year: number; fundSize: number; annualReturn: number; basicIncome: number }[] = [];
    let fundSize = 0;

    for (let y = 1; y <= years; y++) {
      fundSize = fundSize * (1 + fundReturnRate / 100) + fundContribution;
      const annualReturn = fundSize * (fundReturnRate / 100);
      const withdrawable = fundSize * (withdrawalRate / 100);
      const basicIncomePerPerson = (withdrawable * 1_000_000_000_000) / POPULATION; // 원/인
      const basicIncomeMonthly = basicIncomePerPerson / 12;
      // Convert to 만원
      const basicIncomeManWon = basicIncomeMonthly / 10_000;

      yearlyData.push({
        year: 2026 + y,
        fundSize,
        annualReturn,
        basicIncome: basicIncomeManWon, // 만원/월
      });
    }

    const finalYear = yearlyData[yearlyData.length - 1];

    return {
      annualSavings,
      deficitCoverage,
      fundContribution,
      yearlyData,
      finalFundSize: finalYear?.fundSize ?? 0,
      finalBasicIncome: finalYear?.basicIncome ?? 0,
      finalAnnualReturn: finalYear?.annualReturn ?? 0,
    };
  }, [efficiencyRate, fundReturnRate, years, withdrawalRate]);

  // Chart data: every 5 years + final year
  const chartData = simulation.yearlyData.filter((_, i) =>
    (i + 1) % 5 === 0 || i === simulation.yearlyData.length - 1
  );
  const maxFund = Math.max(...chartData.map(d => d.fundSize), 1);

  // Whether fund contribution is possible
  const hasFundContribution = simulation.fundContribution > 0;
  const thresholdPct = Math.ceil(FUND_THRESHOLD * 10) / 10; // Round up to 1 decimal

  return (
    <div className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
          AI기본사회 시뮬레이터
        </h1>
        <span className="text-xs md:text-sm text-gray-600">
          나라살림 효율화 계산기
        </span>
      </div>

      {/* ====== SECTION 1: 공공부문 현황 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-5">
        <SectionHeader title="공공부문 현황 Public Sector Overview" color="text-cyan-400" />
        <Cell
          label="공공부문 총규모"
          value={formatJo(PUBLIC_SECTOR_TOTAL)}
          color="text-cyan-400"
          sub="중앙정부 + 공공기관"
        />
        <Cell
          label="중앙정부 예산"
          value={formatJo(CENTRAL_GOVT)}
          color="text-cyan-400"
          sub="2026 세출예산"
        />
        <Cell
          label="공공기관"
          value={formatJo(PUBLIC_CORP)}
          color="text-cyan-400"
          sub="공기업+준정부+기타"
        />
        <Cell
          label="국가채무"
          value={formatJo(NATIONAL_DEBT)}
          color="text-red-400"
          sub={`GDP 대비 ${((NATIONAL_DEBT / GDP) * 100).toFixed(1)}%`}
        />
        <Cell
          label="관리재정수지"
          value={`-${formatJo(MANAGED_DEFICIT)}`}
          color="text-amber-400"
          sub={`GDP 대비 -${((MANAGED_DEFICIT / GDP) * 100).toFixed(1)}%`}
        />
      </div>

      {/* ====== SECTION 2: 시뮬레이션 설정 (Sliders) ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-xs md:text-sm font-semibold uppercase tracking-widest text-blue-400 mb-3">
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="효율화율"
            value={efficiencyRate}
            min={1}
            max={15}
            step={0.5}
            unit="%"
            subLabel={`=${(PUBLIC_SECTOR_TOTAL * efficiencyRate / 100).toFixed(1)}조원/년`}
            color="text-blue-400"
            onChange={setEfficiencyRate}
          />
          <Slider
            label="펀드 수익률"
            value={fundReturnRate}
            min={3}
            max={12}
            step={0.5}
            unit="%"
            color="text-emerald-400"
            onChange={setFundReturnRate}
          />
          <Slider
            label="운용 기간"
            value={years}
            min={5}
            max={50}
            step={1}
            unit="년"
            color="text-purple-400"
            onChange={setYears}
          />
          <Slider
            label="인출률"
            value={withdrawalRate}
            min={2}
            max={6}
            step={0.5}
            unit="%"
            subLabel="지속가능 인출"
            color="text-amber-400"
            onChange={setWithdrawalRate}
          />
        </div>
      </div>

      {/* ====== SECTION 3: 효율화 결과 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader title="효율화 결과 Efficiency Results" color="text-blue-400" />
        <Cell
          label="연간 절감액"
          value={formatJo(simulation.annualSavings)}
          color="text-blue-400"
          sub={`공공부문 ${PUBLIC_SECTOR_TOTAL.toLocaleString('ko-KR')}조 x ${efficiencyRate}%`}
        />
        <Cell
          label="적자 보전"
          value={formatJo(simulation.deficitCoverage)}
          color="text-amber-400"
          sub={`관리재정적자 ${MANAGED_DEFICIT}조 중`}
        />
        <Cell
          label="펀드 적립"
          value={formatJo(simulation.fundContribution)}
          color={hasFundContribution ? 'text-emerald-400' : 'text-gray-600'}
          sub={hasFundContribution ? '연간 국부펀드 적립액' : '적자 보전 후 잔여 없음'}
        />
      </div>

      {/* Contextual message about threshold */}
      <div className="border border-gray-800 px-4 py-3">
        {!hasFundContribution ? (
          <p className="text-sm md:text-base text-amber-400/80">
            효율화 {efficiencyRate}%로는 적자({MANAGED_DEFICIT}조) 보전에 모두 사용됩니다.{' '}
            <span className="text-blue-400 font-semibold">{thresholdPct}% 이상</span>이면 펀드 적립이 시작됩니다.
          </p>
        ) : (
          <p className="text-sm md:text-base text-emerald-400/80">
            적자 {MANAGED_DEFICIT}조 해소 후 연간{' '}
            <span className="text-emerald-400 font-semibold">{simulation.fundContribution.toFixed(1)}조원</span>을
            국부펀드에 적립합니다.
          </p>
        )}
      </div>

      {/* ====== SECTION 4: N년 후 결과 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <SectionHeader
          title={`${years}년 후 결과 (${2026 + years}년)`}
          color="text-emerald-400"
        />
        <Cell
          label="펀드 규모"
          value={formatJo(simulation.finalFundSize)}
          color="text-emerald-400"
          sub={simulation.finalFundSize > 0 ? `GDP 대비 ${((simulation.finalFundSize / GDP) * 100).toFixed(0)}%` : undefined}
        />
        <Cell
          label="연간 수익"
          value={formatJo(simulation.finalAnnualReturn)}
          color="text-emerald-400"
          sub={`수익률 ${fundReturnRate}% 적용`}
        />
        <Cell
          label="월 기본소득"
          value={simulation.finalBasicIncome > 0 ? `${formatManWon(simulation.finalBasicIncome)}/월` : '0원/월'}
          color={simulation.finalBasicIncome > 0 ? 'text-emerald-400' : 'text-gray-600'}
          sub={`인출률 ${withdrawalRate}% / 인구 ${(POPULATION / 10000).toFixed(0)}만명`}
        />
        <Cell
          label="연 기본소득"
          value={simulation.finalBasicIncome > 0 ? `${formatManWon(simulation.finalBasicIncome * 12)}/년` : '0원/년'}
          color={simulation.finalBasicIncome > 0 ? 'text-emerald-400' : 'text-gray-600'}
          sub="1인당 연간 수령액"
        />
      </div>

      {/* ====== SECTION 5: 핵심 메시지 ====== */}
      <div className="border border-blue-900/50 bg-blue-950/30 p-4 md:p-5 rounded">
        <div className="text-xs md:text-sm font-semibold uppercase tracking-widest text-blue-400 mb-3">
          핵심 메시지 Key Takeaway
        </div>
        <p className="text-sm md:text-base text-gray-300 leading-relaxed">
          공공부문 {PUBLIC_SECTOR_TOTAL.toLocaleString('ko-KR')}조원의{' '}
          <span className="text-blue-400 font-bold">{efficiencyRate}%</span>를 효율화하면,
          연간 <span className="text-blue-400 font-bold">{simulation.annualSavings.toFixed(1)}조원</span>을
          절감하여 적자 <span className="text-amber-400 font-bold">{simulation.deficitCoverage.toFixed(1)}조원</span>을{' '}
          {simulation.deficitCoverage >= MANAGED_DEFICIT ? '해소' : '일부 보전'}하고,
          나머지 <span className="text-emerald-400 font-bold">{simulation.fundContribution.toFixed(1)}조원</span>을
          국부펀드에 적립할 수 있습니다.
          {simulation.finalBasicIncome > 0 && (
            <>
              {' '}{years}년 후 펀드 규모{' '}
              <span className="text-emerald-400 font-bold">{formatJo(simulation.finalFundSize)}</span>,
              월 기본소득{' '}
              <span className="text-emerald-400 font-bold">{formatManWon(simulation.finalBasicIncome)}</span> 가능.
            </>
          )}
        </p>
      </div>

      {/* ====== SECTION 6: 연도별 성장 그래프 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-xs md:text-sm font-semibold uppercase tracking-widest text-purple-400 mb-4">
          연도별 성장 추이 Fund Growth Timeline
        </div>
        <div className="space-y-2">
          {chartData.map((d) => (
            <div key={d.year} className="flex items-center gap-3 py-1">
              <span className="text-xs md:text-sm text-gray-500 w-12 text-right font-mono">{d.year}</span>
              <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                  style={{ width: `${(d.fundSize / maxFund) * 100}%` }}
                />
              </div>
              <span className="text-xs md:text-sm text-gray-400 w-20 text-right font-mono">
                {d.fundSize >= 1000 ? `${(d.fundSize / 1000).toFixed(1)}천조` : `${d.fundSize.toFixed(0)}조`}
              </span>
              <span className="text-xs md:text-sm text-emerald-400 w-24 text-right font-mono">
                월 {d.basicIncome > 0 ? `${Math.round(d.basicIncome).toLocaleString('ko-KR')}만원` : '0원'}
              </span>
            </div>
          ))}
        </div>
        {!hasFundContribution && (
          <p className="text-xs md:text-sm text-gray-600 mt-3 text-center">
            현재 효율화율({efficiencyRate}%)에서는 펀드 적립이 없어 그래프가 표시되지 않습니다.
          </p>
        )}
      </div>

      {/* ====== SECTION 7: 노르웨이 국부펀드 비교 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader title="참고: 노르웨이 국부펀드 Norway GPFG" color="text-gray-400" />
        <Cell
          label="펀드 규모"
          value={NORWAY.fundSize}
          color="text-gray-300"
          sub={NORWAY.fundSizeKRW}
        />
        <Cell
          label="1인당 규모"
          value={NORWAY.perCapita}
          color="text-gray-300"
          sub={NORWAY.population}
        />
        <Cell
          label="연간 수익률"
          value={NORWAY.annualReturn}
          color="text-gray-300"
          sub={`인출률 ${NORWAY.withdrawalRule}`}
        />
      </div>

      {/* ====== SECTION 8: 노르웨이 국부펀드 상세 설명 ====== */}
      <InfoSection title="노르웨이 국부펀드 운용 방식 상세 Norway GPFG Details" color="text-teal-400">
        <div>
          <h3 className="text-base md:text-lg font-bold text-teal-400 mb-2">노르웨이 정부연금기금 글로벌 (GPFG)</h3>
          <p>
            세계 최대 국부펀드인 노르웨이 GPFG는 1990년 설립되어 1996년부터 본격 운용을 시작했습니다.
            2024년 기준 약 <span className="text-teal-400 font-semibold">$1.7조 (약 2,300조원)</span> 규모로,
            인구 약 550만명의 노르웨이 국민 1인당 약 <span className="text-teal-400 font-semibold">$310,000 (약 4.2억원)</span>에 해당합니다.
          </p>
        </div>

        <div>
          <h4 className="text-sm md:text-base font-bold text-gray-300 mb-1.5">재원 조달</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-500">
            <li>북해 석유·가스 수입의 정부 몫 (세금, 로열티, 직접 지분)</li>
            <li>국영석유회사 Equinor 배당금</li>
            <li>석유 관련 수입의 대부분을 펀드에 직접 적립 (재정지출에 직접 사용하지 않음)</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm md:text-base font-bold text-gray-300 mb-1.5">운용 전략</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-gray-800 p-3 rounded">
              <div className="text-xs text-gray-500 mb-1">자산배분</div>
              <div className="text-sm font-mono text-gray-300">주식 70% / 채권 27% / 부동산 3%</div>
            </div>
            <div className="border border-gray-800 p-3 rounded">
              <div className="text-xs text-gray-500 mb-1">투자 지역</div>
              <div className="text-sm font-mono text-gray-300">전 세계 70개국, 9,000개+ 기업</div>
            </div>
            <div className="border border-gray-800 p-3 rounded">
              <div className="text-xs text-gray-500 mb-1">연평균 수익률</div>
              <div className="text-sm font-mono text-gray-300">6.3% (1998~2023 실질)</div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm md:text-base font-bold text-gray-300 mb-1.5">재정 준칙 (Fiscal Rule)</h4>
          <p className="text-gray-500">
            노르웨이는 <span className="text-amber-400 font-semibold">&quot;3% 인출 규칙&quot;</span>을 적용합니다.
            매년 정부 예산에 사용할 수 있는 금액은 펀드 총 규모의 약 3% (기대 실질수익률)로 제한됩니다.
            이는 원금을 유지하면서 수익분만 인출하는 &quot;영구기금(Perpetual Fund)&quot; 개념으로,
            미래 세대도 동일한 혜택을 누릴 수 있도록 설계되었습니다.
          </p>
        </div>

        <div>
          <h4 className="text-sm md:text-base font-bold text-gray-300 mb-1.5">거버넌스</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-500">
            <li><span className="text-gray-300">노르웨이 중앙은행 (Norges Bank)</span> 산하 투자관리국 (NBIM)이 운용</li>
            <li>재무부가 투자 가이드라인 설정, 의회가 최종 감독</li>
            <li>윤리위원회를 통해 인권·환경·부패 관련 기업 투자 배제</li>
            <li>모든 보유 종목, 수익률, 의결권 행사 내역 실시간 공개</li>
          </ul>
        </div>

        <div className="border-t border-gray-800 pt-3">
          <h4 className="text-sm md:text-base font-bold text-gray-300 mb-1.5">한국에 적용한다면?</h4>
          <p className="text-gray-500">
            한국은 석유 수입이 없으므로, 본 시뮬레이터는 <span className="text-blue-400 font-semibold">공공부문 효율화 절감액</span>을
            재원으로 가정합니다. AI·자동화를 통한 행정 효율화, 중복 기관 통합, 디지털 전환 등으로
            공공부문 비용을 절감하고, 그 절감분을 국부펀드에 적립하는 시나리오입니다.
          </p>
        </div>
      </InfoSection>

      {/* ====== SECTION 9: 시뮬레이션 전제 조건 ====== */}
      <InfoSection title="시뮬레이션 전제 조건 Simulation Assumptions" color="text-blue-400">
        <div>
          <h4 className="text-sm md:text-base font-bold text-gray-300 mb-1.5">기본 가정</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono text-sm mt-0.5 flex-shrink-0">01</span>
              <div>
                <span className="text-gray-300 font-semibold">공공부문 총 규모 1,500조원</span>
                <p className="text-gray-500 text-sm">중앙정부 예산 728조원 + 공공기관(공기업·준정부·기타) 772조원. 2026년 기준.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono text-sm mt-0.5 flex-shrink-0">02</span>
              <div>
                <span className="text-gray-300 font-semibold">관리재정수지 적자 109조원 우선 해소</span>
                <p className="text-gray-500 text-sm">효율화 절감액은 먼저 재정적자 보전에 사용됩니다. 적자 해소 후 잔여분만 펀드에 적립합니다.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono text-sm mt-0.5 flex-shrink-0">03</span>
              <div>
                <span className="text-gray-300 font-semibold">펀드 적립 시작 임계값 {thresholdPct}%</span>
                <p className="text-gray-500 text-sm">109조 ÷ 1,500조 ≈ 7.3%. 효율화율이 이 수치를 넘어야 펀드 적립이 시작됩니다.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono text-sm mt-0.5 flex-shrink-0">04</span>
              <div>
                <span className="text-gray-300 font-semibold">복리 성장 모델</span>
                <p className="text-gray-500 text-sm">매년 (전년 펀드잔액 × 수익률) + 신규 적립금으로 누적. 복리 효과로 장기 운용 시 기하급수적 성장.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono text-sm mt-0.5 flex-shrink-0">05</span>
              <div>
                <span className="text-gray-300 font-semibold">기본소득 = 인출액 ÷ 전 국민</span>
                <p className="text-gray-500 text-sm">펀드 × 인출률 = 연간 인출액. 이를 인구 {(POPULATION / 10000).toFixed(0)}만명으로 나눠 1인당 월 기본소득 산출.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-3">
          <h4 className="text-sm md:text-base font-bold text-gray-300 mb-1.5">한계 및 유의사항</h4>
          <ul className="list-disc list-inside space-y-1.5 text-gray-500 text-sm">
            <li>실제 효율화 달성률은 정치적·제도적 여건에 따라 제한될 수 있습니다</li>
            <li>펀드 수익률은 시장 상황에 따라 변동하며, 마이너스 수익이 발생할 수도 있습니다</li>
            <li>인플레이션을 고려하지 않은 명목 수치입니다 (실질 구매력은 다를 수 있음)</li>
            <li>인구 변동(고령화, 감소)을 반영하지 않으며, 고정 인구로 계산합니다</li>
            <li>효율화로 인한 고용 변화, 서비스 질 변화 등 부수 효과는 미반영</li>
            <li>거시경제 환경 변화(금리, 환율, GDP 성장률)는 고려하지 않습니다</li>
          </ul>
        </div>
      </InfoSection>

      {/* ====== SECTION 10: 파라미터 해설 ====== */}
      <InfoSection title="파라미터 해설 Parameter Guide" color="text-purple-400">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400 font-bold text-base">효율화율 (1~15%)</span>
            </div>
            <p className="text-gray-500 text-sm">
              공공부문 총 예산 대비 AI·자동화를 통해 절감할 수 있는 비율.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <div className="border border-gray-800 p-2 rounded">
                <div className="text-xs text-gray-500">보수적 (3~5%)</div>
                <div className="text-sm text-gray-400">단순 행정 자동화, 중복 업무 제거</div>
              </div>
              <div className="border border-gray-800 p-2 rounded">
                <div className="text-xs text-amber-400">중간 (7~10%)</div>
                <div className="text-sm text-gray-400">AI 도입, 기관 통합, 디지털 전환</div>
              </div>
              <div className="border border-gray-800 p-2 rounded">
                <div className="text-xs text-emerald-400">적극적 (10~15%)</div>
                <div className="text-sm text-gray-400">전면적 AI 행정, 조직 재설계</div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-400 font-bold text-base">펀드 수익률 (3~12%)</span>
            </div>
            <p className="text-gray-500 text-sm">연간 투자 수익률. 글로벌 분산투자 기준.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <div className="border border-gray-800 p-2 rounded">
                <div className="text-xs text-gray-500">보수적 (3~5%)</div>
                <div className="text-sm text-gray-400">채권 위주, 국민연금 수준</div>
              </div>
              <div className="border border-gray-800 p-2 rounded">
                <div className="text-xs text-amber-400">노르웨이 GPFG 실적 (~6.3%)</div>
                <div className="text-sm text-gray-400">주식 70%, 채권 27%, 부동산 3%</div>
              </div>
              <div className="border border-gray-800 p-2 rounded">
                <div className="text-xs text-emerald-400">적극적 (8~12%)</div>
                <div className="text-sm text-gray-400">주식 비중 확대, 대체투자 포함</div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-purple-400 font-bold text-base">운용 기간 (5~50년)</span>
            </div>
            <p className="text-gray-500 text-sm">
              펀드 적립 및 운용 기간. 복리 효과는 장기일수록 극적으로 커집니다.
              노르웨이 GPFG도 1996년 첫 적립 후 28년간 운용하여 현재 규모에 도달했습니다.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 font-bold text-base">인출률 (2~6%)</span>
            </div>
            <p className="text-gray-500 text-sm">
              펀드에서 매년 인출하여 기본소득으로 분배하는 비율.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <div className="border border-gray-800 p-2 rounded">
                <div className="text-xs text-emerald-400">영구 지속 가능 (3%)</div>
                <div className="text-sm text-gray-400">노르웨이 방식. 원금 보존, 실질수익률 이하 인출</div>
              </div>
              <div className="border border-gray-800 p-2 rounded">
                <div className="text-xs text-amber-400">균형 (4%)</div>
                <div className="text-sm text-gray-400">&quot;4% 룰&quot;. 미국 은퇴 연구 기반, 30년 지속 가능</div>
              </div>
              <div className="border border-gray-800 p-2 rounded">
                <div className="text-xs text-red-400">적극 인출 (5~6%)</div>
                <div className="text-sm text-gray-400">높은 분배, 원금 소진 위험 있음</div>
              </div>
            </div>
          </div>
        </div>
      </InfoSection>

      {/* ====== FOOTER: 데이터 출처 ====== */}
      <DataSources />
    </div>
  );
}
