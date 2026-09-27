import { cn } from '@/lib/utils/format';

export type SampleDataKind = 'central' | 'education';

interface SampleDataNoticeProps {
  kind: SampleDataKind;
  className?: string;
}

interface SampleDataCopy {
  /** 배지 텍스트 (항상 굵게, 문장 맨 앞) */
  badge: string;
  /** 배지 뒤에 이어지는 본문 (링크 앞부분) */
  body: string;
  /** 공식 수치를 확인할 수 있는 기관명 */
  officialName: string;
  /** 공식 수치를 확인할 수 있는 URL */
  officialUrl: string;
  /** 링크 뒤에 이어지는 문장 */
  suffix: string;
}

/** 모든 표본 데이터 안내에 공통으로 붙는 배지 문구 */
export const SAMPLE_DATA_BADGE = '「표본 데이터」';

/**
 * 화면별 표본 데이터 안내 문구.
 * central: 중앙정부 예산 (data/processed/budget-*.json — scripts/generate-sample-data.ts 생성)
 * education: 시·도교육청 예산 (data/processed/education-*.json — scripts/generate-education-data.ts 생성)
 *
 * 지역(광역·시군구) 예산은 지방재정365 기반 실제 데이터이므로 이 안내 대상이 아니다.
 */
export const SAMPLE_DATA_COPY: Record<SampleDataKind, SampleDataCopy> = {
  central: {
    badge: SAMPLE_DATA_BADGE,
    body: '이 화면의 중앙정부 예산 금액은 실제 예산이 아닙니다. 분야·부문·프로그램 구조를 본떠 만든 표본이라 공식 수치와 다릅니다. 공식 수치는',
    officialName: '열린재정',
    officialUrl: 'https://www.openfiscaldata.go.kr',
    suffix: '에서 확인하세요. 실제 데이터로 교체할 예정입니다.',
  },
  education: {
    badge: SAMPLE_DATA_BADGE,
    body: '이 화면의 시·도교육청 예산 금액은 실제 예산이 아닙니다. 공식 수치는',
    officialName: '지방교육재정알리미',
    officialUrl: 'https://www.eduinfo.go.kr',
    suffix: '에서 확인하세요. 실제 데이터로 교체할 예정입니다.',
  },
};

/**
 * 중앙정부·시도교육청 표본 데이터 화면 상단에 표시하는 안내 배너.
 * 실제 지역(광역·시군구) 데이터 화면에는 사용하지 않는다.
 */
export function SampleDataNotice({ kind, className }: SampleDataNoticeProps) {
  const copy = SAMPLE_DATA_COPY[kind];

  return (
    <div
      role="note"
      className={cn(
        'rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200',
        className
      )}
    >
      <span className="font-bold">{copy.badge}</span>{' '}
      <span>{copy.body}</span>{' '}
      <a
        href={copy.officialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium hover:text-amber-700 dark:hover:text-amber-100"
      >
        {copy.officialName}
      </a>
      <span>
        ({copy.officialUrl}){' '}
        {copy.suffix}
      </span>
    </div>
  );
}
