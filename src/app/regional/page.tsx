import { loadRegionalByMetro, loadRegionalByDistrict, loadRegionalMetadata } from '@/lib/data/load-budget';
import { calculateFiscalHealthScore, calculateDistrictHealthScore } from '@/lib/data/fiscal-health-data';
import { getMetroFiscalDataOfficial, getAllDistrictFiscalDataOfficial } from '@/lib/data/fiscal-health-official';
import fs from 'fs';
import path from 'path';
import { KoreaMap } from '@/components/map/KoreaMap';
import { formatAsOfSummary } from '@/lib/utils/format';
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

  // Load regional metadata to get available years and source/기준일 info
  const regionalMeta = loadRegionalMetadata();
  const years = regionalMeta.availableYears;
  const asOfSummary = formatAsOfSummary(regionalMeta.asOf);

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

  // Calculate fiscal health scores for all metro regions
  const metroFiscalData = getMetroFiscalDataOfficial();
  const healthScores: Record<string, { score: number; grade: string }> = {};
  for (const metro of metroFiscalData) {
    const result = calculateFiscalHealthScore(metro);
    healthScores[metro.name] = { score: result.total, grade: result.grade };
  }

  // Also calculate health scores for all districts
  const allDistrictData = getAllDistrictFiscalDataOfficial();
  for (const district of allDistrictData) {
    const result = calculateDistrictHealthScore(district);
    healthScores[district.name] = { score: result.total, grade: result.grade };
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">지역 예산 지도</h1>
        <p className="text-muted-foreground mb-1">대한민국 17개 광역시도의 예산을 지도에서 비교하세요</p>
        <p className="text-xs text-muted-foreground mb-6">
          출처: 지방재정365 세부사업별 세출(예산현액) · 기준일 {asOfSummary || '연도별 상이'} ·
          회계 간 내부거래·보전지출 제외. 광역(시·도) 금액은 시·도 본청 예산(소속 시·군·구 제외)입니다.
        </p>
        <KoreaMap
          metroDataByYear={metroDataByYear}
          districtDataByYear={districtDataByYear}
          geoData={geoData}
          districtGeoData={districtGeoData}
          availableYears={years}
          healthScores={healthScores}
        />
      </div>
    </main>
  );
}
