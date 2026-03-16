import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '플랫폼 소개 | 나라살림',
  description:
    '대한민국 재정 시각화 & 정책 시뮬레이션 플랫폼 나라살림의 핵심 기능과 차별점을 소개합니다.',
};

// ─── Feature card data ───

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    iconBg: 'bg-blue-500/15 text-blue-400',
    title: '728조+공공기업 예산을 한눈에',
    description:
      '트리맵과 버블차트로 국가 예산을 비례 면적으로 시각화합니다. 분야별 · 부처별 · 광역별 · 시군구별 5가지 뷰를 제공하며, 클릭만으로 하위 항목까지 드릴다운할 수 있습니다.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    iconBg: 'bg-emerald-500/15 text-emerald-400',
    title: '20개 이상의 정책 시뮬레이터',
    description:
      '공공은행 설립, 국부펀드, AI 효율화, 공공주택, 지역활성화, 화폐혁명 등 다양한 정책의 효과를 슬라이더로 직접 조작하며 실시간으로 확인할 수 있습니다.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    iconBg: 'bg-amber-500/15 text-amber-400',
    title: '17개 광역 · 228개 시군구 연동',
    description:
      '지방재정365 기반의 실제 자치단체 재정 데이터가 모든 시뮬레이터에 실시간 반영됩니다. 광역시도와 시군구를 자유롭게 전환하며 지역별 차이를 비교할 수 있습니다.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    iconBg: 'bg-purple-500/15 text-purple-400',
    title: '데이터와 시뮬레이션의 통합',
    description:
      '단순 조회를 넘어 "이 정책을 시행하면 어떻게 될까?"에 답합니다. 재정 건전성 분석, 정책 시뮬레이션, AI 효율화 카탈로그가 하나의 플랫폼에서 유기적으로 연결됩니다.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    iconBg: 'bg-cyan-500/15 text-cyan-400',
    title: '시민 참여와 투명성',
    description:
      '개별 예산 항목에 대한 시민 찬반 투표, 선거 공약 재정 실현 가능성 검증, AI 챗봇을 통한 예산 질의응답으로 재정 민주주의를 실현합니다.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    iconBg: 'bg-rose-500/15 text-rose-400',
    title: '해외 모델 벤치마킹 내장',
    description:
      '독일 BND(공공은행), 노르웨이 GPFG(국부펀드), 스위스 칸톤은행, 미국 노스다코타 은행(BND), 코스타리카 국립은행 등 해외 성공 사례와의 비교 데이터가 시뮬레이터에 내장되어 정책 설계의 근거를 제공합니다.',
  },
];

// ─── Stats ───

const STATS = [
  { value: '21', label: '페이지' },
  { value: '20+', label: '시뮬레이터' },
  { value: '245', label: '자치단체' },
  { value: '4개년', label: '예산 데이터' },
];

// ─── Comparison data ───

const COMPARISON = [
  { feature: '인터랙티브 시각화', us: true, lofin: false, open: false, mybudget: false },
  { feature: '정책 시뮬레이션', us: true, lofin: false, open: false, mybudget: false },
  { feature: '시군구 데이터 연동', us: true, lofin: true, open: false, mybudget: false },
  { feature: 'AI 효율화 분석', us: true, lofin: false, open: false, mybudget: false },
  { feature: '시민 투표 · 참여', us: true, lofin: false, open: false, mybudget: true },
  { feature: 'PDF · CSV 내보내기', us: true, lofin: false, open: false, mybudget: false },
  { feature: 'AI 챗봇', us: true, lofin: false, open: false, mybudget: false },
  { feature: '공약 검증', us: true, lofin: false, open: false, mybudget: false },
];

// ─── Use-case data ───

const USE_CASES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" /><path d="M5 21V10.85" /><path d="M19 21V10.85" />
      </svg>
    ),
    iconBg: 'bg-blue-500/15 text-blue-400',
    title: '지방자치단체',
    items: [
      '재정 현황 대시보드로 의사결정 지원',
      '공공은행 설립 타당성 사전 검토',
      'AI 도입 효과 사전 분석 및 예산 근거 마련',
      '주민 대상 재정 투명성 공개 도구',
    ],
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    iconBg: 'bg-emerald-500/15 text-emerald-400',
    title: '연구기관 · 교육기관',
    items: [
      '정책 시나리오별 재정 영향 비교 분석',
      '지역 간 재정 건전성 벤치마킹',
      '대학 재정학 · 행정학 수업 교보재',
      '시민 재정 리터러시 교육 플랫폼',
    ],
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
    iconBg: 'bg-amber-500/15 text-amber-400',
    title: '시민 · 언론',
    items: [
      '선거 공약의 재정 실현 가능성 검증',
      '우리 지역 예산 현황 조회 · 비교',
      '개별 예산 항목에 대한 시민 의견 표현',
      'AI 챗봇으로 예산 궁금증 즉시 해결',
    ],
  },
];

