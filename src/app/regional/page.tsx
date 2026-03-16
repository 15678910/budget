import { loadRegionalByMetro, loadRegionalByDistrict, loadRegionalMetadata } from '@/lib/data/load-budget';
import fs from 'fs';
import path from 'path';
import { KoreaMap } from '@/components/map/KoreaMap';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '지역지도 - 마을살림/나라살림',
  description: '대한민국 17개 광역시도의 예산을 지도에서 비교하세요. 클릭하면 시군구별 예산을 볼 수 있습니다.',
};

export default function RegionalMapPage() {
  // Load geo data
  const geoPath = path.join(process.cwd(), 'data', 'geo', 'korea-provinces-topo.json');
  const geoData = JSON.parse(fs.readFileSync(geoPath, 'utf-8'));

  const districtGeoPath = path.join(process.cwd(), 'data', 'geo', 'korea-municipalities-topo.json');
  const districtGeoData = JSON.parse(fs.readFileSync(districtGeoPath, 'utf-8'));

  // Load regional metadata to get available years
  const regionalMeta = loadRegionalMetadata();
  const years = regionalMeta.availableYears;

  // Load metro data for all years
  const metroDataByYear: Record<number, any> = {};
  for (const y of years) {
    metroDataByYear[y] = loadRegionalByMetro(y);
  }

  // Load district data for all years
  const districtDataByYear: Record<number, any> = {};
  for (const y of years) {
    districtDataByYear[y] = loadRegionalByDistrict(y);
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">지역 예산 지도</h1>
        <p className="text-muted-foreground mb-6">대한민국 17개 광역시도의 예산을 지도에서 비교하세요</p>
        <KoreaMap
          metroDataByYear={metroDataByYear}
          districtDataByYear={districtDataByYear}
          geoData={geoData}
          districtGeoData={districtGeoData}
          availableYears={years}
        />
      </div>
    </main>
  );
}
