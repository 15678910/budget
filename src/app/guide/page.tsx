import type { Metadata } from 'next';
import Link from 'next/link';
import {
  NAV_CARDS,
  VIZ_FEATURES,
  ANALYSIS_FEATURES,
  SIM_FEATURES,
  TIPS,
  type FeatureItem,
  type SimItem,
} from './data';

export const metadata: Metadata = {
  title: '기능 소개 및 작동 방법 | 마을살림/나라살림',
  description:
    '마을살림/나라살림의 모든 기능을 한눈에 파악하세요. 예산 시각화, 분석 도구, AI 시뮬레이터, 시민 참여 기능의 사용 방법을 단계별로 안내합니다.',
};

// ─── Sub-components ───

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2 border-l-2 border-gray-700 pl-4">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-400 leading-relaxed">
          <span className="shrink-0 font-semibold text-gray-500">{i + 1}.</span>
          {step}
        </li>
      ))}
    </ol>
  );
}

function RouteBadge({ route }: { route: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-gray-800 text-gray-400 border border-gray-700">
      {route}
    </span>
  );
}

function FeatureCard({ f, linkColor }: { f: FeatureItem; linkColor: string }) {
  return (
    <div className="border border-border rounded-2xl p-5 space-y-4 bg-muted/30">
      <div className="flex items-start justify-between gap-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${f.accentBg} ${f.accent}`}>
          {f.icon}
        </div>
        <RouteBadge route={f.routeLabel} />
      </div>
      <div>
        <h3 className={`text-base font-semibold ${f.accent} mb-1`}>{f.title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">작동 방법</p>
        <StepList steps={f.steps} />
      </div>
      <Link
        href={f.route}
        className={`inline-flex items-center gap-1.5 text-xs ${linkColor} transition-colors`}
      >
        페이지로 이동
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

function SimCard({ f }: { f: SimItem }) {
  return (
    <div className="border border-border rounded-2xl p-5 space-y-4 bg-muted/30">
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-500/10 text-purple-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <RouteBadge route={f.routeLabel} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-purple-400 mb-1">{f.title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">작동 방법</p>
        <StepList steps={f.steps} />
      </div>
      <Link
        href={f.route}
        className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
      >
        페이지로 이동
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

// ─── Page Component ───

export default function GuidePage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12 md:py-20 space-y-20">

      {/* ── Hero ── */}
      <section className="text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          사용 가이드
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-100">
          기능 소개 및 작동 방법
        </h1>
        <p className="max-w-3xl mx-auto text-base md:text-lg text-gray-400 leading-relaxed">
          마을살림/나라살림의 모든 기능을 안내합니다.
          예산 시각화부터 AI 정책 시뮬레이터, 시민 참여 도구까지 —
          각 기능의 목적과 단계별 사용 방법을 한 페이지에서 확인하세요.
        </p>
      </section>

      {/* ── Quick Navigation ── */}
      <nav aria-label="섹션 바로가기">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-medium">섹션 바로가기</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {NAV_CARDS.map((card) => (
            <a
              key={card.id}
              href={`#${card.id}`}
              className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border transition-colors ${card.bg} ${card.color}`}
            >
              <span>{card.icon}</span>
              <span className="text-xs font-medium text-center leading-tight">{card.label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* ══════ Section A: 예산 시각화 ══════ */}
      <section id="viz" className="space-y-8 scroll-mt-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/15 text-blue-400 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-100">예산 시각화</h2>
            <p className="text-sm text-gray-500 mt-0.5">국가·지방 예산 데이터를 다양한 형태로 탐색합니다</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {VIZ_FEATURES.map((f) => (
            <FeatureCard key={f.title} f={f} linkColor="text-blue-400 hover:text-blue-300" />
          ))}
        </div>
      </section>

      {/* ══════ Section B: 분석 도구 ══════ */}
      <section id="analysis" className="space-y-8 scroll-mt-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/15 text-emerald-400 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-100">분석 도구</h2>
            <p className="text-sm text-gray-500 mt-0.5">재정 데이터를 깊이 있게 분석하는 전문 도구</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ANALYSIS_FEATURES.map((f) => (
            <FeatureCard key={f.title} f={f} linkColor="text-emerald-400 hover:text-emerald-300" />
          ))}
        </div>
      </section>

      {/* ══════ Section C: AI 시뮬레이터 ══════ */}
      <section id="simulators" className="space-y-8 scroll-mt-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/15 text-purple-400 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-100">AI 시뮬레이터</h2>
            <p className="text-sm text-gray-500 mt-0.5">정책 효과를 AI와 함께 실시간으로 시뮬레이션합니다</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SIM_FEATURES.map((f) => (
            <SimCard key={f.title} f={f} />
          ))}
        </div>
      </section>

      {/* ══════ Section D: 시민 참여 ══════ */}
      <section id="citizen" className="space-y-8 scroll-mt-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/15 text-amber-400 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-100">시민 참여</h2>
            <p className="text-sm text-gray-500 mt-0.5">예산에 관한 시민 의견을 표현하고 소통합니다</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 찬반 투표 */}
          <div className="border border-border rounded-2xl p-5 space-y-4 bg-muted/30">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-amber-400 mb-1">찬반 투표</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                트리맵과 테이블 페이지에서 개별 예산 항목에 대해 찬성 또는 반대 의견을 표현합니다.
                실시간 집계 결과로 시민 여론을 확인할 수 있습니다.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">작동 방법</p>
              <StepList steps={[
                '예산 항목 카드 또는 테이블 행을 클릭해 상세 패널을 엽니다.',
                '찬성(엄지 위) 또는 반대(엄지 아래) 버튼을 클릭합니다.',
                '실시간 찬반 비율과 총 참여자 수를 확인합니다.',
              ]} />
            </div>
          </div>

          {/* AI 챗봇 */}
          <div className="border border-border rounded-2xl p-5 space-y-4 bg-muted/30">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-amber-400 mb-1">AI 챗봇</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                예산·정책에 관한 궁금증을 자연어로 질문합니다. Gemini AI가 실제 재정 데이터를 바탕으로 즉시 답변합니다.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">작동 방법</p>
              <StepList steps={[
                '화면 우측 하단의 챗봇 아이콘(말풍선)을 클릭합니다.',
                '질문을 자유롭게 입력합니다. (예: "교육예산이 가장 많은 지역은?")',
                'AI 답변을 확인하고 추가 질문으로 대화를 이어갑니다.',
              ]} />
            </div>
          </div>

          {/* 가이드 투어 */}
          <div className="border border-border rounded-2xl p-5 space-y-4 bg-muted/30">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-amber-400 mb-1">가이드 투어</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                처음 방문자를 위한 인터랙티브 사이트 안내입니다. 핵심 기능을 단계별로 설명하며 사용법을 익힐 수 있습니다.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">작동 방법</p>
              <StepList steps={[
                '헤더 우측의 ? 아이콘을 클릭해 가이드 투어를 시작합니다.',
                '화살표 버튼으로 다음 단계로 이동하며 각 기능의 위치와 역할을 확인합니다.',
                '투어 중 언제든지 ESC 키 또는 닫기 버튼으로 종료할 수 있습니다.',
              ]} />
            </div>
          </div>
        </div>
      </section>

      {/* ══════ Section E: 공통 기능 ══════ */}
      <section id="common" className="space-y-8 scroll-mt-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/15 text-cyan-400 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-100">AI 도우미 · 공통 기능</h2>
            <p className="text-sm text-gray-500 mt-0.5">사이트 전반에 걸친 편의 기능</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="border border-border rounded-2xl p-5 space-y-3 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-400 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-cyan-400">다크 / 라이트 모드</h3>
            </div>
            <p className="text-sm text-gray-400">헤더 우측의 테마 전환 버튼으로 다크 모드와 라이트 모드를 전환합니다. 선택한 테마는 다음 방문에도 유지됩니다.</p>
          </div>
          <div className="border border-border rounded-2xl p-5 space-y-3 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-400 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-cyan-400">PDF · CSV 내보내기</h3>
            </div>
            <p className="text-sm text-gray-400">테이블·시뮬레이터 등 각 페이지의 내보내기 버튼으로 현재 화면을 PDF로 인쇄하거나 데이터를 CSV로 다운로드합니다.</p>
          </div>
          <div className="border border-border rounded-2xl p-5 space-y-3 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-400 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-cyan-400">전체 검색</h3>
            </div>
            <p className="text-sm text-gray-400">
              헤더의 검색 아이콘을 클릭하거나{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-gray-700 text-xs bg-gray-800 font-mono">Ctrl+K</kbd>
              {' '}단축키를 누르면 예산 항목을 빠르게 검색할 수 있습니다.
            </p>
          </div>
          <div className="border border-border rounded-2xl p-5 space-y-3 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-400 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-cyan-400">반응형 디자인</h3>
            </div>
            <p className="text-sm text-gray-400">모바일·태블릿·데스크톱 모든 기기에서 최적화된 레이아웃으로 표시됩니다. 모바일에서는 햄버거 메뉴로 전체 네비게이션에 접근합니다.</p>
          </div>
        </div>
      </section>

      {/* ── Tips Banner ── */}
      <section className="border border-blue-500/20 rounded-2xl p-6 md:p-8 bg-blue-500/5 space-y-4">
        <div className="flex items-center gap-2 text-blue-400 font-semibold">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          빠른 시작 팁
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-400">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-semibold mt-0.5">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </section>

      {/* ── CTA ── */}
      <section className="text-center space-y-5 pb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-100">지금 바로 시작해보세요</h2>
        <p className="text-gray-500 text-sm md:text-base">가이드를 숙지했다면 실제 데이터를 탐색해보세요.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            지금 시작하기 — 예산 트리맵
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-gray-100 font-semibold text-sm transition-colors"
          >
            소개 페이지 보기
          </Link>
        </div>
      </section>

    </div>
  );
}
