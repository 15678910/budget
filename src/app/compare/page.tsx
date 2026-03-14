import {
  loadBudgetByDomain,
  loadMetadata,
  loadRegionalByMetro,
  loadRegionalByDistrict,
  loadRegionalMetadata,
  loadEducationByOffice,
  loadEducationMetadata,
} from "@/lib/data/load-budget";
import { UnifiedComparePage } from "@/components/comparison/UnifiedComparePage";
import type { BudgetTreeNode } from "@/types/budget";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "예산 비교 | 나라살림",
  description: "한국 정부 예산을 연도별·지역별로 비교합니다.",
};

export default function CompareRoute() {
  const meta = loadMetadata();
  const regionalMeta = loadRegionalMetadata();
  const educationMeta = loadEducationMetadata();

  const allYears = [...new Set([
    ...meta.availableYears,
    ...regionalMeta.availableYears,
    ...educationMeta.availableYears,
  ])].sort((a, b) => a - b);

  const domainDataByYear: Record<number, BudgetTreeNode> = {};
  for (const year of meta.availableYears) {
    domainDataByYear[year] = loadBudgetByDomain(year);
  }

  const metroDataByYear: Record<number, BudgetTreeNode> = {};
  const districtDataByYear: Record<number, BudgetTreeNode> = {};
  for (const year of regionalMeta.availableYears) {
    metroDataByYear[year] = loadRegionalByMetro(year);
    districtDataByYear[year] = loadRegionalByDistrict(year);
  }

  const educationDataByYear: Record<number, BudgetTreeNode> = {};
  for (const year of educationMeta.availableYears) {
    educationDataByYear[year] = loadEducationByOffice(year);
  }

  const mergedMetadata = {
    ...meta,
    availableYears: allYears,
  };

  const defaultYearA = allYears.length >= 2 ? allYears[allYears.length - 2] : allYears[0];
  const defaultYearB = allYears[allYears.length - 1];

  return (
    <UnifiedComparePage
      domainDataByYear={domainDataByYear}
      metroDataByYear={metroDataByYear}
      districtDataByYear={districtDataByYear}
      educationDataByYear={educationDataByYear}
      metadata={mergedMetadata}
      defaultYearA={defaultYearA}
      defaultYearB={defaultYearB}
      availableYears={allYears}
      defaultYear={allYears[allYears.length - 1]}
    />
  );
}
