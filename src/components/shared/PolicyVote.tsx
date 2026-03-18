'use client';

import { useState, useEffect } from 'react';

interface PolicyVoteProps {
  simulatorName: string;   // e.g., 'apartment-tax', 'housing', 'currency'
  regionName: string;      // e.g., '서울특별시', '강남구'
  scenarioHash?: string;   // 슬라이더 값 해시 (선택)
}

export function PolicyVote({ simulatorName, regionName, scenarioHash = '' }: PolicyVoteProps) {
  // itemId 생성: "policy:{simulatorName}:{regionName}:{hash}"
  const itemId = `policy:${simulatorName}:${regionName}:${scenarioHash}`;

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userVote, setUserVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 초기 로드: GET /api/votes?itemId=xxx
  useEffect(() => {
    fetch(`/api/votes?itemId=${encodeURIComponent(itemId)}`)
      .then(r => r.json())
      .then(data => {
        setCounts(data.counts || {});
        setUserVote(data.userVote || null);
      })
      .catch(() => {});
  }, [itemId]);

  // 투표 핸들러
  const handleVote = async (voteType: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, voteType }),
      });
      const data = await res.json();
      setCounts(data.counts || {});
      setUserVote(data.userVote || voteType);
    } catch {
      // ignore network errors silently
    } finally {
      setLoading(false);
    }
  };

  // 지지율 계산
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  const supportCount = counts['add'] || 0;
  const supportRate = total > 0 ? Math.round((supportCount / total) * 100) : 0;

  return (
    <div className="border border-gray-800 rounded-lg p-4 mt-4 bg-gray-900/50">
      <div className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-widest">
        시민 정책 평가
      </div>

      <p className="text-sm text-gray-300 mb-4">
        이 시뮬레이션 결과에 대한 의견을 남겨주세요
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {/* 지지 버튼 */}
        <button
          onClick={() => handleVote('add')}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
            userVote === 'add'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-emerald-600/20 hover:text-emerald-400'
          }`}
        >
          👍 이 정책을 지지합니다
        </button>

        {/* 반대 버튼 */}
        <button
          onClick={() => handleVote('reduce')}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
            userVote === 'reduce'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-red-600/20 hover:text-red-400'
          }`}
        >
          👎 다른 방안이 필요합니다
        </button>

        {/* 의문 버튼 */}
        <button
          onClick={() => handleVote('confused')}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
            userVote === 'confused'
              ? 'bg-amber-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-amber-600/20 hover:text-amber-400'
          }`}
        >
          🤔 더 분석이 필요합니다
        </button>
      </div>

      {/* 투표 결과 바 */}
      {total > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>시민 {total}명 참여</span>
            <span>지지율 {supportRate}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
            {(counts['add'] || 0) > 0 && (
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${(counts['add'] / total) * 100}%` }}
              />
            )}
            {(counts['confused'] || 0) > 0 && (
              <div
                className="h-full bg-amber-500"
                style={{ width: `${(counts['confused'] / total) * 100}%` }}
              />
            )}
            {(counts['reduce'] || 0) > 0 && (
              <div
                className="h-full bg-red-500"
                style={{ width: `${(counts['reduce'] / total) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span className="text-emerald-400">지지 {counts['add'] || 0}</span>
            <span className="text-amber-400">보류 {counts['confused'] || 0}</span>
            <span className="text-red-400">반대 {counts['reduce'] || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
}
