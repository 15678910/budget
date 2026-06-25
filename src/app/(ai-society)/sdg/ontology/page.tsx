import type { Metadata } from 'next';
import OntologyView from '@/components/sdg/OntologyView';
import { buildOntology } from '@/lib/sdg/ontology';

export const metadata: Metadata = {
  title: 'SDG 데이터 온톨로지 관계도',
  description:
    '데이터셋·지표·SDG 목표·5대 영역의 관계를 노드-링크 그래프로 시각화합니다. 정의된 관계만 표시하며, AI는 기존 관계를 강조할 뿐 새 관계를 만들지 않습니다.',
};

export default function SDGOntologyPage() {
  const { nodes, edges } = buildOntology();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-50">SDG 데이터 온톨로지 관계도</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          데이터셋이 어떤 지표를 제공하고, 지표가 어떤 SDG 목표로 매핑되며, 목표가 어떤 5대 영역에
          속하는지 보여줍니다. 노드를 클릭하면 직접 연결된 이웃이 강조되고, 자연어 명령으로 특정
          관계만 포커스할 수 있습니다. SDG 목표를 선택하면 K-SDGs 세부목표(출처: 지속가능발전포털
          ncsd.go.kr)를 인스펙터에서 확인하고, 토글로 그래프에 펼칠 수 있습니다.
        </p>
      </header>
      <OntologyView nodes={nodes} edges={edges} />
    </div>
  );
}
