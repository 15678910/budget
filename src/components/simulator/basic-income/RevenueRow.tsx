import type { ReactNode } from 'react';
import { fmtJo } from './format';
import { ModeSelect } from './ModeSelect';
import type { FlowMode } from '@/lib/basic-income/types';

interface RevenueRowProps {
  title: string;
  /** 기준 연도에 들어오는 금액(조 원) */
  firstYear: number;
  mode?: FlowMode;
  onMode?: (m: FlowMode) => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** 들어오는 돈 한 줄: 이름, 첫해 금액, 지급/적립 선택, 입력칸 */
export function RevenueRow({ title, firstYear, mode, onMode, children, footer }: RevenueRowProps) {
  return (
    <div className="border-t border-gray-800 pt-3 first:border-t-0 first:pt-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-200">{title}</span>
        <span className="flex items-center gap-2">
          <span className="text-xs text-gray-400">첫해 {fmtJo(firstYear)}</span>
          {mode && onMode && <ModeSelect value={mode} onChange={onMode} label={title} />}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{children}</div>
      {footer && <div className="mt-2 text-xs text-gray-500">{footer}</div>}
    </div>
  );
}
