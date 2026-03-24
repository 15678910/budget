'use client';

import React, { useState } from 'react';
import { LawTimeline } from './LawTimeline';
import { CostCalculator } from './CostCalculator';

// ============================================================
// Types & constants
// ============================================================

type TabKey = 'overview' | 'calculator' | 'benchmark';

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'overview', label: 'AI기본법 해설', color: 'text-cyan-400' },
  { key: 'calculator', label: '도입비용 계산기', color: 'text-emerald-400' },
  { key: 'benchmark', label: '벤치마킹', color: 'text-amber-400' },
];

// ============================================================
// Overview tab: Accordion cards
// ============================================================

const LAW_PROVISIONS = [
  {
    id: 'article27',
    title: '1. 고영향 AI 신고제 (제27조)',
    content: '생명/안전/기본권에 영향을 미치는 AI는 사전 신고 의무. 지자체 행정 AI 시스템도 해당 가능.',
    color: 'text-red-400',
  },
  {
    id: 'article29',
    title: '2. AI 영향평가 (제29조)',
    content: '공공기관은 AI 도입 전 영향평가 실시 의무. 차별/편향/프라이버시 침해 여부 사전 검토.',
    color: 'text-orange-400',
  },
  {
    id: 'article30',
    title: '3. 알고리즘 투명성 (제30조)',
    content: 'AI 의사결정 과정에 대한 설명 의무. 민원인이 AI 판단 근거를 요청할 수 있음.',
    color: 'text-amber-400',
  },
  {
    id: 'article6',
    title: '4. AI 윤리 원칙 (제6조)',
    content: '인간 중심, 투명성, 공정성, 안전성, 책임성. 모든 공공 AI에 적용.',
    color: 'text-blue-400',
  },
  {
    id: 'article13',
    title: '5. AI 산업 진흥 (제13~18조)',
    content: '국가 AI 위원회 설치. AI 인재 양성, R&D 지원. 지자체 AI 클러스터 조성 가능.',
    color: 'text-emerald-400',
  },
  {
    id: 'article19',
    title: '6. 데이터 활용 (제19~21조)',
    content: '고품질 공공데이터 개방 의무. AI 학습용 데이터 제공 체계 구축.',
    color: 'text-purple-400',
  },
];

const CHECKLIST_ITEMS = [
  'AI 도입 시 영향평가 실시',
  '고영향 AI 시스템 신고',
  '알고리즘 투명성 보장 체계 구축',
  'AI 윤리 원칙 준수 계획 수립',
  'AI 담당 부서 또는 인력 지정',
  '공공데이터 AI 학습용 개방',
  'AI 민원 대응 절차 마련',
  'AI 활용 연차 보고서 작성',
];

function AccordionCard({ title, content, color }: { title: string; content: string; color: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-800 rounded overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/30 transition-colors text-left"
      >
        <span className={`text-sm md:text-base font-semibold ${color}`}>{title}</span>
        <span className="text-gray-500 text-lg leading-none shrink-0 ml-2">{open ? '\u2212' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-900/30 text-sm md:text-base text-gray-400 leading-relaxed">
          {content}
        </div>
      )}
    </div>
  );
}

