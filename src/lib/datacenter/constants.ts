/**
 * 계산 계층 공용 상수
 *
 * UI가 아니라 계산에 쓰이는 값이므로 lib에 둔다. 표기 헬퍼(components/datacenter/formatting.ts)가
 * 이 값을 다시 내보내 화면과 계산이 같은 환율을 쓰도록 한다.
 */

/**
 * 원/달러 환율 [추정].
 * 환율 변동은 모델링하지 않는다 — 이 가정은 화면에 명시된다.
 */
export const USD_KRW = 1350;
