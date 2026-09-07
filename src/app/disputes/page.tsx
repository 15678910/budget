import type { Metadata } from 'next';
import { ALL_DISPUTES } from '@/lib/disputes';
import { DisputeCard } from '@/components/disputes/DisputeCard';

export const metadata: Metadata = {
  title: '예산분쟁 | 마을살림/나라살림',
  description: '매년 반복되는 예산 갈등의 쟁점·진행·근거를 정리합니다.',
};

export default function DisputesPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">예산분쟁</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
        예산은 금액이기 전에 선택입니다. 무엇을 두고 다투고 있는지, 지금 어느 단계인지,
        각 주장의 근거가 무엇인지 정리합니다.
      </p>
      <div className="mt-8 flex flex-col gap-4">
        {ALL_DISPUTES.map((d) => (
          <DisputeCard key={d.slug} dispute={d} />
        ))}
      </div>
    </main>
  );
}
