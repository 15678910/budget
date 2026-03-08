import { LocalFundSimulator } from '@/components/simulator/LocalFundSimulator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '지방 AI기본사회 시뮬레이터 | 나라살림',
  description: '광역시도·시군구별 효율화를 통한 지역 펀드 운용 및 기본소득 시뮬레이션',
};

export default function LocalSimulatorPage() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <LocalFundSimulator />
    </div>
  );
}
