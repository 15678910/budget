'use client';

import { useState } from 'react';

const SOURCES = [
  {
    name: '기획재정부 2026년 예산안',
    description: '중앙정부 세입·세출 예산 총액 및 분야별·부처별 배분',
    url: 'https://www.mofe.go.kr',
    date: '2025.08',
  },
  {
    name: '열린재정 (Open Fiscal Data)',
    description: '국가재정 세부 데이터, 국가채무, 재정수입·지출',
    url: 'https://www.openfiscaldata.go.kr',
    date: '상시',
  },
  {
    name: '국회예산정책처 (NABO)',
    description: '예산안 검토보고, 재정총량 분석',
    url: 'https://www.nabo.go.kr',
    date: '2025.11',
  },
  {
    name: 'e-나라지표',
    description: '국가채무, 국세수입 등 주요 재정지표',
    url: 'https://www.index.go.kr',
    date: '상시',
  },
  {
    name: '통계청 인구총조사',
    description: '인구수, 가구수 통계',
    url: 'https://kosis.kr',
    date: '2026.01',
  },
  {
    name: '한국은행 경제전망',
    description: 'GDP, 경제성장률, 물가, 기준금리',
    url: 'https://www.bok.or.kr',
    date: '2025.11',
  },
  {
    name: '지방재정365',
    description: '광역시도·시군구 지방재정 데이터',
    url: 'https://lofin.mois.go.kr',
    date: '상시',
  },
];

export function DataSources() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8 border-t border-border pt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        데이터 출처
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SOURCES.map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                  {source.name}
                </span>
                <span className="text-[10px] text-muted-foreground">{source.date}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{source.description}</p>
            </a>
          ))}
        </div>
      )}
      <p className="mt-3 text-[10px] text-muted-foreground">
        * 본 사이트의 예산 데이터는 위 공공 데이터를 기반으로 구성되었습니다.
        세부 금액은 예산안 기준이며 실제 집행액과 다를 수 있습니다.
      </p>
    </div>
  );
}
