"use client";

import dynamic from "next/dynamic";

const GuidedTour = dynamic(
  () => import("@/components/shared/GuidedTour").then(mod => ({ default: mod.GuidedTour })),
  { ssr: false }
);

const AnalyticsTracker = dynamic(
  () => import("@/components/analytics/AnalyticsTracker").then(mod => ({ default: mod.AnalyticsTracker })),
  { ssr: false }
);

const BudgetChatbot = dynamic(
  () => import("@/components/chat/BudgetChatbot").then(mod => ({ default: mod.BudgetChatbot })),
  { ssr: false }
);

export function LazyOverlays() {
  return (
    <>
      <GuidedTour />
      <AnalyticsTracker />
      <BudgetChatbot />
    </>
  );
}
