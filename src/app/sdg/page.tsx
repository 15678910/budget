import { SDGMapDashboard } from '@/components/sdg/SDGMapDashboard';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

export const metadata: Metadata = {
  title: 'SDG 지역 지도 (시도별 지속가능발전목표) | 마을살림/나라살림',
  description:
    '17개 지속가능발전목표(SDG)별 한국 시도 현황을 대표 지표로 지도화합니다. 통합 SDG 점수는 미공개이며 출처를 명시한 대표 지표 기반 시각화입니다.',
};

export default function SDGPage() {
  const geoData = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data', 'geo', 'korea-provinces-topo.json'), 'utf-8'),
  );
  return (
    <div className="w-full max-w-6xl mx-auto">
      <SDGMapDashboard geoData={geoData} />
    </div>
  );
}
