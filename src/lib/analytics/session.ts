// 분석용 세션 ID.
// 이전에는 sessionStorage(탭마다 별개)를 써서 탭을 열 때마다 새 방문자로 집계됐다.
// localStorage(같은 브라우저의 모든 탭이 공유)에 마지막 활동 시각을 함께 저장하고,
// 30분 동안 활동이 없으면 새 세션으로 본다. (GA 등의 일반적인 세션 정의)

export const SESSION_STORAGE_KEY = '_ns_sid';
export const SESSION_IDLE_MS = 30 * 60 * 1000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** localStorage/sessionStorage와 호환되는 최소 인터페이스 (테스트에서 교체 가능) */
export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface StoredSession {
  id: string;
  last: number;
}

function readStored(storage: SessionStorageLike): StoredSession | null {
  const raw = storage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as StoredSession).id === 'string' &&
      typeof (parsed as StoredSession).last === 'number'
    ) {
      return parsed as StoredSession;
    }
    return null;
  } catch {
    // 구버전(순수 UUID 문자열)이면 그대로 이어받는다
    return UUID_RE.test(raw) ? { id: raw, last: 0 } : null;
  }
}

/**
 * 세션 ID를 결정하고 마지막 활동 시각을 갱신한다.
 * @param storage  보통 window.localStorage
 * @param now      현재 시각(ms)
 * @param makeId   새 ID 생성기 (보통 crypto.randomUUID)
 */
export function resolveSessionId(
  storage: SessionStorageLike,
  now: number,
  makeId: () => string,
): string {
  const stored = readStored(storage);
  // last가 0인 구버전 값은 유휴 판정 없이 이어받는다
  const alive = stored !== null && (stored.last === 0 || now - stored.last <= SESSION_IDLE_MS);
  const id = alive ? stored.id : makeId();
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ id, last: now } satisfies StoredSession));
  return id;
}
