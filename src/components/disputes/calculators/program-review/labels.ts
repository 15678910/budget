/**
 * 사업 검토 계산기의 열거형 → 한글 라벨.
 *
 * lib(`@/lib/programs`)은 화면 문구를 갖지 않는다. 같은 열거형이라도 정부 단위마다
 * 라벨이 달라질 수 있어(중앙 「본예산/기금」 vs 지방 「일반회계/특별회계」) 표기는
 * 화면 쪽에 둔다.
 */
import type {
  FundAccount,
  LensKey,
  ProgramNature,
  ReviewRoute,
  SpendType,
} from '@/lib/programs/types';

export const ACCOUNT_LABEL: Record<FundAccount, string> = {
  youth: '청년',
  growth: '성장동력',
  regional: '지방',
  education: '교육·인재',
  none: '본예산',
};

export const NATURE_LABEL: Record<ProgramNature, string> = {
  new: '신규',
  expanded: '확대',
  transferred: '이관',
  'tax-converted': '조세지출 전환',
  unknown: '미공개',
};

export const SPEND_LABEL: Record<SpendType, string> = {
  cash: '현금·바우처',
  'matched-saving': '기여금(자산형성)',
  grant: '보조·출연',
  equity: '출자',
  rnd: 'R&D',
  infra: '건설·설비',
  service: '인력·프로그램',
  unknown: '미공개',
};

export const ROUTE_LABEL: Record<ReviewRoute, string> = {
  budget: '본예산',
  fund: '기금',
  'special-account': '특별회계',
  unknown: '미공개',
};

export const LENS_LABEL: Record<LensKey, { name: string; note: string }> = {
  capital: {
    name: '자본축적성',
    note: '출자·R&D·설비·기여금은 1, 보조·프로그램은 0.5, 현금 지급은 0. 정부 NEXT 원칙의 「N 자본축적」을 그대로 씀',
  },
  netNew: {
    name: '순증 여부',
    note: '신규·확대는 1, 조세지출 전환은 0.5, 기존 급여의 재원 이관은 0. 이관은 새 돈이 아니다',
  },
  execution: {
    name: '집행 위험',
    note: '전년 대비 1.5배 이하면 1, 10배 이상이면 0, 신규는 0.5. 집행 기반 없는 급증은 위험',
  },
  route: {
    name: '국회 심의 경로',
    note: '본예산 1, 기금 0. 기금 사업은 30% 특례와 세입 보전 전출의 대상',
  },
  reach: {
    name: '수혜 범위',
    note: '문서에 수혜 인원이 있는 사업만. 로그 정규화',
  },
  check: {
    name: '검산 일치',
    note: '단가×수량이 문서에 있고 금액과 ±1% 안이면 1, 어긋나면 0',
  },
};

/** 재배분 배분처 라벨. 키는 ReallocationInput.split과 같다 */
export const SPLIT_LABEL: Record<'top' | 'grant' | 'debt' | 'reserve', string> = {
  top: '상위 사업 증액',
  grant: '교부금 차액 보전',
  debt: '국채 상환',
  reserve: '적립',
};
