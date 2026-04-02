'use client';

import { useCallback, useState } from 'react';

interface BillResult {
  id: string;
  billNo: string;
  name: string;
  proposer: string;
  proposeDate: string;
  committee: string | null;
  status: string | null;
  detailLink: string;
}

interface BillSearchProps {
  onSelectBill: (billName: string) => void;
}

export function BillSearch({ onSelectBill }: BillSearchProps) {
  const [showBillSearch, setShowBillSearch] = useState(false);
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [billSearchMode, setBillSearchMode] = useState<'name' | 'proposer'>('name');
  const [billResults, setBillResults] = useState<BillResult[]>([]);
  const [billSearching, setBillSearching] = useState(false);
  const [billTotal, setBillTotal] = useState(0);
  const [billPage, setBillPage] = useState(1);

  const handleBillSearch = useCallback(async (page = 1) => {
    setBillSearching(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '8' });
      if (billSearchQuery.trim()) {
        if (billSearchMode === 'proposer') {
          params.set('proposer', billSearchQuery.trim());
        } else {
          params.set('search', billSearchQuery.trim());
        }
      }
      const res = await fetch(`/api/nabo/bills?${params}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setBillResults(data.bills || []);
      setBillTotal(data.total || 0);
      setBillPage(page);
    } catch {
      setBillResults([]);
      setBillTotal(0);
    } finally {
      setBillSearching(false);
    }
  }, [billSearchQuery, billSearchMode]);

  const handleSelectBill = useCallback((billName: string) => {
    onSelectBill(billName);
    setShowBillSearch(false);
  }, [onSelectBill]);

  return (
    <div id="bill-search" className="space-y-3">
      <button
        onClick={() => {
          setShowBillSearch(!showBillSearch);
          if (!showBillSearch && billResults.length === 0) {
            handleBillSearch(1);
          }
        }}
        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-7m0 0l-7 7m7-7V3" />
        </svg>
        {showBillSearch ? '국회 법률안 검색 닫기' : '국회 법률안에서 검색'}
        <span className="text-xs text-gray-600">(열린국회정보 API)</span>
      </button>

      {showBillSearch && (
        <div className="border border-gray-700 rounded-lg bg-gray-800/50 p-4 space-y-3">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setBillSearchMode('name')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${billSearchMode === 'name' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              법률안명
            </button>
            <button
              onClick={() => setBillSearchMode('proposer')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${billSearchMode === 'proposer' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              발의 의원명
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={billSearchQuery}
              onChange={(e) => setBillSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBillSearch(1)}
              placeholder={billSearchMode === 'name' ? '법률안명 검색 (예: 인공지능, 지방재정...)' : '의원명 검색 (예: 이재명, 한동훈...)'}
              className="flex-1 bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
            />
            <button
              onClick={() => handleBillSearch(1)}
              disabled={billSearching}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
            >
              {billSearching ? '검색 중...' : '검색'}
            </button>
          </div>

          {billTotal > 0 && (
            <p className="text-xs text-gray-500">
              총 {billTotal.toLocaleString()}건의 법률안 (제22대 국회)
            </p>
          )}

          {billResults.length > 0 && (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {billResults.map((bill) => (
                <button
                  key={bill.id}
                  onClick={() => handleSelectBill(bill.name)}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-700/50 border border-gray-700/30 hover:border-blue-500/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 group-hover:text-blue-300 truncate">
                        {bill.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{bill.proposer}</span>
                        <span className="text-xs text-gray-600">|</span>
                        <span className="text-xs text-gray-500">{bill.proposeDate}</span>
                        {bill.committee && (
                          <>
                            <span className="text-xs text-gray-600">|</span>
                            <span className="text-xs text-gray-500">{bill.committee}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mt-1">
                      선택
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {billResults.length === 0 && !billSearching && billSearchQuery && (
            <p className="text-sm text-gray-500 text-center py-4">
              검색 결과가 없습니다
            </p>
          )}

          {billTotal > 8 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => handleBillSearch(billPage - 1)}
                disabled={billPage <= 1 || billSearching}
                className="px-3 py-1 text-xs text-gray-400 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="text-xs text-gray-500 py-1">
                {billPage} / {Math.ceil(billTotal / 8)}
              </span>
              <button
                onClick={() => handleBillSearch(billPage + 1)}
                disabled={billPage >= Math.ceil(billTotal / 8) || billSearching}
                className="px-3 py-1 text-xs text-gray-400 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          )}

          <p className="text-xs text-gray-600 text-right">
            출처: 열린국회정보 (open.assembly.go.kr)
          </p>
        </div>
      )}
    </div>
  );
}
