'use client';

import type { ReactNode } from 'react';

type Align = 'center' | 'left' | 'right';

interface HelpTipProps {
  /** 툴팁에 표시할 설명(사용법). */
  tip: string;
  /** 호버 대상(라벨·칩 등). */
  children: ReactNode;
  /** 말풍선 가로 정렬(패널 가장자리 클리핑 방지용). 기본 center. */
  align?: Align;
  /** 말풍선 너비 유틸(기본 w-64). */
  width?: string;
}

const ALIGN_POS: Record<Align, string> = {
  center: 'left-1/2 -translate-x-1/2',
  left: 'left-0',
  right: 'right-0',
};

/**
 * 호버/포커스 시 다크 말풍선으로 사용 설명을 보여주는 도움말 래퍼.
 * 대상 옆에 작은 ⓘ 힌트를 붙이고, 말풍선은 대상 아래에 표시한다.
 * 패널 가장자리에서 잘리지 않도록 align 으로 가로 정렬을 조절한다.
 */
export default function HelpTip({ tip, children, align = 'center', width = 'w-64' }: HelpTipProps) {
  return (
    <span className="group/help relative inline-flex cursor-help items-center gap-1">
      {children}
      <span
        aria-hidden
        className="select-none text-[0.85em] leading-none text-slate-400 group-hover/help:text-slate-600"
      >
        ⓘ
      </span>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full z-50 mt-1.5 ${width} ${ALIGN_POS[align]} rounded-md bg-slate-800 px-3 py-2 text-xs font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/help:opacity-100 group-focus-within/help:opacity-100`}
      >
        {tip}
      </span>
    </span>
  );
}
