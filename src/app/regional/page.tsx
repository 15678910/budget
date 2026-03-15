import { loadRegionalByMetro, loadRegionalMetadata } from '@/lib/data/load-budget';
import fs from 'fs';
import path from 'path';
import { KoreaMap } from '@/components/map/KoreaMap';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '지역지도 - 마을살림나라살림',
  description: '대한민국 17개 광역시도 예산을 지도로 한눈에 비교합니다.',
};

export default function RegionalMapPage() {
  // Load geo data
  const geoPath = path.join(process.cwd(), 'data', 'geo', 'korea-provinces-topo.json');
  const geoData = JSON.parse(fs.readFileSync(geoPath, 'utf-8'));

  // Load regional metadata to get available years
  const regionalMeta = loadRegionalMetadata();
  const years = regionalMeta.availableYears;

  // Load metro data for all years
  const metroDataByYear: Record<number, any> = {};
  for (const y of years) {
    metroDataByYear[y] = loadRegionalByMetro(y);
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">지역 예산 지도</h1>
        <p className="text-muted-foreground mb-6">대한민국 17개 광역시도의 예산을 지도에서 비교하세요</p>
        <KoreaMap
          metroDataByYear={metroDataByYear}
          geoData={geoData}
          availableYears={years}
        />
      </div>
    </main>
  );
}
