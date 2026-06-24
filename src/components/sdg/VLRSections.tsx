'use client';

import { TrafficBadge } from './TrafficBadge';
import { trafficColor } from '@/lib/sdg/scoring';
import type { VLRReport as VLRReportData } from '@/lib/sdg/vlr';

// VLR 6섹션의 렌더 전용 서브 컴포넌트(순수 렌더, 계산 없음).
// 메인 VLRReport.tsx를 300줄 이하로 유지하기 위해 분리.

function fmtNum(n: number): string {
  return n.toLocaleString('ko-KR');
}

/** 면책 박스 — 상시 표시(설계 명세 §8). */
export function Disclaimer() {
  return (
    <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 px-4 py-3 text-[13px] leading-relaxed text-amber-100/90">
      <strong className="text-amber-200">데이터 기반 자기진단입니다.</strong>{' '}
      본 리포트는 공개 통계에서 파생한 목표 대비 달성도(신호등)이며,{' '}
      <strong>정책의 인과관계를 주장하지 않습니다.</strong> 평가 방법은 SDSN/UN-Habitat VLR
      방법론과 K-SDGs(국가지속가능발전목표) 체계를 인용합니다. 상대순위가 아닌 목표값 대비
      달성도입니다.
    </div>
  );
}

function SectionTitle({ no, title }: { no: string; title: string }) {
  return (
    <h2 className="mb-3 flex items-baseline gap-2 text-lg font-bold text-foreground">
      <span className="text-sky-400">{no}</span>
      <span>{title}</span>
    </h2>
  );
}

export function ContextSection({ data }: { data: VLRReportData }) {
  const c = data.context;
  const rows: { label: string; value: string }[] = [
    { label: '인구', value: `${fmtNum(c.population)} 명` },
    { label: '예산규모', value: `${fmtNum(c.budget)} 억원` },
    { label: '재정자립도', value: `${c.independence}%` },
    { label: '재정자주도', value: `${c.autonomy}%` },
    { label: '채무비율', value: `${c.debtRatio}%` },
  ];
  return (
    <section className="vlr-section">
      <SectionTitle no="①" title="배경 · 지역 맥락" />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className="font-mono text-sm font-semibold text-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        {data.region} 광역자치단체의 지속가능발전 거버넌스 현황을 K-SDGs 체계에 따라 자기평가합니다.
      </p>
    </section>
  );
}

export function LocalizationSection({ data }: { data: VLRReportData }) {
  return (
    <section className="vlr-section">
      <SectionTitle no="②" title="SDG 지역화 현황" />
      <p className="text-sm leading-relaxed text-foreground/90">
        데이터 보유 목표{' '}
        <strong className="text-sky-300">{data.localization.dataGoalCount} / 17</strong>
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        {data.localization.methodologyNote}
      </p>
    </section>
  );
}

export function GoalProgressSection({ data }: { data: VLRReportData }) {
  return (
    <section className="vlr-section">
      <SectionTitle no="③" title="목표별 진행 현황 (17목표)" />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-1.5 pr-2 font-medium">목표</th>
              <th className="py-1.5 pr-2 font-medium">명칭</th>
              <th className="py-1.5 pr-2 font-medium">달성도</th>
              <th className="py-1.5 font-medium">상세</th>
            </tr>
          </thead>
          <tbody>
            {data.goalProgress.map((g) => (
              <tr key={g.goalNum} className="border-b border-border/40">
                <td className="py-1.5 pr-2 font-mono text-muted-foreground">{g.goalNum}</td>
                <td className="py-1.5 pr-2 text-foreground">{g.name}</td>
                <td className="py-1.5 pr-2">
                  {g.score !== null && g.light !== null ? (
                    <TrafficBadge score={g.score} light={g.light} size="sm" />
                  ) : (
                    <span className="text-xs text-muted-foreground">준비중</span>
                  )}
                </td>
                <td className="py-1.5 text-[12px] text-muted-foreground">
                  {g.repValueText ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PriorityList({
  title,
  goals,
  emptyText,
}: {
  title: string;
  goals: VLRReportData['priorities']['strengths'];
  emptyText: string;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      {goals.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {goals.map((g) => (
            <li
              key={g.goalNum}
              className="rounded-md border border-border/60 bg-background/40 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: trafficColor(g.light) }}
                  aria-hidden
                />
                <span className="text-sm font-medium text-foreground">
                  목표 {g.goalNum} · {g.name}
                </span>
                <TrafficBadge score={g.score} light={g.light} size="sm" />
              </div>
              {g.targets.length > 0 && (
                <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted-foreground">
                  <span className="font-mono text-muted-foreground/80">{g.targets[0].code}</span>{' '}
                  {g.targets[0].text}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PrioritiesSection({ data }: { data: VLRReportData }) {
  return (
    <section className="vlr-section">
      <SectionTitle no="④" title="우선 목표 심층 (강점 · 약점)" />
      <div className="grid gap-4 sm:grid-cols-2">
        <PriorityList
          title="강점 Top3 (달성도 상위)"
          goals={data.priorities.strengths}
          emptyText="데이터 보유 목표가 없습니다."
        />
        <PriorityList
          title="약점 Top3 (달성도 하위)"
          goals={data.priorities.weaknesses}
          emptyText="데이터 보유 목표가 없습니다."
        />
      </div>
    </section>
  );
}

export function MeansSection({ data }: { data: VLRReportData }) {
  const m = data.means;
  const rows: { label: string; value: string }[] = [
    { label: '예산규모', value: `${fmtNum(m.budget)} 억원` },
    { label: '재정자립도', value: `${m.independence}%` },
    { label: '재정자주도', value: `${m.autonomy}%` },
    { label: '채무비율', value: `${m.debtRatio}%` },
  ];
  return (
    <section className="vlr-section">
      <SectionTitle no="⑤" title="이행 수단 (재정)" />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className="font-mono text-sm font-semibold text-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        예산 규모와 자주재원(자립도·자주도) 대비 목표 이행 여력을 가늠하는 맥락입니다. 인과적
        효과를 의미하지 않습니다.
      </p>
    </section>
  );
}

export function LessonsSection({ data }: { data: VLRReportData }) {
  return (
    <section className="vlr-section">
      <SectionTitle no="⑥" title="교훈 · 향후 계획" />
      {data.lessons.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          점검이 필요한 약점 목표가 없거나 데이터가 부족합니다.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {data.lessons.map((l, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
              <span className="text-sky-400" aria-hidden>
                ▸
              </span>
              <span>{l}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
        위 권고는 달성도가 낮은 목표에 대한 점검 제안이며, 규칙 기반으로 자동 생성됩니다(자유 서술
        아님).
      </p>
    </section>
  );
}
