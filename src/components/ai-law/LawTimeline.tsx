'use client';

import React from 'react';

const TIMELINE_EVENTS = [
  { date: '2024.12', label: '국회 본회의 통과', status: 'done' as const },
  { date: '2025.01', label: '공포 (법률 제20733호)', status: 'done' as const },
  { date: '2026.01.22', label: '시행', status: 'current' as const },
  { date: '2026.07', label: '하위법령 정비 완료', status: 'upcoming' as const },
  { date: '2027.01', label: '영향평가 전면 의무화', status: 'upcoming' as const },
  { date: '2027.07', label: '고영향AI 신고제 전면 시행', status: 'upcoming' as const },
];

const STATUS_STYLES = {
  done: {
    dot: 'bg-emerald-500 border-emerald-400',
    line: 'border-emerald-700',
    date: 'text-emerald-400',
    label: 'text-gray-300',
  },
  current: {
    dot: 'bg-blue-500 border-blue-400 animate-pulse',
    line: 'border-gray-700',
    date: 'text-blue-400 font-bold',
    label: 'text-blue-300 font-semibold',
  },
  upcoming: {
    dot: 'bg-gray-700 border-gray-600',
    line: 'border-gray-800',
    date: 'text-gray-500',
    label: 'text-gray-500',
  },
};

export function LawTimeline() {
  return (
    <div className="border border-gray-800 p-4 md:p-5">
      <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-cyan-400 mb-5">
        AI 기본법 타임라인
      </div>
      <div className="relative ml-4">
        {TIMELINE_EVENTS.map((event, i) => {
          const s = STATUS_STYLES[event.status];
          const isLast = i === TIMELINE_EVENTS.length - 1;
          return (
            <div key={event.date} className="relative flex items-start pb-6 last:pb-0">
              {/* Vertical dashed line */}
              {!isLast && (
                <div
                  className={`absolute left-[7px] top-[18px] bottom-0 border-l-2 border-dashed ${s.line}`}
                />
              )}
              {/* Dot */}
              <div
                className={`relative z-10 w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 ${s.dot}`}
              />
              {/* Content */}
              <div className="ml-4 min-w-0">
                <span className={`text-sm font-mono ${s.date}`}>{event.date}</span>
                <div className={`text-base leading-snug ${s.label}`}>
                  {event.label}
                  {event.status === 'current' && (
                    <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                      현재
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
