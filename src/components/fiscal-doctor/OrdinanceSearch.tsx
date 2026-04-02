'use client';

import { useCallback, useState } from 'react';

interface OrdinanceResult {
  id: string;
  name: string;
  promulgationDate: string;
  effectiveDate: string;
  localGov: string;
  amendmentType: string;
  field: string;
}

interface OrdinanceSearchProps {
  onSelectOrdinance: (name: string) => void;
}

export function OrdinanceSearch({ onSelectOrdinance }: OrdinanceSearchProps) {
  const [showOrdinanceSearch, setShowOrdinanceSearch] = useState(false);
  const [ordinanceQuery, setOrdinanceQuery] = useState('');
  const [ordinanceResults, setOrdinanceResults] = useState<OrdinanceResult[]>([]);
  const [ordinanceSearching, setOrdinanceSearching] = useState(false);
  const [ordinanceTotal, setOrdinanceTotal] = useState(0);
  const [ordinancePage, setOrdinancePage] = useState(1);

  const handleOrdinanceSearch = useCallback(async (page = 1) => {
    if (!ordinanceQuery.trim() || ordinanceQuery.trim().length < 2) return;
    setOrdinanceSearching(true);
    try {
      const params = new URLSearchParams({ query: ordinanceQuery.trim(), page: String(page), size: '8' });
      const res = await fetch(`/api/ordinance/search?${params}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setOrdinanceResults(data.ordinances || []);
      setOrdinanceTotal(data.total || 0);
      setOrdinancePage(page);
    } catch {
      setOrdinanceResults([]);
      setOrdinanceTotal(0);
    } finally {
      setOrdinanceSearching(false);
    }
  }, [ordinanceQuery]);

  const handleSelectOrdinance = useCallback((name: string) => {
    onSelectOrdinance(name);
    setShowOrdinanceSearch(false);
  }, [onSelectOrdinance]);

  return (
    <div id="ordinance-search" className="space-y-3">
      <button
        onClick={() => setShowOrdinanceSearch(!showOrdinanceSearch)}
        className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {showOrdinanceSearch ? '지자체 조례 검색 닫기' : '지자체 조례에서 검색'}
        <span className="text-xs text-gray-600">(국가법령정보센터)</span>
      </button>

      {showOrdinanceSearch && (
        <div className="border border-gray-700 rounded-lg bg-gray-800/50 p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={ordinanceQuery}
              onChange={(e) => setOrdinanceQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleOrdinanceSearch(1)}
              placeholder="조례명으로 검색 (예: 지역화폐, 공공의료, 마을기업, 기본소득...)"
              className="flex-1 bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 placeholder:text-gray-600"
            />
            <button
              onClick={() => handleOrdinanceSearch(1)}
              disabled={ordinanceSearching || ordinanceQuery.trim().length < 2}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
            >
              {ordinanceSearching ? '검색 중...' : '검색'}
            </button>
          </div>

          {ordinanceTotal > 0 && (
            <p className="text-xs text-gray-500">
              총 {ordinanceTotal.toLocaleString()}건의 조례
            </p>
          )}

          {ordinanceResults.length > 0 && (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {ordinanceResults.map((ord) => (
                <button
                  key={ord.id}
                  onClick={() => handleSelectOrdinance(ord.name)}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-700/50 border border-gray-700/30 hover:border-purple-500/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 group-hover:text-purple-300 truncate">
                        {ord.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-purple-400/80">{ord.localGov}</span>
                        <span className="text-xs text-gray-600">|</span>
                        <span className="text-xs text-gray-500">{ord.amendmentType}</span>
                        <span className="text-xs text-gray-600">|</span>
                        <span className="text-xs text-gray-500">{ord.promulgationDate}</span>
                        {ord.field && (
                          <>
                            <span className="text-xs text-gray-600">|</span>
                            <span className="text-xs text-gray-500">{ord.field}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mt-1">
                      선택
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {ordinanceResults.length === 0 && !ordinanceSearching && ordinanceQuery.length >= 2 && (
            <p className="text-sm text-gray-500 text-center py-4">
              검색 결과가 없습니다
            </p>
          )}

          {ordinanceTotal > 8 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => handleOrdinanceSearch(ordinancePage - 1)}
                disabled={ordinancePage <= 1 || ordinanceSearching}
                className="px-3 py-1 text-xs text-gray-400 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="text-xs text-gray-500 py-1">
                {ordinancePage} / {Math.ceil(ordinanceTotal / 8)}
              </span>
              <button
                onClick={() => handleOrdinanceSearch(ordinancePage + 1)}
                disabled={ordinancePage >= Math.ceil(ordinanceTotal / 8) || ordinanceSearching}
                className="px-3 py-1 text-xs text-gray-400 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          )}

          <p className="text-xs text-gray-600 text-right">
            출처: 국가법령정보센터 (law.go.kr)
          </p>
        </div>
      )}
    </div>
  );
}
