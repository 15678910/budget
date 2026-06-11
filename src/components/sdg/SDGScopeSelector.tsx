import { listMunicipalities } from '@/lib/sdg/municipal';

export type SDGScope = 'national' | 'metro' | 'municipal';

const SCOPES: { id: SDGScope; label: string }[] = [
  { id: 'national', label: '전국' },
  { id: 'metro', label: '광역' },
  { id: 'municipal', label: '기초' },
];

export function SDGScopeSelector({
  scope,
  metros,
  selectedMetro,
  selectedSgg,
  onScope,
  onMetro,
  onSgg,
}: {
  scope: SDGScope;
  metros: readonly string[];
  selectedMetro: string | null;
  selectedSgg: string | null;
  onScope: (s: SDGScope) => void;
  onMetro: (m: string | null) => void;
  onSgg: (s: string | null) => void;
}) {
  const sggList = scope === 'municipal' && selectedMetro ? listMunicipalities(selectedMetro) : [];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* 스코프 세그먼트 */}
      <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            onClick={() => onScope(s.id)}
            className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
              scope === s.id
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 광역 드롭다운 (광역·기초 공통) */}
      {(scope === 'metro' || scope === 'municipal') && (
        <select
          value={selectedMetro ?? ''}
          onChange={(e) => {
            const v = e.target.value || null;
            onMetro(v);
            onSgg(null); // 광역 변경 시 시군구 초기화
          }}
          className="rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-200"
        >
          <option value="">광역 선택…</option>
          {metros.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      )}

      {/* 시군구 드롭다운 (기초 + 광역 선택 시) */}
      {scope === 'municipal' && selectedMetro && (
        <select
          value={selectedSgg ?? ''}
          onChange={(e) => onSgg(e.target.value || null)}
          className="rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-200"
        >
          <option value="">시군구 선택…</option>
          {sggList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
