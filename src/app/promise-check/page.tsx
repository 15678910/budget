import { PromiseSimulator } from '@/components/simulator/PromiseSimulator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '공약 검증 시뮬레이터 | 마을살림/나라살림',
  description: '선거 공약의 재정 타당성 검증 시뮬레이션',
};

export default function PromiseCheckPage() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <PromiseSimulator />
    </div>
  );
}
