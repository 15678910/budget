import { resolveSessionId, SESSION_IDLE_MS } from '../session';

class FakeStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const T0 = 1_700_000_000_000;

describe('resolveSessionId', () => {
  it('저장된 세션이 없으면 새 ID를 만들고 저장한다', () => {
    const storage = new FakeStorage();
    const id = resolveSessionId(storage, T0, () => 'uuid-1');
    expect(id).toBe('uuid-1');
    expect(storage.getItem('_ns_sid')).toContain('uuid-1');
  });

  it('유휴 시간 안이면 같은 ID를 돌려준다 (탭이 달라도 storage를 공유하면 동일)', () => {
    const storage = new FakeStorage();
    resolveSessionId(storage, T0, () => 'uuid-1');
    const again = resolveSessionId(storage, T0 + SESSION_IDLE_MS - 1, () => 'uuid-2');
    expect(again).toBe('uuid-1');
  });

  it('유휴 시간을 넘기면 새 ID를 만든다', () => {
    const storage = new FakeStorage();
    resolveSessionId(storage, T0, () => 'uuid-1');
    const fresh = resolveSessionId(storage, T0 + SESSION_IDLE_MS + 1, () => 'uuid-2');
    expect(fresh).toBe('uuid-2');
  });

  it('활동할 때마다 마지막 활동 시각이 갱신된다', () => {
    const storage = new FakeStorage();
    resolveSessionId(storage, T0, () => 'uuid-1');
    resolveSessionId(storage, T0 + SESSION_IDLE_MS - 1, () => 'uuid-2');
    // 첫 활동 기준으로는 만료됐지만, 두 번째 활동 기준으로는 아직 유효
    const kept = resolveSessionId(storage, T0 + SESSION_IDLE_MS + 1, () => 'uuid-3');
    expect(kept).toBe('uuid-1');
  });

  it('저장값이 깨져 있으면 새 ID를 만든다', () => {
    const storage = new FakeStorage();
    storage.setItem('_ns_sid', '{not json');
    const id = resolveSessionId(storage, T0, () => 'uuid-1');
    expect(id).toBe('uuid-1');
  });

  it('구버전 값(순수 UUID 문자열)도 새 형식으로 이어받는다', () => {
    const storage = new FakeStorage();
    storage.setItem('_ns_sid', '0f8fad5b-d9cb-469f-a165-70867728950e');
    const id = resolveSessionId(storage, T0, () => 'uuid-1');
    expect(id).toBe('0f8fad5b-d9cb-469f-a165-70867728950e');
    expect(storage.getItem('_ns_sid')).toContain('0f8fad5b-d9cb-469f-a165-70867728950e');
  });

  it('세션 ID 길이는 DB 컬럼(36자)을 넘지 않는다', () => {
    const storage = new FakeStorage();
    const id = resolveSessionId(storage, T0, () => crypto.randomUUID());
    expect(id.length).toBeLessThanOrEqual(36);
  });
});