// ─── Page Component ───

export default function AboutPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12 md:py-20 space-y-20">
      {/* ── Hero ── */}
      <section className="text-center space-y-6">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-100">
          마을살림/나라살림의 특징
        </h1>
        <p className="max-w-3xl mx-auto text-base md:text-lg text-gray-400 leading-relaxed">
          나라살림은 <strong className="text-gray-200">대한민국 재정 데이터 시각화와 정책 시뮬레이션</strong>을
          위해 설계된 시민 참여형 플랫폼입니다.
          일반적인 재정 공개 시스템과 달리 나라살림은 예산 탐색부터 정책 효과 시뮬레이션,
          AI 효율화 분석, 공약 검증에 이르기까지 재정 민주주의의 전 과정을 지원합니다.
          나라살림을 통해 시민, 공무원, 연구자 모두가 데이터에 기반한 정책 판단을
          더 빠르고 투명하게 내릴 수 있습니다.
        </p>
      </section>

      {/* ── Feature Grid (2×3) ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${f.iconBg}`}>
              {f.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-semibold text-gray-100">{f.title}</h3>
              <p className="text-sm md:text-base text-gray-400 leading-relaxed">{f.description}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Stats Bar ── */}
      <section className="border border-gray-800 rounded-2xl p-6 md:p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-bold text-blue-400">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-100">기존 서비스와의 비교</h2>
          <p className="text-gray-500 mt-2">국내 주요 재정 공개 플랫폼과의 기능 비교</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-800 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-gray-900/60 text-gray-400">
                <th className="px-4 py-3 font-medium">기능</th>
                <th className="px-4 py-3 font-medium text-center text-blue-400">나라살림</th>
                <th className="px-4 py-3 font-medium text-center">지방재정365</th>
                <th className="px-4 py-3 font-medium text-center">열린재정</th>
                <th className="px-4 py-3 font-medium text-center">국민참여예산</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-t border-gray-800/60">
                  <td className="px-4 py-3 text-gray-300">{row.feature}</td>
                  <td className="px-4 py-3 text-center">{row.us ? <span className="text-blue-400 text-lg">&#10003;</span> : <span className="text-gray-700">&#8212;</span>}</td>
                  <td className="px-4 py-3 text-center">{row.lofin ? <span className="text-gray-400">&#10003;</span> : <span className="text-gray-700">&#8212;</span>}</td>
                  <td className="px-4 py-3 text-center">{row.open ? <span className="text-gray-400">&#10003;</span> : <span className="text-gray-700">&#8212;</span>}</td>
                  <td className="px-4 py-3 text-center">{row.mybudget ? <span className="text-gray-400">&#10003;</span> : <span className="text-gray-700">&#8212;</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-100">활용 시나리오</h2>
          <p className="text-gray-500 mt-2">다양한 사용자 그룹을 위한 맞춤형 가치</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {USE_CASES.map((uc) => (
            <div key={uc.title} className="border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${uc.iconBg}`}>
                  {uc.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-100">{uc.title}</h3>
              </div>
              <ul className="space-y-2">
                {uc.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="text-gray-600 mt-1 shrink-0">&#8226;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Data Sources ── */}
      <section className="border border-gray-800 rounded-2xl p-6 md:p-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-200">데이터 출처</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-400">
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" /> 열린재정 · 기획재정부 예산개요</div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> 지방재정365 (LOFIN) · 행정안전부</div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> 한국은행 가계금융복지조사</div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" /> 통계청 KOSIS · 산업통상자원부</div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" /> 지방교육재정알리미</div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" /> 소프트웨어정책연구소 · 과기정통부</div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className="text-center space-y-4 pb-8">
        <h2 className="text-xl font-semibold text-gray-200">기술 스택</h2>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          {['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'D3.js', '@nivo', 'Fuse.js', 'Gemini AI', 'Neon DB', 'Vercel'].map((t) => (
            <span key={t} className="px-3 py-1.5 rounded-full border border-gray-700 text-gray-400 bg-gray-900/50">
              {t}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
