'use client';

import { useEffect, useMemo, useState } from 'react';
import { DISTRICT_SCHOOL_AGG, SCHOOL_TOTAL_COUNT } from '@/lib/data/education-districts';
import { computeDistribution, formatKRW } from '@/lib/data/education-budget';
import { EducationKoreaMap } from './EducationKoreaMap';

interface SchoolDetail { n: string; k: string; s: number; c: number; t: number }
interface DistDetail { code: string; name: string; sido: string; schools: number; students: number; teachers: number; classes: number }
interface DetailData {
  byDistrict: Record<string, SchoolDetail[]>;
  districts: DistDetail[];
  metros: { sido: string; districts: number; schools: number; students: number; teachers: number }[];
}

const KIND_COLOR: Record<string, string> = { 초: '#3b82f6', 중: '#10b981', 고: '#f59e0b' };

// 예산(1인당) 조회용 — 교육지원청명 기준 합산(중복 코드 병합) → perStudent
const BUDGET_BY_NAME: Record<string, number> = (() => {
  const agg: Record<string, { budget: number; students: number }> = {};
  for (const d of DISTRICT_SCHOOL_AGG) {
    const a = agg[d.name] ?? (agg[d.name] = { budget: 0, students: 0 });
    a.budget += d.schoolBudget;
    a.students += d.students;
  }
  return Object.fromEntries(
    Object.entries(agg).map(([name, v]) => [name, v.students > 0 ? v.budget / v.students : 0]),
  );
})();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EducationDistrictExplorer({ geoData }: { geoData: any }) {
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [sido, setSido] = useState<string | null>(null);
  const [distCode, setDistCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/education-schools-detail-2024.json')
      .then((r) => r.json())
      .then((j) => setDetail(j))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 지도 색상 메트릭 — 시도별 학생수
  const metricBySido = useMemo(() => {
    const m: Record<string, number> = {};
    (detail?.metros ?? []).forEach((x) => { m[x.sido] = x.students; });
    return m;
  }, [detail]);

  // 선택 시도의 교육지원청
  const sidoDistricts = useMemo(() => {
    if (!detail) return [];
    const list = sido ? detail.districts.filter((d) => d.sido === sido) : detail.districts;
    return list.map((d) => ({ ...d, perStudent: BUDGET_BY_NAME[d.name] ?? 0 }))
      .sort((a, b) => b.students - a.students);
  }, [detail, sido]);

  const schools = distCode && detail ? detail.byDistrict[distCode] ?? [] : [];
  const selectedDist = sidoDistricts.find((d) => d.code === distCode);

  // 전국 요약
  const natStudents = (detail?.metros ?? []).reduce((s, m) => s + m.students, 0);
  const natTeachers = (detail?.metros ?? []).reduce((s, m) => s + m.teachers, 0);
  const distStats = useMemo(() => computeDistribution(DISTRICT_SCHOOL_AGG.map((d) => d.perStudent)), []);

  function selectSido(s: string) {
    setSido(s === sido ? null : s);
    setDistCode(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-100">교육지원청·학교 지도 탐색</h2>
        <p className="text-sm text-gray-400 leading-relaxed mt-1">
          지도에서 <strong className="text-gray-200">시도</strong>를 클릭 → <strong className="text-gray-200">교육지원청</strong> 선택 →
          관내 <strong className="text-gray-200">초·중·고 학교별 학생수·교원수·학급수</strong>를 확인합니다.
          <span className="text-gray-500"> (출처: 학교알리미 · 학교회계 예산은 교육지원청 1인당 기준)</span>
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="교육지원청" value={`${DISTRICT_SCHOOL_AGG.length}곳`} />
        <Card label="학교 수" value={`${SCHOOL_TOTAL_COUNT.toLocaleString()}교`} sub="초·중·고" />
        <Card label="학생 수" value={natStudents ? `${(natStudents / 10000).toFixed(0)}만명` : '—'} />
        <Card label="교원 수" value={natTeachers ? `${(natTeachers / 10000).toFixed(1)}만명` : '—'} />
      </div>

      {/* 3패널: 지도 → 교육지원청 → 학교 */}
      <div className="grid lg:grid-cols-[340px_1fr_1fr] gap-4">
        {/* 패널1: 지도 */}
        <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-300">시도 선택</h3>
            {sido && (
              <button onClick={() => { setSido(null); setDistCode(null); }}
                className="text-xs text-blue-400 hover:text-blue-300">전국 보기 ✕</button>
            )}
          </div>
          <EducationKoreaMap geoData={geoData} selectedSido={sido} onSelect={selectSido} metricBySido={metricBySido} />
          <p className="text-[11px] text-gray-500 mt-1 text-center">색이 진할수록 학생수 많음</p>
        </div>

        {/* 패널2: 교육지원청 목록 */}
        <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            {sido ? `${sido} 교육지원청` : '전국 교육지원청'} <span className="text-gray-500">({sidoDistricts.length})</span>
          </h3>
          {loading ? (
            <div className="text-sm text-gray-500 py-6 text-center">불러오는 중…</div>
          ) : (
            <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
              {sidoDistricts.map((d) => (
                <button key={d.code} onClick={() => setDistCode(d.code)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-left transition-colors ${
                    distCode === d.code ? 'bg-blue-600/30 border border-blue-500/50' : 'hover:bg-gray-800/60 border border-transparent'
                  }`}>
                  <span className="flex-1 text-sm text-gray-200 truncate">{d.name}</span>
                  <span className="text-[11px] text-gray-500">{d.schools}교</span>
                  <span className="text-xs text-gray-300 w-16 text-right">{(d.students / 10000).toFixed(1)}만명</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 패널3: 학교 목록 */}
        <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-3">
          {!selectedDist ? (
            <div className="text-sm text-gray-500 py-10 text-center">
              교육지원청을 선택하면<br />관내 학교 목록이 표시됩니다.
            </div>
          ) : (
            <>
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-gray-200">{selectedDist.name}</h3>
                <div className="flex gap-3 text-[11px] text-gray-400 mt-0.5 flex-wrap">
                  <span>학교 {selectedDist.schools}</span>
                  <span>학생 {selectedDist.students.toLocaleString()}</span>
                  <span>교원 {selectedDist.teachers.toLocaleString()}</span>
                  <span>학급 {selectedDist.classes.toLocaleString()}</span>
                  {selectedDist.perStudent > 0 && <span className="text-emerald-400">1인당 {formatKRW(selectedDist.perStudent)}</span>}
                </div>
              </div>
              <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
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

      {/* 도농 격차 요약 (기존 분석 유지) */}
      <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">교육지원청 1인당 예산 격차 (학교회계 기준)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <Mini label="최고(농어촌)" value={formatKRW(distStats.max)} color="text-red-400" />
          <Mini label="최저(도시)" value={formatKRW(distStats.min)} color="text-amber-400" />
          <Mini label="격차" value={`${distStats.spread.toFixed(1)}배`} color="text-gray-100" />
          <Mini label="지니계수" value={distStats.gini.toFixed(3)} color="text-blue-300" />
        </div>
        <p className="text-[11px] text-gray-500 mt-2">
          ※ 소규모 학교가 많은 농어촌 교육지원청일수록 학생 1인당 학교회계 예산이 높습니다(고정비). 1인당 예산은 학교회계(인건비 제외) 기준.
        </p>
      </div>
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-gray-800 bg-gray-900/40 rounded-lg p-4">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-xl font-bold text-gray-100 mt-1">{value}</div>
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
