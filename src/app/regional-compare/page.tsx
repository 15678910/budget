import { RegionalCompareDashboard } from '@/components/regional/RegionalCompareDashboard';
import {
  loadRegionalByMetro,
  loadRegionalByDistrict,
  loadRegionalMetadata,
  loadEducationByOffice,
  loadEducationMetadata,
} from '@/lib/data/load-budget';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '지역재정 비교 | 나라살림',
  description: '광역시도, 자치구, 교육청별 예산 비교 대시보드',
};

export default function RegionalComparePage() {
  const regionalMeta = loadRegionalMetadata();
  const educationMeta = loadEducationMetadata();

  const metroDataByYear: Record<number, any> = {};
  const districtDataByYear: Record<number, any> = {};
  for (const year of regionalMeta.availableYears) {
    metroDataByYear[year] = loadRegionalByMetro(year);
    districtDataByYear[year] = loadRegionalByDistrict(year);
  }

  const educationDataByYear: Record<number, any> = {};
  for (const year of educationMeta.availableYears) {
    educationDataByYear[year] = loadEducationByOffice(year);
  }

  const allYears = [
    ...new Set([...regionalMeta.availableYears, ...educationMeta.availableYears]),
  ].sort((a, b) => a - b);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <RegionalCompareDashboard
        metroDataByYear={metroDataByYear}
        districtDataByYear={districtDataByYear}
        educationDataByYear={educationDataByYear}
        availableYears={allYears}
        defaultYear={allYears[allYears.length - 1]}
      />
    </div>
  );
}
