'use client';

import { useEffect, useMemo, useState } from 'react';
import { DISTRICT_SCHOOL_AGG } from '@/lib/data/education-districts';
import { METRO_EDUCATION_BUDGETS, computeDistribution, formatKRW } from '@/lib/data/education-budget';
import { EducationKoreaMap } from './EducationKoreaMap';

interface SchoolDetail { n: string; k: string; s: number; c: number; t: number }
interface DistDetail { code: string; name: string; sido: string; sggs?: string[]; schools: number; students: number; teachers: number; classes: number }
interface DetailData {
  byDistrict: Record<string, SchoolDetail[]>;
  districts: DistDetail[];
  metros: { sido: string; districts: number; schools: number; students: number; teachers: number }[];
}

const KIND_COLOR: Record<string, string> = { 초: '#3b82f6', 중: '#10b981', 고: '#f59e0b' };
const NATIONAL_GYOBU = 106.3; // 2026 지방교육재정 총규모(교육부 발표, 조원)

// 시도 정식명 → 약칭
const FULL_TO_SHORT: Record<string, string> = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천',
  광주광역시: '광주', 대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종',
  경기도: '경기', 강원특별자치도: '강원', 충청북도: '충북', 충청남도: '충남',
  전북특별자치도: '전북', 전라남도: '전남', 경상북도: '경북', 경상남도: '경남', 제주특별자치도: '제주',
};
// 시도 약칭 → 시도교육청 예산(조원)
const SIDO_BUDGET: Record<string, number> = Object.fromEntries(
  METRO_EDUCATION_BUDGETS.map((o) => [FULL_TO_SHORT[o.metro] ?? o.metro, o.budget2026]),
);
const NATIONAL_SIDO_BUDGET = METRO_EDUCATION_BUDGETS.reduce((s, o) => s + o.budget2026, 0);

// 교육지원청명 기준 예산 1인당(중복 코드 병합)
const BUDGET_BY_NAME: Record<string, number> = (() => {
  const agg: Record<string, { budget: number; students: number }> = {};
  for (const d of DISTRICT_SCHOOL_AGG) {
    const a = agg[d.name] ?? (agg[d.name] = { budget: 0, students: 0 });
    a.budget += d.schoolBudget; a.students += d.students;
  }
  return Object.fromEntries(Object.entries(agg).map(([n, v]) => [n, v.students > 0 ? v.budget / v.students : 0]));
})();

