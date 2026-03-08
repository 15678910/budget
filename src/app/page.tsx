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
import { DEFAULT_YEAR } from '@/lib/constants';
import type { BudgetTreeNode } from '@/types/budget';

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

  return (
    <BudgetExplorer
      domainDataByYear={domainDataByYear}
      ministryDataByYear={ministryDataByYear}
      metroDataByYear={metroDataByYear}
      districtDataByYear={districtDataByYear}
      educationDataByYear={educationDataByYear}
      metadata={mergedMetadata}
      initialYear={initialYear}
    />
  );
}