function OverviewTab() {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(CHECKLIST_ITEMS.length).fill(false));

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  return (
    <div className="space-y-1">
      {/* Key Overview */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-cyan-400 mb-4">
          AI 기본법 핵심 개요
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-800 p-3 md:p-4">
            <div className="text-sm text-gray-500">시행일</div>
            <div className="text-lg font-mono font-bold text-blue-400">2026년 1월 22일</div>
          </div>
          <div className="border border-gray-800 p-3 md:p-4">
            <div className="text-sm text-gray-500">공식명</div>
            <div className="text-base font-bold text-gray-200">인공지능 기본법</div>
            <div className="text-xs text-gray-600">법률 제20733호</div>
          </div>
          <div className="border border-gray-800 p-3 md:p-4">
            <div className="text-sm text-gray-500">목적</div>
            <div className="text-sm text-gray-300 leading-relaxed">AI 산업 진흥 + 고위험 AI 규제 + 국민 권익 보호</div>
          </div>
        </div>
      </div>

      {/* Provisions Accordion */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-cyan-400 mb-4">
          주요 조항
        </div>
        <div className="space-y-1">
          {LAW_PROVISIONS.map((p) => (
            <AccordionCard key={p.id} title={p.title} content={p.content} color={p.color} />
          ))}
        </div>
      </div>

      {/* Timeline */}
      <LawTimeline />

      {/* Checklist */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-cyan-400 mb-4">
          지자체 의무사항 체크리스트
        </div>
        <div className="space-y-2">
          {CHECKLIST_ITEMS.map((item, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={checkedItems[i]}
                onChange={() => toggleCheck(i)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0 cursor-pointer"
              />
              <span className={`text-sm md:text-base transition-colors ${checkedItems[i] ? 'text-emerald-400 line-through' : 'text-gray-400 group-hover:text-gray-300'}`}>
                {item}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-800 text-sm text-gray-500">
          완료: {checkedItems.filter(Boolean).length} / {CHECKLIST_ITEMS.length}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Benchmark tab
// ============================================================

const BENCHMARKS = [
  {
    name: '노스다코타 은행 (BND)',
    country: '미국',
    flag: '\u{1F1FA}\u{1F1F8}',
    established: 1919,
    description: '미국 유일의 주립 공공은행. 100년+ 운영, 누적 19억 달러 수익을 주 정부에 환원. AI 기반 대출심사 도입으로 부실률 50% 감소.',
    metric: '연간 수익 $1.7억',
    highlight: '공공은행 + AI = 수익 극대화',
  },
  {
    name: '노르웨이 GPFG',
    country: '노르웨이',
    flag: '\u{1F1F3}\u{1F1F4}',
    established: 1990,
    description: '세계 최대 주권부기금(1.7조 달러). AI 기반 투자 분석으로 연 6% 이상 수익률 유지. 국민 1인당 약 $30만 자산.',
    metric: '자산 $1.7조',
    highlight: 'AI + 주권부기금 = 국부 축적',
  },
  {
    name: '코스타리카 국립은행',
    country: '코스타리카',
    flag: '\u{1F1E8}\u{1F1F7}',
    established: 1914,
    description: '중미 최대 공공은행. 디지털 전환으로 모바일 뱅킹 이용률 80% 달성. 소액대출 AI 심사로 금융 포용성 확대.',
    metric: '금융포용률 92%',
    highlight: '디지털 전환 + 공공금융',
  },
  {
    name: '에스토니아 e-Government',
    country: '에스토니아',
    flag: '\u{1F1EA}\u{1F1EA}',
    established: 2001,
    description: 'GDP 2% 행정비용 절감. 99% 공공서비스 온라인화. AI 챗봇 "Bürokratt"로 민원 자동화율 40% 달성.',
    metric: 'GDP 2% 절감',
    highlight: 'AI 행정 = 비용 혁신',
  },
  {
    name: '행정안전부 지방재정 지능화',
    country: '한국',
    flag: '\u{1F1F0}\u{1F1F7}',
    established: 2026,
    description: '정책도움e에 생성형 AI 도입. 자연어 재정 질문 -> AI 분석/시각화. 2027년 국민 공개 예정. 예산 11억원.',
    metric: '2027년 공개',
    highlight: '우리 사이트가 이미 선도 중',
  },
];

const DOMESTIC_CASES = [
  { region: '서울시', field: 'AI 민원 챗봇, 교통 예측', year: '2024', budget: '150억' },
  { region: '세종시', field: '스마트시티 AI, 디지털트윈', year: '2025', budget: '80억' },
  { region: '경기도', field: 'AI 재정 분석, 복지 대상 발굴', year: '2025', budget: '120억' },
  { region: '부산시', field: 'AI 해양 모니터링, 관광 AI', year: '2024', budget: '90억' },
  { region: '인천시', field: '공항 AI, 스마트 교통', year: '2025', budget: '100억' },
];

const PLATFORM_VALUES = [
  { title: '재정 데이터 시각화', desc: '트리맵, 테이블, 지역비교' },
  { title: '20개+ 정책 시뮬레이터', desc: '공공은행, AI효율화, 건설세수 등' },
  { title: 'AI 정책 진단', desc: '지역 맞춤형 진단/처방' },
  { title: '시민 참여', desc: '정책 투표, 공약 검증' },
];

function BenchmarkTab() {
  return (
    <div className="space-y-1">
      {/* International Cases */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-amber-400 mb-4">
          해외 벤치마킹 사례
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {BENCHMARKS.map((b) => (
            <div key={b.name} className="border border-gray-800 rounded p-4 hover:bg-gray-900/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{b.flag}</span>
                <div>
                  <div className="text-sm md:text-base font-semibold text-gray-200">{b.name}</div>
                  <div className="text-xs text-gray-500">{b.country} / {b.established}년~</div>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">{b.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded">{b.metric}</span>
                <span className="text-xs text-gray-500 italic">{b.highlight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Domestic Cases Table */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-amber-400 mb-4">
          국내 선도 지자체 현황
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm md:text-base">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-3 text-gray-400 font-semibold">지자체</th>
                <th className="text-left py-2 px-3 text-gray-400 font-semibold">AI 도입 분야</th>
                <th className="text-left py-2 px-3 text-gray-400 font-semibold">시기</th>
                <th className="text-right py-2 px-3 text-gray-400 font-semibold">예산</th>
              </tr>
            </thead>
            <tbody>
              {DOMESTIC_CASES.map((c) => (
                <tr key={c.region} className="border-b border-gray-800 hover:bg-gray-900/30">
                  <td className="py-2.5 px-3 text-gray-200 font-medium">{c.region}</td>
                  <td className="py-2.5 px-3 text-gray-400">{c.field}</td>
                  <td className="py-2.5 px-3 text-gray-500">{c.year}</td>
                  <td className="py-2.5 px-3 text-amber-400 font-mono text-right">{c.budget}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform Value */}
      <div className="border border-cyan-900/50 bg-cyan-950/20 p-4 md:p-5 rounded">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-cyan-400 mb-4">
          마을살림/나라살림이 제공하는 가치
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {PLATFORM_VALUES.map((v, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-cyan-400 font-bold shrink-0">{i + 1}.</span>
              <div>
                <div className="text-sm md:text-base font-semibold text-gray-200">{v.title}</div>
                <div className="text-sm text-gray-500">{v.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-cyan-900/50 text-sm text-cyan-300/80 leading-relaxed">
          행정안전부가 2027년 공개 예정인 서비스를 이미 무료로 제공하고 있습니다.
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Dashboard
// ============================================================

export function AILawDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
        {/* Title */}
        <div id="ai-law-title" className="border border-gray-800 px-4 py-3">
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-200">
            AI 기본법 대응 가이드
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            AI 기본법 해설, 지자체 AI 도입 비용 계산기, 해외 벤치마킹
          </p>
        </div>

        {/* Tab bar */}
        <div id="ai-law-tabs" className="flex items-center gap-1 overflow-x-auto border border-gray-800 p-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? `${tab.color} bg-gray-800/60 font-semibold`
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div id="ai-law-content">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'calculator' && <CostCalculator />}
          {activeTab === 'benchmark' && <BenchmarkTab />}
        </div>
      </div>
    </div>
  );
}