const KINDS = ['전체', '초', '중', '고'] as const;
type Kind = typeof KINDS[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EducationDistrictExplorer({ geoData }: { geoData: any }) {
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [sido, setSido] = useState<string | null>(null);
  const [distName, setDistName] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>('전체');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/education-schools-detail-2024.json')
      .then((r) => r.json()).then((j) => setDetail(j)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const metricBySido = useMemo(() => {
    const m: Record<string, number> = {};
    (detail?.metros ?? []).forEach((x) => { m[x.sido] = x.students; });
    return m;
  }, [detail]);

  // 교육지원청 목록 (본청 "○○교육청" 제외 — "지원청"만)
  const sidoDistricts = useMemo(() => {
    if (!detail) return [];
    const list = (sido ? detail.districts.filter((d) => d.sido === sido) : detail.districts)
      .filter((d) => d.name.includes('지원청'));
    return list.map((d) => ({ ...d, perStudent: BUDGET_BY_NAME[d.name] ?? 0 }))
      .sort((a, b) => b.students - a.students);
  }, [detail, sido]);

  const selectedDist = sidoDistricts.find((d) => d.name === distName);
  const allSchools = distName && detail ? detail.byDistrict[distName] ?? [] : [];
  const schools = kind === '전체' ? allSchools : allSchools.filter((s) => s.k === kind);

  // 지원금 상황판 (선택 시도 또는 전국)
  const sidoBudget = sido ? (SIDO_BUDGET[sido] ?? 0) : NATIONAL_SIDO_BUDGET;
  const gyobu = sido ? (NATIONAL_GYOBU * (sidoBudget / NATIONAL_SIDO_BUDGET)) : NATIONAL_GYOBU; // 시도 교부금 근사(예산 비례)

  const natStudents = (detail?.metros ?? []).reduce((s, m) => s + m.students, 0);
  const distStats = useMemo(() => {
    const vals = Object.values(BUDGET_BY_NAME).filter((v) => v > 0);
    return computeDistribution(vals);
  }, []);

  function selectSido(s: string) { setSido(s === sido ? null : s); setDistName(null); setKind('전체'); }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-100">교육지원청·학교 지도 탐색</h2>
        <p className="text-sm text-gray-400 leading-relaxed mt-1">
          지도에서 <strong className="text-gray-200">시도</strong>를 클릭하면 <strong className="text-gray-200">교육지원청</strong> 목록이,
          교육지원청을 클릭하면 관내 <strong className="text-gray-200">학교(초·중·고)</strong>가 학생수·교원수·학급수와 함께 표시됩니다.
        </p>
      </div>

      {/* 지원금 상황판 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label={`${sido ?? '전국'} 중앙 교부금`} value={`${gyobu.toFixed(1)}조`} sub="지방교육재정교부금(근사)" accent="indigo" />
        <Card label={`${sido ?? '전국'} 시도교육청 예산`} value={`${sidoBudget.toFixed(1)}조`} sub="2026 세입총계" accent="blue" />
        <Card label="기초단체 교육경비" value="제한" sub="지방재정365 LINK(미수집)" accent="gray" />
        <Card label={sido ? `${sido} 학생수` : '전국 학생수'} value={
          sido ? `${((metricBySido[sido] ?? 0) / 10000).toFixed(1)}만명` : (natStudents ? `${(natStudents / 10000).toFixed(0)}만명` : '—')
        } sub="초·중·고" accent="gray" />
      </div>

      {/* 지도(확대) + 우측 패널 */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* 지도 */}
        <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-300">시도 선택</h3>
            {sido && (
              <button onClick={() => { setSido(null); setDistName(null); }}
                className="text-xs text-blue-400 hover:text-blue-300">전국 보기 ✕</button>
            )}
          </div>
          <div className="max-w-[520px] mx-auto">
            <EducationKoreaMap geoData={geoData} selectedSido={sido} onSelect={selectSido} metricBySido={metricBySido} />
          </div>
          <p className="text-[11px] text-gray-500 mt-1 text-center">시도를 클릭하면 교육지원청이 표시됩니다 · +/− 로 확대</p>
        </div>

        {/* 우측: 교육지원청 목록 / 학교 목록 */}
        <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
          {!selectedDist ? (
            <>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                {sido ? `${sido} 교육지원청` : '전국 교육지원청'} <span className="text-gray-500">({sidoDistricts.length})</span>
              </h3>
              {loading ? (
                <div className="text-sm text-gray-500 py-10 text-center">불러오는 중…</div>
              ) : sidoDistricts.length === 0 ? (
                <div className="text-sm text-gray-500 py-10 text-center">지도에서 시도를 선택하세요.</div>
              ) : (
                <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
                  {sidoDistricts.map((d) => (
                    <button key={d.name} onClick={() => { setDistName(d.name); setKind('전체'); }}
                      className="w-full px-2.5 py-2 rounded text-left hover:bg-gray-800/60 border border-transparent hover:border-gray-700 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-sm text-gray-200 truncate">{d.name}</span>
                        <span className="text-[11px] text-gray-500">{d.schools}교</span>
                        <span className="text-xs text-gray-300 w-16 text-right">{(d.students / 10000).toFixed(1)}만명</span>
                        {d.perStudent > 0 && <span className="text-[11px] text-emerald-400 w-20 text-right">{formatKRW(d.perStudent)}</span>}
                      </div>
                      {d.sggs && d.sggs.length > 0 && (
                        <div className="text-[11px] text-gray-500 mt-0.5 truncate">관할: {d.sggs.join(' · ')}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-200">{selectedDist.name}</h3>
                  {selectedDist.sggs && selectedDist.sggs.length > 0 && (
                    <div className="text-[11px] text-gray-500">관할 시군구: {selectedDist.sggs.join(' · ')}</div>
                  )}
                  <div className="flex gap-3 text-[11px] text-gray-400 mt-0.5 flex-wrap">
                    <span>학교 {selectedDist.schools}</span>
                    <span>학생 {selectedDist.students.toLocaleString()}</span>
                    <span>교원 {selectedDist.teachers.toLocaleString()}</span>
                    {selectedDist.perStudent > 0 && <span className="text-emerald-400">1인당 {formatKRW(selectedDist.perStudent)}</span>}
                  </div>
                </div>
                <button onClick={() => setDistName(null)} className="text-xs text-blue-400 hover:text-blue-300 shrink-0">← 목록</button>
              </div>
              {/* 유/초/중/고 필터 버튼 */}
              <div className="flex gap-1.5 mb-2 flex-wrap">
                <button disabled title="유치원은 학교알리미 미제공(유치원알리미 별도)"
                  className="px-2.5 py-1 text-xs rounded border border-gray-800 text-gray-600 cursor-not-allowed">유 (없음)</button>
                {KINDS.map((k) => (
                  <button key={k} onClick={() => setKind(k)}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                      kind === k ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                    }`}>
                    {k}{k !== '전체' ? `(${allSchools.filter((s) => s.k === k).length})` : `(${allSchools.length})`}
                  </button>
                ))}
              </div>
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead className="sticky top-0 bg-gray-900">
                    <tr className="text-gray-500 border-b border-gray-700">
                      <th className="text-left py-1.5 px-1.5">학교</th>
                      <th className="text-center py-1.5 px-1">급</th>
                      <th className="text-right py-1.5 px-1.5">학생</th>
                      <th className="text-right py-1.5 px-1.5">교원</th>
                      <th className="text-right py-1.5 px-1.5">학급</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schools.map((s, i) => (
                      <tr key={i} className="border-b border-gray-800/40">
                        <td className="py-1.5 px-1.5 text-gray-200">{s.n}</td>
                        <td className="text-center py-1.5 px-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] text-white" style={{ background: KIND_COLOR[s.k] ?? '#6b7280' }}>{s.k}</span>
                        </td>
                        <td className="text-right py-1.5 px-1.5 text-gray-300">{s.s.toLocaleString()}</td>
                        <td className="text-right py-1.5 px-1.5 text-gray-300">{s.t.toLocaleString()}</td>
                        <td className="text-right py-1.5 px-1.5 text-gray-400">{s.c.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 도농 격차 요약 */}
      <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">교육지원청 1인당 예산 격차 (학교회계 기준)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <Mini label="최고(농어촌)" value={formatKRW(distStats.max)} color="text-red-400" />
          <Mini label="최저(도시)" value={formatKRW(distStats.min)} color="text-amber-400" />
          <Mini label="격차" value={`${distStats.spread.toFixed(1)}배`} color="text-gray-100" />
          <Mini label="지니계수" value={distStats.gini.toFixed(3)} color="text-blue-300" />
        </div>
        <p className="text-[11px] text-gray-500 mt-2">
          ※ 소규모 학교가 많은 농어촌 교육지원청일수록 학생 1인당 학교회계 예산이 높습니다(고정비). 본청(○○교육청)은 목록에서 제외.
          기초단체 교육경비보조금은 지방재정365 LINK 방식이라 자동수집이 불가합니다.
        </p>
      </div>
    </div>
  );
}

function Card({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'indigo' | 'blue' | 'gray' }) {
  const border = accent === 'indigo' ? 'border-indigo-800/50' : accent === 'blue' ? 'border-blue-800/50' : 'border-gray-800';
  const text = accent === 'indigo' ? 'text-indigo-300' : accent === 'blue' ? 'text-blue-300' : 'text-gray-100';
  return (
    <div className={`border ${border} bg-gray-900/40 rounded-lg p-4`}>
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`text-xl font-bold mt-1 ${text}`}>{value}</div>
      {sub && <div className="text-[11px] text-gray-500">{sub}</div>}
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border border-gray-800 rounded p-2.5">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className={`text-base font-bold mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}
