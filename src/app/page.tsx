import {
  loadBudgetByDomain,
  loadBudgetByMinistry,
  loadMetadata,
  loadRegionalByMetro,
  loadRegionalByDistrict,
  loadRegionalMetadata,
  loadEducationByOffice,
  loadEducationMetadata,
} from '@/lib/data/load-budget';
import { BudgetExplorer } from '@/components/BudgetExplorer';
import { SSRTreemap } from '@/components/treemap/SSRTreemap';
import { DEFAULT_YEAR } from '@/lib/constants';
import { formatKoreanWon } from '@/lib/utils/format';
import type { BudgetTreeNode } from '@/types/budget';

function calculateTotal(node: BudgetTreeNode): number {
  if (node.value !== undefined) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + calculateTotal(child), 0);
}

export default function Home() {
  const metadata = loadMetadata();
  const regionalMeta = loadRegionalMetadata();
  const educationMeta = loadEducationMetadata();

  // Use the union of all available years
  const allYears = [...new Set([
    ...metadata.availableYears,
    ...regionalMeta.availableYears,
    ...educationMeta.availableYears,
  ])].sort((a, b) => a - b);

  const initialYear = allYears.includes(DEFAULT_YEAR)
    ? DEFAULT_YEAR
    : allYears[allYears.length - 1];

  // Load all years' data for client-side year switching
  const domainDataByYear: Record<number, BudgetTreeNode> = {};
  const ministryDataByYear: Record<number, BudgetTreeNode> = {};
  const metroDataByYear: Record<number, BudgetTreeNode> = {};
  const districtDataByYear: Record<number, BudgetTreeNode> = {};
  const educationDataByYear: Record<number, BudgetTreeNode> = {};

  for (const y of metadata.availableYears) {
    domainDataByYear[y] = loadBudgetByDomain(y);
    ministryDataByYear[y] = loadBudgetByMinistry(y);
  }

  for (const y of regionalMeta.availableYears) {
    metroDataByYear[y] = loadRegionalByMetro(y);
    districtDataByYear[y] = loadRegionalByDistrict(y);
  }

  for (const y of educationMeta.availableYears) {
    educationDataByYear[y] = loadEducationByOffice(y);
  }

  // Merge metadata for year selector — use intersection of available years
  const mergedMetadata = {
    ...metadata,
    availableYears: allYears,
  };

  // SSR LCP optimization: pre-render treemap as HTML/CSS so it paints before JS loads
  const initialDomainData = domainDataByYear[initialYear];
  const totalBudget = initialDomainData ? calculateTotal(initialDomainData) : 0;

  const ssrFallback = initialDomainData ? (
    <>
      <div className="text-right mb-2">
        <div className="text-base font-medium">
          총 {formatKoreanWon(totalBudget)}
        </div>
      </div>
      <SSRTreemap data={initialDomainData} viewMode="domain" />
    </>
  ) : null;

  return (
    <BudgetExplorer
      domainDataByYear={domainDataByYear}
      ministryDataByYear={ministryDataByYear}
      metroDataByYear={metroDataByYear}
      districtDataByYear={districtDataByYear}
      educationDataByYear={educationDataByYear}
      metadata={mergedMetadata}
      initialYear={initialYear}
      ssrFallback={ssrFallback}
    />
  );
}
