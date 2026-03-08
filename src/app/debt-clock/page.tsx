import { DebtClock } from '@/components/debt/DebtClock';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '국채시계 | 나라살림',
  description: '대한민국 국가채무 실시간 카운터',
};

export default function DebtClockPage() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <DebtClock />
    </div>
  );
}
