'use client';

import React, { useState, useMemo, useRef } from 'react';
import { DataSources } from '@/components/shared/DataSources';
import { PDFExportButton } from '@/components/shared/PDFExportButton';

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
        <span className="text-base text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-lg md:text-xl font-mono font-bold ${color}`}>
            {value}{unit}
          </span>
          {subLabel && <span className="text-sm text-gray-500">({subLabel})</span>}
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
      <div className="text-sm md:text-base text-gray-500 leading-tight truncate">{label}</div>
      <div className={`text-lg md:text-xl font-mono font-bold tabular-nums leading-tight truncate ${color}`}>
        {value}
      </div>
      {sub && <div className="text-xs md:text-sm text-gray-600 leading-tight truncate">{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className={`col-span-full border border-gray-800 px-4 py-2 ${color}`}>
      <span className="text-sm md:text-base font-semibold uppercase tracking-widest">
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
        <span className="text-sm md:text-base font-semibold uppercase tracking-widest">{title}</span>
        <span className="text-gray-500 text-lg leading-none">{open ? '\u2212' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 py-4 md:px-5 md:py-5 border-t border-gray-800 bg-gray-950/50 space-y-4 text-base text-gray-400 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Static Data
// ============================================================

interface LawPathItem {
  law: string;
  phase: string;
  readiness: number;
  prepMonths: number;
  description: string;
}

interface SpecialLawItem {
  law: string;
  introduced?: string;
  sponsor?: string;
  status: string;
  description: string;
}

interface OrdinanceItem {
  name: string;
  prepMonths: number;
  mandatory: boolean;
  description: string;
}

const CURRENT_LAW_PATH: LawPathItem[] = [
  { law: '지역신용보증재단법', phase: '확장', readiness: 90, prepMonths: 6, description: '기존 16개 지역신용보증재단의 업무 범위를 확대하여 소규모 직접 대출 기능을 추가. 조례 개정만으로 가능하며 가장 빠른 착수 경로.' },
  { law: '지방공기업법', phase: '활용', readiness: 85, prepMonths: 12, description: '지방공기업 형태로 금융 기능 수행. 직접 은행 설립은 아니지만 준금융기관으로 출발 가능.' },
  { law: '새마을금고법', phase: '협력', readiness: 70, prepMonths: 18, description: '자치단체와 새마을금고 간 협력 모델. 공공예치금 운용 협약을 통한 간접적 공공은행 효과.' },
  { law: '신용협동조합법', phase: '연계', readiness: 65, prepMonths: 24, description: '주민 참여형 신용협동조합 설립. 자치단체가 출자하고 주민이 조합원으로 참여하는 하이브리드 모델.' },
];

const SPECIAL_LAW_PATH: SpecialLawItem[] = [
  { law: '지역공공은행 특별법', introduced: '2025.01', sponsor: '송재봉 의원 (더불어민주당)', status: '국회 계류', description: '자치단체 51% 이상 지분 보유 의무화, 은행법 적용 예외, 시민사회 공동 거버넌스 구조 포함.' },
  { law: '은행법 예외조항', status: '개정 필요', description: '현행 은행법은 자치단체의 은행 과반 지분 소유를 허용하지 않음. 특별법 또는 은행법 개정 필요.' },
  { law: '의무예치 조항 (지방재정법)', status: '신설 필요', description: 'BND 모델의 핵심: 지방세수를 공공은행에 의무 예치하는 조항. 지방재정법 개정 또는 특별법에 포함.' },
];

const REQUIRED_ORDINANCES: OrdinanceItem[] = [
  { name: '공공은행 설립 조례', prepMonths: 6, mandatory: true, description: '공공은행의 설립 근거, 자본금 구성, 운영 원칙, 이사회 구성 등 기본 사항 규정' },
  { name: '공공자금 의무예치 조례', prepMonths: 12, mandatory: true, description: '지방세수 및 공공기금의 공공은행 의무예치 비율과 절차 규정' },
  { name: '지역화폐 연계 조례', prepMonths: 8, mandatory: false, description: '공공은행 발행 지역화폐의 유통, 캐시백, 가맹점 관리 규정' },
  { name: '주민참여 기여금 조례', prepMonths: 10, mandatory: false, description: '코스타리카 BPDC 모델 참조. 주민 급여 기여를 통한 자본 확충 근거' },
  { name: '지역자원 수익화 조례', prepMonths: 12, mandatory: false, description: '공유재산, 데이터, 재생에너지 수익의 공공은행 자본 전입 근거' },
];

// ============================================================
// Verdict configuration
// ============================================================

const verdictConfig = {
  fast: { label: '빠른 전환', emoji: '\uD83D\uDE80', bg: 'bg-emerald-900/40', border: 'border-emerald-700', text: 'text-emerald-400', desc: '특별법이 조기 제정되면 공공은행 설립을 신속하게 추진할 수 있습니다' },
  moderate: { label: '병행 추진', emoji: '\uD83D\uDCCB', bg: 'bg-amber-900/30', border: 'border-amber-700', text: 'text-amber-400', desc: '현행법 경로로 시작하면서 특별법 제정을 병행 추진하는 것이 최적입니다' },
  slow: { label: '현행법 우선', emoji: '\u23F3', bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-400', desc: '특별법 제정이 늦어지므로 현행법 경로를 우선 추진해야 합니다' },
};

// ============================================================
// Main Component
// ============================================================

export function LegalFrameworkGuide() {
  const [specialLawYear, setSpecialLawYear] = useState(2028);
  const contentRef = useRef<HTMLDivElement>(null);

  // === Calculation ===
  const result = useMemo(() => {
    const currentLawDuration = Math.max(...CURRENT_LAW_PATH.map(p => p.prepMonths));
    const currentLawEndYear = 2026 + Math.ceil(currentLawDuration / 12);

    const specialLawPrepMonths = 18;
    const specialLawBankYear = specialLawYear + Math.ceil(specialLawPrepMonths / 12);

    const mandatoryOrdinanceMonths = REQUIRED_ORDINANCES.filter(o => o.mandatory).reduce((max, o) => Math.max(max, o.prepMonths), 0);
    const allOrdinanceMonths = REQUIRED_ORDINANCES.reduce((max, o) => Math.max(max, o.prepMonths), 0);

    const optimalPath = specialLawYear <= 2028 ? 'special' : specialLawYear <= 2030 ? 'parallel' : 'current';
    const verdict = specialLawYear <= 2028 ? 'fast' : specialLawYear <= 2030 ? 'moderate' : 'slow';

    return {
      currentLawDuration, currentLawEndYear,
      specialLawPrepMonths, specialLawBankYear,
      mandatoryOrdinanceMonths, allOrdinanceMonths,
      optimalPath, verdict: verdict as keyof typeof verdictConfig,
    };
  }, [specialLawYear]);

  const v = verdictConfig[result.verdict];

  const optimalPathLabel = result.optimalPath === 'special' ? '특별법 경로' : result.optimalPath === 'parallel' ? '이중 경로 병행' : '현행법 경로';

  // Timeline data for dual visualization
  const currentLawMilestones = CURRENT_LAW_PATH.map(item => ({
    label: item.law.replace('법', ''),
    months: item.prepMonths,
  }));

  const maxOrdinanceMonths = Math.max(...REQUIRED_ORDINANCES.map(o => o.prepMonths));

  return (
    <div ref={contentRef} className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            법률 경로 가이드
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PDFExportButton targetRef={contentRef} filename="법률경로가이드" />
          <span className="text-sm md:text-base text-gray-600">
            지역공공은행 설립 법률 안내
          </span>
        </div>
      </div>

      {/* ====== SLIDER ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-purple-400 mb-3">
          시나리오 설정
        </div>
        <Slider
          label="특별법 제정 예상 시점"
          value={specialLawYear}
          min={2026}
          max={2035}
          step={1}
          unit="년"
          color="text-purple-400"
          onChange={setSpecialLawYear}
        />
      </div>

      {/* ====== VERDICT BANNER ====== */}
      <div className={`border ${v.border} ${v.bg} p-4 md:p-5 rounded`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{v.emoji}</span>
          <span className={`text-lg md:text-xl font-bold ${v.text}`}>{v.label}</span>
        </div>
        <p className="text-base text-gray-400">{v.desc}</p>
      </div>

      {/* ====== SECTION: 추진 일정 요약 ====== */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        <SectionHeader title="추진 일정 요약" color="text-cyan-400" />
        <Cell
          label="현행법 경로 소요"
          value={`${result.currentLawDuration}개월`}
          color="text-cyan-400"
          sub={`~${result.currentLawEndYear}년`}
        />
        <Cell
          label="특별법 경로 소요"
          value={`${result.specialLawPrepMonths}개월`}
          color="text-purple-400"
          sub={`${specialLawYear}년 제정 \u2192 ${result.specialLawBankYear}년 설립`}
        />
        <Cell
          label="최적 경로"
          value={optimalPathLabel}
          color={v.text}
          sub={v.label}
        />
      </div>

      {/* ====== SECTION: 이중 경로 타임라인 ====== */}
      <div className="space-y-0">
        <div className="border border-gray-800 px-4 py-2 text-cyan-400">
          <span className="text-sm md:text-base font-semibold uppercase tracking-widest">
            이중 경로 타임라인
          </span>
        </div>
        <div className="border border-gray-800 p-4 md:p-6 space-y-8">
          {/* Top track: 현행법 경로 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-sm font-semibold text-cyan-400 uppercase tracking-widest">현행법 경로</span>
              <span className="text-xs text-gray-600 ml-auto">2026년 착수</span>
            </div>
            <div className="relative">
              {/* Background track */}
              <div className="h-10 bg-gray-900 rounded-lg overflow-hidden flex">
                {currentLawMilestones.map((m, i) => {
                  const widthPct = (m.months / result.currentLawDuration) * 100;
                  const colors = [
                    'bg-cyan-800/60 border-r border-cyan-700/40',
                    'bg-cyan-700/50 border-r border-cyan-600/40',
                    'bg-cyan-600/40 border-r border-cyan-500/30',
                    'bg-cyan-500/30',
                  ];
                  return (
                    <div
                      key={i}
                      className={`h-full ${colors[i]} flex items-center justify-center relative`}
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="text-xs text-cyan-300 font-medium truncate px-1">{m.label}</span>
                    </div>
                  );
                })}
              </div>
              {/* Month labels below */}
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-gray-600 font-mono">0개월</span>
                <span className="text-xs text-gray-600 font-mono">6개월</span>
                <span className="text-xs text-gray-600 font-mono">12개월</span>
                <span className="text-xs text-gray-600 font-mono">18개월</span>
                <span className="text-xs text-gray-600 font-mono">24개월</span>
              </div>
            </div>
          </div>

          {/* Connector */}
          <div className="flex items-center gap-3 px-4">
            <div className="flex-1 border-t border-dashed border-gray-800" />
            <span className="text-xs text-gray-600 uppercase tracking-widest">vs</span>
            <div className="flex-1 border-t border-dashed border-gray-800" />
          </div>

          {/* Bottom track: 특별법 경로 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm font-semibold text-purple-400 uppercase tracking-widest">특별법 경로</span>
              <span className="text-xs text-gray-600 ml-auto">{specialLawYear}년 제정 기준</span>
            </div>
            <div className="relative">
              {/* Background track */}
              <div className="h-10 bg-gray-900 rounded-lg overflow-hidden flex">
                {/* Waiting period (if special law year > 2026) */}
                {specialLawYear > 2026 && (
                  <div
                    className="h-full bg-gray-800/80 border-r border-gray-700/50 flex items-center justify-center"
                    style={{ width: `${((specialLawYear - 2026) / ((specialLawYear - 2026) + 1.5 + 0.5)) * 100}%` }}
                  >
                    <span className="text-xs text-gray-500 font-medium truncate px-1">국회 심의 대기</span>
                  </div>
                )}
                {/* 특별법 제정 후 설립 준비 18개월 */}
                <div
                  className="h-full bg-purple-700/50 border-r border-purple-600/40 flex items-center justify-center"
                  style={{ width: `${(1.5 / ((specialLawYear - 2026) + 1.5 + 0.5)) * 100}%` }}
                >
                  <span className="text-xs text-purple-300 font-medium truncate px-1">설립 준비 18개월</span>
                </div>
                {/* 은행 출범 */}
                <div
                  className="h-full bg-purple-500/40 flex items-center justify-center"
                  style={{ width: `${(0.5 / ((specialLawYear - 2026) + 1.5 + 0.5)) * 100}%` }}
                >
                  <span className="text-xs text-purple-200 font-medium truncate px-1">출범</span>
                </div>
              </div>
              {/* Year labels below */}
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-gray-600 font-mono">2026</span>
                {specialLawYear > 2026 && (
                  <span className="text-xs text-purple-500 font-mono font-bold">{specialLawYear} 제정</span>
                )}
                <span className="text-xs text-gray-600 font-mono">{result.specialLawBankYear} 설립</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====== SECTION: 현행법 경로 상세 ====== */}
      <div className="space-y-0">
        <div className="border border-gray-800 px-4 py-2 text-cyan-400">
          <span className="text-sm md:text-base font-semibold uppercase tracking-widest">
            현행법 경로 상세
          </span>
        </div>
        <div className="space-y-1">
          {CURRENT_LAW_PATH.map((item, i) => (
            <div key={i} className="border border-gray-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-400 font-semibold">{item.law}</span>
                <span className="text-gray-500 text-sm">{item.phase} \u00B7 {item.prepMonths}개월</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">{item.description}</p>
              {/* Readiness bar */}
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-gray-600 w-16 flex-shrink-0">준비도</span>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                    style={{ width: `${item.readiness}%` }}
                  />
                </div>
                <span className="text-xs text-cyan-400 font-mono w-10 text-right">{item.readiness}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ====== SECTION: 특별법 경로 상세 ====== */}
      <div className="space-y-0">
        <div className="border border-gray-800 px-4 py-2 text-purple-400">
          <span className="text-sm md:text-base font-semibold uppercase tracking-widest">
            특별법 경로 상세
          </span>
        </div>
        <div className="space-y-1">
          {SPECIAL_LAW_PATH.map((item, i) => (
            <div key={i} className="border border-gray-800 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-purple-400 font-semibold">{item.law}</span>
                <span className="text-gray-500 text-sm">{item.status}</span>
              </div>
              {item.introduced && (
                <span className="text-xs text-gray-600">발의: {item.introduced} \u00B7 {item.sponsor}</span>
              )}
              <p className="text-gray-400 text-sm mt-2">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ====== SECTION: 필요 조례 체크리스트 ====== */}
      <div className="space-y-0">
        <div className="border border-gray-800 px-4 py-2 text-amber-400">
          <span className="text-sm md:text-base font-semibold uppercase tracking-widest">
            필요 조례 체크리스트
          </span>
        </div>
        <div className="space-y-1">
          {REQUIRED_ORDINANCES.map((item, i) => (
            <div key={i} className="border border-gray-800 p-3 flex items-center gap-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 ${item.mandatory ? 'text-rose-400 bg-rose-900/30 border border-rose-800' : 'text-gray-500 bg-gray-800/50 border border-gray-700'}`}>
                {item.mandatory ? '필수' : '선택'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm font-medium">{item.name}</span>
                  <span className="text-gray-600 text-xs flex-shrink-0">준비 {item.prepMonths}개월</span>
                </div>
                <p className="text-gray-500 text-xs mt-1 truncate">{item.description}</p>
              </div>
              {/* Small progress bar for prepMonths relative to max */}
              <div className="w-20 flex-shrink-0">
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.mandatory ? 'bg-rose-500' : 'bg-gray-600'}`}
                    style={{ width: `${(item.prepMonths / maxOrdinanceMonths) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ====== InfoSection: 파주시 사례 연구 ====== */}
      <InfoSection title="파주시 사례 연구" color="text-teal-400">
        <p>
          파주시는 2026년 1월 &lsquo;파주형 지역공공은행 추진 모델&rsquo; 연구용역을 발주했습니다.
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-gray-500">
          <li>
            <span className="text-gray-300 font-semibold">2-트랙 접근:</span> (a) 특별법 제정 시 완전 은행 모델, (b) 현행법 내 공공금융기관 모델
          </li>
          <li>
            <span className="text-gray-300 font-semibold">핵심 목표:</span> 지역자본의 역외 유출 방지 &mdash; 지역에서 모인 예금이 서울 본사로 빠져나가는 것을 막는 것
          </li>
          <li>
            <span className="text-gray-300 font-semibold">연구 완료 예정:</span> 2026년 3월
          </li>
          <li>
            <span className="text-gray-300 font-semibold">시사점:</span> 특별법 제정 여부와 무관하게 현행법 내에서 시작할 수 있는 경로가 존재함
          </li>
        </ul>
      </InfoSection>

      {/* ====== InfoSection: 해외 법률 사례 ====== */}
      <InfoSection title="해외 법률 사례" color="text-blue-400">
        <div className="space-y-3">
          <div className="border border-gray-800 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400 font-semibold text-sm">미국 캘리포니아 AB 857 (2019)</span>
            </div>
            <p className="text-gray-500 text-sm">최초로 도시/카운티에 공공은행 설립권 부여</p>
          </div>
          <div className="border border-gray-800 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400 font-semibold text-sm">미국 뉴욕 A6268 (2025)</span>
            </div>
            <p className="text-gray-500 text-sm">공공은행을 비영리법인/LLC/사업법인으로 설립 허용</p>
          </div>
          <div className="border border-gray-800 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400 font-semibold text-sm">독일 Sparkassen</span>
            </div>
            <p className="text-gray-500 text-sm">공법상 기관(Anstalten des &ouml;ffentlichen Rechts)으로 별도 법 체계</p>
          </div>
          <div className="border border-gray-800 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400 font-semibold text-sm">코스타리카 BPDC</span>
            </div>
            <p className="text-gray-500 text-sm">헌법적 자치기관으로 정부/은행법에서 독립</p>
          </div>
        </div>
      </InfoSection>

      {/* ====== InfoSection: 금융기관 협력 모델 ====== */}
      <InfoSection title="금융기관 협력 모델 (BND 도매은행)" color="text-cyan-400">
        <p>공공은행에 대한 기존 금융기관의 반발을 해소하는 핵심 전략입니다.</p>

        <p className="font-semibold text-gray-300 mt-2">BND(노스다코타 은행)의 도매은행 모델:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>시민 직접 대출 ❌ → 기존 은행 고객 빼앗기 없음</li>
          <li>지역은행 대출에 50~80% 참여 → 소규모 은행도 대형 대출 가능</li>
          <li>금리 보조 (최대 5%p 인하) → 지역은행의 경쟁력 향상</li>
          <li>결과: 노스다코타 = 미국 인구 대비 지역은행 밀집도 1위</li>
        </ul>

        <p className="font-semibold text-gray-300 mt-3">한국 적용 방안:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <div className="border border-gray-800 rounded p-3">
            <div className="text-sm text-red-400 font-semibold mb-1">❌ 경쟁 모델 (실패 경로)</div>
            <ul className="text-sm space-y-1">
              <li>• 시민 직접 대출 → 은행 반발</li>
              <li>• 예금 유치 경쟁 → 금리전쟁</li>
              <li>• 지점 개설 → 비용 과다</li>
            </ul>
          </div>
          <div className="border border-emerald-800 rounded p-3">
            <div className="text-sm text-emerald-400 font-semibold mb-1">✅ 협력 모델 (성공 경로)</div>
            <ul className="text-sm space-y-1">
              <li>• 신협·금고 대출 참여 → 동맹</li>
              <li>• 의무예치로 안정자금 확보</li>
              <li>• 소상공인 보증 확대 → 보완</li>
            </ul>
          </div>
        </div>

        <p className="mt-3">핵심 설득 메시지: <span className="text-cyan-400 font-semibold">&quot;공공은행은 당신의 경쟁자가 아니라, 당신을 더 강하게 만드는 파트너입니다&quot;</span></p>
      </InfoSection>

      {/* ====== InfoSection: 개발기금 활용 경로 ====== */}
      <InfoSection title="개발기금 활용 경로 (창원시 사례)" color="text-amber-400">
        <p>기존 「지역개발기금 설치 조례」를 공공은행 자본 조달의 법적 통로로 활용하는 방안입니다.</p>

        <p className="font-semibold text-gray-300 mt-2">조례 개정 방향:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <div className="border border-gray-800 rounded p-3">
            <div className="text-sm text-gray-500 font-semibold mb-1">현행 기금 재원</div>
            <ul className="text-sm space-y-1">
              <li>• 일반회계 전입금</li>
              <li>• 개발부담금</li>
              <li>• 이자수입</li>
              <li>• 차입금</li>
            </ul>
          </div>
          <div className="border border-emerald-800 rounded p-3">
            <div className="text-sm text-emerald-400 font-semibold mb-1">개정안 추가 재원</div>
            <ul className="text-sm space-y-1">
              <li>• 개발환수이익금 별도 적립</li>
              <li>• 지역화폐 경제효과 환류분</li>
              <li>• 공공자산 수익화 수입</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div className="border border-gray-800 rounded p-3">
            <div className="text-sm text-gray-500 font-semibold mb-1">현행 기금 용도</div>
            <ul className="text-sm space-y-1">
              <li>• 지역개발사업</li>
              <li>• 인프라 구축</li>
              <li>• 소규모 융자</li>
            </ul>
          </div>
          <div className="border border-emerald-800 rounded p-3">
            <div className="text-sm text-emerald-400 font-semibold mb-1">개정안 추가 용도</div>
            <ul className="text-sm space-y-1">
              <li>• 지역공공금융기관 출자</li>
              <li>• 소상공인 공공대출 재원</li>
              <li>• 지역화폐 발행·운영 지원</li>
            </ul>
          </div>
        </div>

        <p className="mt-3">이 방식은 <span className="text-amber-400 font-semibold">특별법 통과 전에도 조례 개정만으로 기금 적립이 가능</span>하다는 점이 핵심 장점입니다. 「개발이익 환수에 관한 법률」에 따라 개발부담금의 50%가 이미 지자체에 귀속되므로, 추가 법률 개정 없이 활용 가능합니다.</p>

        <p className="font-semibold text-gray-300 mt-3">3가지 재원의 현실성:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-emerald-400">개발환수이익금</strong> (현실성 높음): 법적 기반 존재, 조례 개정으로 활용 가능</li>
          <li><strong className="text-amber-400">화폐 공유부/시뇨리지</strong> (개념적 유효): 지역화폐 승수효과의 세수환류로 구체화, 공공은행+지역화폐 결합 시 실현</li>
          <li><strong className="text-purple-400">지역자원 수익화</strong> (단계적 접근): 공유재산·데이터·재생에너지 수익을 기금에 편입</li>
        </ul>
      </InfoSection>

      {/* ====== FOOTER: 데이터 출처 ====== */}
      <DataSources />
    </div>
  );
}
