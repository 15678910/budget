import { AISocietySidebar } from '@/components/layout/AISocietySidebar';

/**
 * 예산분쟁 페이지도 허브 사이드바를 단다. 사이드바의 「예산분쟁」 그룹에서 들어온 독자가
 * 분쟁 사이를 오갈 수 있어야 하므로, (ai-society)/layout.tsx 와 같은 골격을 쓴다.
 */
export default function DisputesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col md:flex-row md:gap-4">
      <AISocietySidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
