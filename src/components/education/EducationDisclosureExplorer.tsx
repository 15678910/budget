'use client';

import { useMemo, useState } from 'react';
import { SCHOOLINFO_REGIONS } from '@/lib/data/schoolinfo-regions';
import {
  DISCLOSURE_ITEMS, UNAVAILABLE_ITEMS, SCHOOL_KINDS, COMMON_LABELS, DISCLOSURE_YEAR,
  type DisclosureItem,
} from '@/lib/data/schoolinfo-catalog';

type Row = Record<string, string | number | null>;

const HIDDEN_COLS = new Set([
  'ATPT_OFCDC_ORG_CODE', 'JU_ORG_CODE', 'SCHUL_CODE', 'LCTN_SC_CODE', 'ADRCD_CD',
  'BNHH_YN', 'PBAN_EXCP_YN', 'SCHUL_KND_SC_CODE', 'SCHUL_CRSE_SC_VALUE', 'FAS_DTN_SC_CODE',
  'PBAN_REV_EX_SC_CODE',
]);

export function EducationDisclosureExplorer() {
  const [sidoCode, setSidoCode] = useState(SCHOOLINFO_REGIONS[0]?.code ?? '11');
  const [sggCode, setSggCode] = useState(SCHOOLINFO_REGIONS[0]?.sgg[0]?.code ?? '');
  const [schulKnd, setSchulKnd] = useState('02');
  const [apiType, setApiType] = useState('09');
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [queried, setQueried] = useState(false);
  const [showRaw, setShowRaw] = useState(false); // 미검증 원자료 코드 열 표시 여부

  const sido = useMemo(() => SCHOOLINFO_REGIONS.find((s) => s.code === sidoCode), [sidoCode]);
  const item = useMemo<DisclosureItem>(() => DISCLOSURE_ITEMS.find((d) => d.apiType === apiType)!, [apiType]);

  // 가나다 정렬 (광역·기초)
  const sidosSorted = useMemo(() => [...SCHOOLINFO_REGIONS].sort((a, b) => a.name.localeCompare(b.name, 'ko')), []);
  const sggsSorted = useMemo(() => [...(sido?.sgg ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'ko')), [sido]);
  // 결과 행 학교명 가나다 정렬
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => String(a.SCHUL_NM ?? '').localeCompare(String(b.SCHUL_NM ?? ''), 'ko')),
    [rows],
  );

  const labelOf = (c: string) => COMMON_LABELS[c] ?? item.fieldLabels[c] ?? c;
  const isLabeled = (c: string) => COMMON_LABELS[c] != null || item.fieldLabels[c] != null;

  const cols = useMemo(() => {
    if (rows.length === 0) return [];
    // primaryCols 우선, 그 외 숨김컬럼 제외하고 추가
    const present = Object.keys(rows[0]);
    const ordered = [
      ...item.primaryCols.filter((c) => present.includes(c)),
      ...present.filter((c) => !item.primaryCols.includes(c) && !HIDDEN_COLS.has(c)),
    ];
    // 기본: 라벨 검증된 열 + primaryCols만. 토글 시 원자료 전체.
    if (showRaw) return ordered;
    return ordered.filter((c) => item.primaryCols.includes(c) || COMMON_LABELS[c] != null || item.fieldLabels[c] != null);
  }, [rows, item, showRaw]);

  // 숨겨진(미라벨) 열 개수
  const hiddenCount = useMemo(() => {
    if (rows.length === 0) return 0;
    return Object.keys(rows[0]).filter((c) => !HIDDEN_COLS.has(c) && !item.primaryCols.includes(c) && !isLabeled(c)).length;
  }, [rows, item]); // eslint-disable-line react-hooks/exhaustive-deps

  async function runQuery() {
    if (!sggCode) { setMsg('시군구를 선택해주세요.'); return; }
    setLoading(true); setMsg(''); setQueried(true);
    try {
      const qs = new URLSearchParams({
        apiType, year: DISCLOSURE_YEAR, schulKndCode: schulKnd, sidoCode, sggCode,
        ...(item.depthNo ? { depthNo: item.depthNo } : {}),
        ...(item.depthNo2 ? { depthNo2: item.depthNo2 } : {}),
      });
      const res = await fetch(`/api/schoolinfo/query?${qs.toString()}`);
      const json = await res.json();
      if (json.error) { setMsg(json.error); setRows([]); }
      else { setRows(json.list ?? []); setMsg(json.message ?? ''); }
    } catch {
      setMsg('조회 중 오류가 발생했습니다.'); setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (rows.length === 0) return;
    const header = cols.map(labelOf).join(',');
    const body = sortedRows.map((r) => cols.map((c) => {
      const v = r[c] ?? '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    }).join(',')).join('\n');
    const bom = '﻿'; // Excel 한글 깨짐 방지
    const blob = new Blob([bom + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name}_${sido?.name ?? ''}_${DISCLOSURE_YEAR}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-bold text-gray-100">의원 셀프조회 — 교육 공시자료</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          매년 반복되는 정형 자료요구를 의원·보좌진·시민이 직접 조회·내보내기 하도록 만든 도구입니다.
          지역·항목을 선택하면 <strong className="text-gray-200">학교알리미</strong>의 공식 공시자료를
          실시간으로 불러옵니다. <span className="text-gray-500">(자료요구 → 셀프조회로 교사 재취합 노동 제거)</span>
        </p>
      </div>

      {/* 조회 조건 */}
      <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select value={sidoCode} onChange={(e) => { setSidoCode(e.target.value); const s = SCHOOLINFO_REGIONS.find((x) => x.code === e.target.value); setSggCode(s?.sgg[0]?.code ?? ''); }}
            className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-2">
            {sidosSorted.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
          <select value={sggCode} onChange={(e) => setSggCode(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-2">
            {sggsSorted.map((g) => <option key={g.code} value={g.code}>{g.name}</option>)}
          </select>
          <select value={schulKnd} onChange={(e) => setSchulKnd(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-2">
            {SCHOOL_KINDS.map((k) => <option key={k.code} value={k.code}>{k.name}</option>)}
          </select>
          <select value={apiType} onChange={(e) => setApiType(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-2">
            {DISCLOSURE_ITEMS.map((d) => <option key={d.apiType} value={d.apiType}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={runQuery} disabled={loading}
            className="px-4 py-2 text-sm font-semibold rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">
            {loading ? '조회 중…' : '조회'}
          </button>
          <button onClick={exportCsv} disabled={rows.length === 0}
            className="px-4 py-2 text-sm rounded border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40">
            📥 CSV 내보내기
          </button>
          <button onClick={() => window.print()} disabled={rows.length === 0}
            className="px-4 py-2 text-sm rounded border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40">
            🖨 인쇄(PDF)
          </button>
          <span className="text-xs text-gray-500">{DISCLOSURE_YEAR}년 공시 · 출처 학교알리미</span>
        </div>
        <p className="text-xs text-gray-500 border-t border-gray-800 pt-2">
          📋 <strong className="text-gray-400">{item.name}</strong> — {item.desc}
        </p>
      </div>

      {/* 결과 */}
      {queried && (
        <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
          {loading ? (
            <div className="text-sm text-gray-500 py-6 text-center">학교알리미에서 불러오는 중…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-500 py-6 text-center">{msg || '데이터가 없습니다.'}</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <span className="text-sm text-gray-300">{sido?.name} {sido?.sgg.find((g) => g.code === sggCode)?.name} · <strong>{rows.length}개교</strong></span>
                {hiddenCount > 0 && (
                  <button onClick={() => setShowRaw((v) => !v)}
                    className="text-xs px-2.5 py-1 rounded border border-gray-700 text-gray-300 hover:bg-gray-800">
                    {showRaw ? `원자료 코드 열 숨기기` : `원자료 코드 열 보기 (+${hiddenCount})`}
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      {cols.map((c) => <th key={c} className="text-left py-2 px-2 whitespace-nowrap">{labelOf(c)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((r, i) => (
                      <tr key={i} className="border-b border-gray-800/40">
                        {cols.map((c) => <td key={c} className="py-1.5 px-2 text-gray-200 whitespace-nowrap">{String(r[c] ?? '')}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                ※ 학교명 가나다순 정렬. {(apiType === '09' || apiType === '62') && '학년별 컬럼: 학생수=N학년 학생, 학급=N학년 학급수, 학급당=학급당 학생수(학생÷학급). 초등 1~6학년·중고 1~3학년, 「특수학급」은 특수학급분, 「(계)」는 합계. '}
                기본은 <strong className="text-gray-500">한글 라벨이 검증된 열</strong>만 표시합니다. 학교알리미 원자료 코드(미검증)는 「원자료 코드 열 보기」로 펼칠 수 있으며, 코드 정의는 학교알리미 공시 페이지를 참조하세요. (CSV 내보내기는 현재 보이는 열 기준)
              </p>
            </>
          )}
        </div>
      )}

      {/* 비공개 항목 안내 */}
      <div className="border border-amber-900/40 bg-amber-950/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-amber-300 mb-2">⚠️ 공개되지 않는 항목 (자동조회 불가)</h3>
        <ul className="space-y-1 text-xs text-amber-200/80">
          {UNAVAILABLE_ITEMS.map((u) => (
            <li key={u.name}>• <strong>{u.name}</strong> — {u.reason}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
