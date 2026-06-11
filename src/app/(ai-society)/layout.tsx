import { AISocietySidebar } from '@/components/layout/AISocietySidebar';

export default function AISocietyLayout({
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
