import { cn } from '@/lib/utils/format';
import { CENTRAL_BUDGET_SOURCE_URL } from '@/lib/constants';

interface CentralDataSourceProps {
  className?: string;
}

/** 중앙정부 예산 화면의 데이터 출처 표기 (열린재정 실제 데이터) */
export function CentralDataSource({ className }: CentralDataSourceProps) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      출처:{' '}
      <a
        href={CENTRAL_BUDGET_SOURCE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        열린재정
      </a>{' '}
      세부사업 예산편성현황 — 총지출 기준, 국회확정 본예산(2023~2026). 국회확정금액 0원인 사업은 제외.
    </p>
  );
}
