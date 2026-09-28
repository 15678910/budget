import { SDGSubNav } from '@/components/sdg/SDGSubNav';

// SDG 5개 페이지(상황판/VLR/온톨로지/연계성/실효성) 공통 레이아웃.
// 상단 메뉴를 페이지가 바뀌어도 같은 자리에 고정해 위치 이동으로 인한 혼란을 막는다.
// top-12 md:top-14는 Header(h-12 md:h-14, sticky top-0)의 실제 높이와 맞춘 값이다.
export default function SDGLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <div className="sticky top-12 z-30 border-b border-gray-800 bg-gray-950/95 backdrop-blur md:top-14">
        <SDGSubNav />
      </div>
      {children}
    </div>
  );
}
