import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '점검 중 | 마을살림/나라살림',
  description: '현재 사이트는 개편 작업 중입니다. 곧 다시 만나요.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MaintenancePage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="text-7xl">🛠️</div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-100 tracking-tight">
          사이트 개편 작업 중입니다
        </h1>

        <p className="text-base md:text-lg text-gray-400 leading-relaxed">
          더 정확한 데이터와 더 나은 분석 기능을 준비하기 위해
          <br />
          잠시 외부 접근을 제한하고 있습니다.
        </p>

        <div className="border border-gray-800 bg-gray-900/40 rounded-lg p-5 text-left space-y-3">
          <div className="text-sm text-gray-400 leading-relaxed">
            <p className="font-semibold text-gray-200 mb-1">
              📅 점검 안내
            </p>
            <p>
              현재 다음 영역을 개편 중입니다:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-gray-500">
              <li>2026년 정부·지자체 예산 데이터 갱신</li>
              <li>교육청 BTL 채무 실측 데이터 반영</li>
              <li>지역별 맞춤 정책 추천 엔진 보강</li>
              <li>AI 공약 검증 정확도 개선</li>
            </ul>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          작업이 마무리되는 대로 다시 공개하겠습니다.
          <br />
          문의: <a href="mailto:lacoiffure828@gmail.com" className="text-blue-400 hover:text-blue-300 underline">lacoiffure828@gmail.com</a>
        </p>

        <p className="text-xs text-gray-600 pt-4 border-t border-gray-800/50">
          마을살림/나라살림 · budget.ai.kr
        </p>
      </div>
    </div>
  );
}
