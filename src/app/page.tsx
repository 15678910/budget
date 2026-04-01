import {
  loadBudgetByDomain,
  loadMetadata,
  loadRegionalMetadata,
  loadEducationMetadata,
} from '@/lib/data/load-budget';
import { BudgetExplorer } from '@/components/BudgetExplorer';
import { DEFAULT_YEAR } from '@/lib/constants';

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

  // Only load initial view data — rest will be fetched on demand via API
  const initialData = loadBudgetByDomain(initialYear);

  return (
    <BudgetExplorer
      initialData={initialData}
      initialYear={initialYear}
      availableYears={allYears}
    />
  );
}
