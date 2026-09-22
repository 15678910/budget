'use client';

/**
 * 조기경보 화면 하단 고정 각주.
 * 출처·조문·"기준 충족은 지정이 아니다"·"백분위는 순위이지 평가가 아니다"를 화면마다 같은 문장으로 적는다.
 */
import { INDICATOR_META, INDICATOR_SOURCE } from '@/lib/data/local-indicators-official';
import { OFFICIAL_DEBT_SOURCE } from '@/lib/data/local-debt-official';
import { AVAILABLE_LEGAL_INDICATORS, LEGAL_INDICATORS, LEGAL_THRESHOLDS } from '@/lib/watch/legal-thresholds';
import { LEGAL_INDICATOR_LABEL } from '@/lib/watch/signal-types';
import { FOOTNOTE_DESIGNATION, FOOTNOTE_PEER_AVG, FOOTNOTE_PERCENTILE } from './warning-labels';

/** 신호·백분위에 실제로 쓰는 지표 6종 */
const USED_INDICATOR_KEYS = new Set<string>([
  'fiscalBalance',
  'festival',
  'subsidy',
  'entertainment',
  'yearEnd',
  'privateContract',
]);

const USED_CODES = INDICATOR_META.filter((meta) => USED_INDICATOR_KEYS.has(meta.key))
  .map((meta) => `${meta.code} ${meta.name}`)
  .join(' · ');

const UNAVAILABLE = LEGAL_INDICATORS.filter(
  (indicator) => !(AVAILABLE_LEGAL_INDICATORS as readonly string[]).includes(indicator),
)
  .map((indicator) => LEGAL_INDICATOR_LABEL[indicator])
  .join(' · ');

export function WarningFootnotes() {
  return (
    <div className="space-y-2 border border-gray-800 p-4 text-sm leading-relaxed text-gray-500">
      <p>
        출처 · {INDICATOR_SOURCE.title} (수집일 {INDICATOR_SOURCE.fetchedAt}) —{' '}
        <a
          href={INDICATOR_SOURCE.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 underline-offset-2 hover:underline"
        >
          지방재정365
        </a>
        . 지표 코드 {USED_CODES}.
      </p>
      <p>
        출처 · {OFFICIAL_DEBT_SOURCE.title} (수집일 {OFFICIAL_DEBT_SOURCE.fetchedAt}).{' '}
        {OFFICIAL_DEBT_SOURCE.note}
      </p>
      <div>
        <p className="text-gray-400">
          지방재정법 시행령 제65조의3 (개정 2025. 12. 2., 국가법령정보센터 2026-09-23 확인)
        </p>
        <ul className="mt-1 space-y-0.5">
          {LEGAL_INDICATORS.map((indicator) => (
            <li key={indicator}>
              {LEGAL_THRESHOLDS[indicator].label} — {LEGAL_THRESHOLDS[indicator].article}
            </li>
          ))}
        </ul>
      </div>
      <p>{UNAVAILABLE}은 자치단체별 공개 자료가 없어 계산하지 않고 「자료 없음」으로 둔다.</p>
      <p className="text-gray-400">{FOOTNOTE_DESIGNATION}</p>
      <p>{FOOTNOTE_PERCENTILE}</p>
      <p>{FOOTNOTE_PEER_AVG}</p>
    </div>
  );
}
