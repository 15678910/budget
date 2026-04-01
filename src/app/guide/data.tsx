import type { ReactNode } from 'react';

// ─── Shared types ───

export interface FeatureItem {
  title: string;
  route: string;
  routeLabel: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  description: string;
  steps: string[];
  icon: ReactNode;
}

export interface SimItem {
  title: string;
  route: string;
  routeLabel: string;
  description: string;
  steps: string[];
}

export interface NavCard {
  id: string;
  label: string;
  color: string;
  bg: string;
  icon: ReactNode;
}

// ─── Quick nav ───

export const NAV_CARDS: NavCard[] = [
  {
    id: 'viz',
    label: '예산 시각화',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: 'analysis',
    label: '분석 도구',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'simulators',
    label: 'AI 시뮬레이터',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: 'citizen',
    label: '시민 참여',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'common',
    label: 'AI 도우미 · 공통',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
  },
];

// ─── Visualization features ───

export const VIZ_FEATURES: FeatureItem[] = [
  {
    title: '트리맵',
    route: '/',
    routeLabel: '/',
    accent: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/30',
    description: '비례 면적으로 예산 구조를 한눈에 파악합니다. 분야별·부처별·광역별·시군구별·교육청별 5가지 뷰를 제공하며, 블록을 클릭하면 하위 항목까지 드릴다운할 수 있습니다.',
    steps: [
      '상단 탭에서 분야별/부처별/광역별 중 원하는 뷰를 선택합니다.',
      '색상 블록을 클릭하면 해당 분야의 하위 항목으로 진입합니다.',
      '우측 패널에서 선택 항목의 세부 금액과 증감률을 확인합니다.',
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    title: '테이블',
    route: '/table',
    routeLabel: '/table',
    accent: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/30',
    description: '예산 데이터를 표 형태로 조회·검색·정렬합니다. CSV·PDF 내보내기를 지원하며 다양한 필터를 조합해 원하는 항목을 빠르게 찾을 수 있습니다.',
    steps: [
      '검색창에 키워드(예: "교육", "도로")를 입력해 항목을 필터링합니다.',
      '열 헤더를 클릭하면 해당 열 기준으로 오름/내림차순 정렬됩니다.',
      '내보내기 버튼으로 현재 필터된 데이터를 CSV 또는 PDF로 다운로드합니다.',
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    title: '비교',
    route: '/compare',
    routeLabel: '/compare',
    accent: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/30',
    description: '부처·분야별 예산을 연도별로 비교하고 증감률을 시각화합니다. 최대 4개 항목을 동시에 선택해 중장기 변화 추이를 차트로 확인할 수 있습니다.',
    steps: [
      '비교할 부처 또는 분야를 드롭다운에서 선택합니다.',
      '연도 범위 슬라이더로 비교 기간을 설정합니다.',
      '차트에서 연도별 금액 변화와 증감률을 한눈에 확인합니다.',
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

// ─── Analysis features ───

export const ANALYSIS_FEATURES: FeatureItem[] = [
  {
    title: '지역지도',
    route: '/regional',
    routeLabel: '/regional',
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/30',
    description: '17개 광역·228개 시군구 인터랙티브 지도에서 재정자립도, 1인당 예산 등 주요 재정 지표를 색상 농도로 비교합니다.',
    steps: [
      '지도에서 원하는 광역시도를 클릭해 시군구 레벨로 확대합니다.',
      '상단 지표 선택기에서 비교할 재정 항목(재정자립도, 채무비율 등)을 변경합니다.',
      '두 지역을 선택해 나란히 상세 재정 지표를 비교합니다.',
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    title: '재정건전성',
    route: '/fiscal-health',
    routeLabel: '/fiscal-health',
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/30',
    description: '국가 재정 건전성 대시보드입니다. 채무비율, 관리재정수지, GDP 대비 부채 등 핵심 지표의 장기 추이를 확인하고 위험 수준을 평가합니다.',
    steps: [
      '대시보드 상단의 핵심 지표 카드에서 현황을 한눈에 파악합니다.',
      '각 지표 카드를 클릭하면 10년 이상의 장기 추이 차트가 펼쳐집니다.',
      '위험등급(안전/주의/경고) 배지를 통해 국제 기준 대비 위치를 확인합니다.',
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    title: '국채시계',
    route: '/debt-clock',
    routeLabel: '/debt-clock',
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/30',
    description: '실시간으로 증가하는 국가채무를 카운터 형태로 표시합니다. 초당 증가액과 1인당 부담액을 함께 보여줍니다.',
    steps: [
      '페이지 진입 즉시 실시간으로 증가하는 국가채무 총액을 확인합니다.',
      '하단 패널에서 인구 수 대비 1인당 부담액을 확인합니다.',
      '연도별 채무 증가 속도 차트로 추이를 비교합니다.',
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: '공약검증',
    route: '/promise-check',
    routeLabel: '/promise-check',
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/30',
    description: '선거 공약의 재정 실현 가능성을 AI가 분석합니다. 소요 비용을 자동 추계하고 NABO 표준단가 기준으로 검증합니다.',
    steps: [
      '공약 내용을 텍스트 박스에 자유롭게 입력합니다.',
      'AI가 관련 정책 카테고리를 분류하고 소요 비용을 추계합니다.',
      '실현 가능성 등급(A–F)과 산출 근거를 확인합니다.',
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

// ─── Simulator features ───

export const SIM_FEATURES: SimItem[] = [
  {
    title: 'AI기본사회',
    route: '/simulator',
    routeLabel: '/simulator',
    description: '공공 효율화로 절감된 예산을 국부펀드·기본소득으로 전환하는 시뮬레이션입니다. 10년 후 기금 규모와 1인당 지급액을 실시간으로 계산합니다.',
    steps: [
      '슬라이더로 공공 효율화 비율(0–30%)을 조정합니다.',
      '펀드 연 수익률을 설정해 복리 효과를 확인합니다.',
      '10년 후 누적 기금과 기본소득 지급 가능 금액을 확인합니다.',
    ],
  },
  {
    title: '자치구AI',
    route: '/local-simulator',
    routeLabel: '/local-simulator',
    description: '지자체 단위의 국부펀드 시뮬레이션입니다. 우리 동네 재정 데이터를 기반으로 맞춤형 분석을 제공합니다.',
    steps: [
      '드롭다운에서 광역 → 시군구를 순서대로 선택합니다.',
      '효율화 목표와 수익률 파라미터를 조정합니다.',
      '타 지역과의 비교 차트로 우리 지역의 상대적 효과를 확인합니다.',
    ],
  },
  {
    title: '산업시뮬',
    route: '/industry-sim',
    routeLabel: '/industry-sim',
    description: '산업별 정책이 고용·생산·수출에 미치는 파급 효과를 입출력 모형 기반으로 시뮬레이션합니다.',
    steps: [
      '산업 분야(제조업, 서비스업 등)를 선택합니다.',
      '정책 지원 규모와 기간을 설정합니다.',
      '고용 유발, 생산 유발, 수출 증가 효과를 확인합니다.',
    ],
  },
  {
    title: 'AI효율화',
    route: '/ai-efficiency',
    routeLabel: '/ai-efficiency',
    description: '국세청·조달청·고용부·건보공단·교육부 5개 기관의 AI 도입 효과를 분석합니다. 절감 비용과 업무 처리 효율 향상 수치를 제공합니다.',
    steps: [
      '상단 탭에서 분석할 기관을 선택합니다.',
      'AI 도입 시나리오(단계별 도입률)를 슬라이더로 조정합니다.',
      '연간 절감액, 인력 재배치 효과, ROI를 기관별로 비교합니다.',
    ],
  },
  {
    title: '재정혁신',
    route: '/fiscal-innovation',
    routeLabel: '/fiscal-innovation',
    description: '이자부담·공공신용·지역화폐·세금비교·통합시나리오 5개 서브 시뮬레이터를 하나의 페이지에서 제공합니다.',
    steps: [
      '탭 메뉴에서 원하는 서브 시뮬레이터를 선택합니다.',
      '각 시뮬레이터별 슬라이더로 파라미터를 설정합니다.',
      '결과 패널에서 재정 혁신 효과와 정책 시나리오를 분석합니다.',
    ],
  },
  {
    title: '공공은행',
    route: '/public-bank',
    routeLabel: '/public-bank',
    description: '공공은행 설립의 경제적 효과를 시뮬레이션합니다. 독일·노르웨이·미국 BND 등 해외 성공 사례와의 비교 데이터가 내장되어 있습니다.',
    steps: [
      '설립 규모(자본금)와 운영 모델을 선택합니다.',
      '대출 집중 분야(중소기업, 주택, 인프라 등)를 설정합니다.',
      '경제적 효과와 해외 사례 벤치마킹 결과를 비교합니다.',
    ],
  },
  {
    title: 'AI기본법',
    route: '/ai-law',
    routeLabel: '/ai-law',
    description: 'AI 기본법 프레임워크와 도입 비용을 분석합니다. 입법 타임라인과 단계별 예상 비용을 시각화합니다.',
    steps: [
      '타임라인에서 AI 기본법 입법 진행 단계를 확인합니다.',
      '비용 계산기에 기관 규모와 도입 범위를 입력합니다.',
      '단계별 소요 예산 추계와 편익 분석 결과를 확인합니다.',
    ],
  },
  {
    title: 'AI정책진단',
    route: '/fiscal-doctor',
    routeLabel: '/fiscal-doctor',
    description: 'AI가 정책 주제를 진단하고, 관련 법률안·조례를 검색하며, 해외 벤치마킹 사례를 제공합니다. 정책 설계의 전 과정을 지원합니다.',
    steps: [
      '진단받을 정책 주제나 키워드를 입력합니다.',
      'AI 진단 결과(비용 추계·위험도·권고안)를 확인합니다.',
      '관련 법률안·조례 검색과 해외 사례 비교 탭을 활용합니다.',
    ],
  },
];

// ─── Tips ───

export const TIPS: string[] = [
  '처음이라면 트리맵(/)에서 전체 예산 구조를 큰 그림으로 먼저 파악하세요.',
  '특정 지역에 관심이 있다면 지역지도(/regional)에서 시작하세요.',
  '정책 효과가 궁금하다면 AI정책진단(/fiscal-doctor)에 주제를 바로 입력해보세요.',
  '모르는 용어가 있으면 우측 하단 AI 챗봇에 자연어로 질문하면 됩니다.',
];
