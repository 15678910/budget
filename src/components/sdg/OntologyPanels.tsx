'use client';

import type { OntologyNode, OntologyCounts } from '@/lib/sdg/ontology';
import HelpTip from '@/components/sdg/HelpTip';

/** INSIGHTS: 엔티티/관계/속성 카운트 패널. */
export function InsightsPanel({ counts }: { counts: OntologyCounts }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">INSIGHTS</h3>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-center">
        <div>
          <dt className="flex justify-center text-xs text-slate-400">
            <HelpTip
              align="right"
              tip="그래프의 노드 총수입니다. 데이터셋·지표·SDG 목표·5대 영역을 모두 셉니다(펼친 세부목표 포함)."
            >
              엔티티
            </HelpTip>
          </dt>
          <dd className="text-lg font-bold text-slate-800">{counts.entities}</dd>
        </div>
        <div>
          <dt className="flex justify-center text-xs text-slate-400">
            <HelpTip
              align="right"
              tip="노드를 잇는 연결(엣지)의 총수입니다. 제공(데이터셋→지표)·매핑(지표→목표)·소속(목표→영역)·세부목표 관계를 포함합니다."
            >
              관계
            </HelpTip>
          </dt>
          <dd className="text-lg font-bold text-slate-800">{counts.relationships}</dd>
        </div>
        <div>
          <dt className="flex justify-center text-xs text-slate-400">
            <HelpTip
              align="right"
              tip="노드에 부여된 메타 속성의 합입니다. 예: 지표의 단위·해석 방향(높을수록/낮을수록 좋음)·출처."
            >
              속성
            </HelpTip>
          </dt>
          <dd className="text-lg font-bold text-slate-800">{counts.properties}</dd>
        </div>
        <div>
          <dt className="flex justify-center text-xs text-slate-400">
            <HelpTip
              align="right"
              tip="한국형 SDG 세부목표의 총수입니다(출처: 지속가능발전포털, 118개). 그래프 표시 여부와 무관한 전체 수."
            >
              K-SDGs 세부목표
            </HelpTip>
          </dt>
          <dd className="text-lg font-bold text-slate-800">{counts.targets}</dd>
        </div>
        <div className="col-span-2">
          <dt className="flex justify-center text-xs text-slate-400">
            <HelpTip
              align="right"
              tip="유엔 공식 SDG 세부목표의 총수입니다(169개, A/RES/70/1). 그래프 표시 여부와 무관한 전체 수."
            >
              UN 169 세부목표
            </HelpTip>
          </dt>
          <dd className="text-lg font-bold text-slate-800">{counts.unTargets}</dd>
        </div>
      </dl>
    </div>
  );
}

interface PathFinderPanelProps {
  options: OntologyNode[];
  fromId: string;
  toId: string;
  onFromChange: (id: string) => void;
  onToChange: (id: string) => void;
  onFind: () => void;
  note: string | null;
}

/** PATH FINDER: 두 노드 select + 경로 찾기 버튼. */
export function PathFinderPanel({
  options,
  fromId,
  toId,
  onFromChange,
  onToChange,
  onFind,
  note,
}: PathFinderPanelProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">PATH FINDER</h3>
      <div className="mt-2 space-y-2">
        <label className="block">
          <span className="inline-flex text-xs font-medium text-slate-600">
            <HelpTip align="right" tip="경로 탐색을 시작할 노드를 선택합니다.">출발</HelpTip>
          </span>
          <select
            value={fromId}
            onChange={(e) => onFromChange(e.target.value)}
            className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 focus:border-slate-500 focus:outline-none"
          >
            <option value="">선택…</option>
            {options.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="inline-flex text-xs font-medium text-slate-600">
            <HelpTip
              align="right"
              tip="경로가 끝날 노드를 선택합니다. [경로 찾기]를 누르면 출발–도착 사이 최단 연결 경로를 그래프에 강조해 보여줍니다."
            >
              도착
            </HelpTip>
          </span>
          <select
            value={toId}
            onChange={(e) => onToChange(e.target.value)}
            className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 focus:border-slate-500 focus:outline-none"
          >
            <option value="">선택…</option>
            {options.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onFind}
          className="w-full rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-600"
        >
          경로 찾기
        </button>
        {note && (
          <p className="text-[11px] text-slate-500" role="status">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
