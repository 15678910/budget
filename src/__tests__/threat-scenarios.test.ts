/**
 * Threat scenario regression tests — budget (교육예산 분석 시스템).
 *
 * 각 위협이 실제 코드 변경으로 재발하지 않도록 회귀 차단.
 * 새 위협 발견 → 이 파일에 시나리오 추가 → fail → fix → pass.
 *
 * CLAUDE.md PART 10 정책에 따른 자산.
 *
 * 카테고리:
 * - A: 인증·세션 (퍼블릭 사이트, 인증 불필요 — 해당 위협 최소)
 * - B: 권한·scope (관리자 기능 접근 제어)
 * - C: secret·credential (공공데이터 API key, env 누출)
 * - D: input·injection (파라미터 조작, CSV 파싱 오류)
 * - E: data integrity (예산 데이터 무결성, 집계 오류)
 * - F: rate/abuse (DoS, 대용량 CSV 파싱 abuse)
 * - G: domain-specific (예산 데이터 왜곡, 통계 오류)
 *
 * 실행: npx jest src/__tests__/threat-scenarios.test.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../..');
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'backups', 'data',
]);

function walkSourceFiles(dir: string, exts: string[] = ['.ts', '.tsx', '.js', '.jsx']): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const f of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(f)) continue;
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) results.push(...walkSourceFiles(p, exts));
    else if (exts.some(ext => f.endsWith(ext))) results.push(p);
  }
  return results;
}

// ============================================================
// A. 인증·세션 (Authentication & Session)
// ============================================================

describe('Threat Scenarios — A: Authentication', () => {
  it.skip('a1: if admin route exists, it requires authentication', () => {
    // TODO: /admin 또는 관리자 기능이 있다면 인증 없이 접근 불가 확인
    // 현재 퍼블릭 사이트라면 이 테스트는 N/A
  });
});

// ============================================================
// B. 권한·Scope (Authorization & Scope)
// ============================================================

describe('Threat Scenarios — B: Authorization', () => {
  it.skip('b1: data mutation endpoints require authorization', () => {
    // TODO: 데이터 수정 API가 있다면 인가 확인
  });
});

// ============================================================
// C. Secret·Credential
// ============================================================

describe('Threat Scenarios — C: Secrets', () => {
  it('c1: no hardcoded API keys in source (32-char hex)', () => {
    const hex32 = /[0-9a-f]{32}/gi;
    const found: Array<[string, string]> = [];

    for (const filePath of walkSourceFiles(REPO_ROOT)) {
      let content: string;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }
      for (const m of content.matchAll(hex32)) {
        const idx = m.index!;
        const ctx = content.slice(Math.max(0, idx - 50), idx + 82).toLowerCase();
        if (['todo', 'example', 'placeholder', 'your-', 'test', 'dummy',
          'fake', 'sha256', 'hash', 'md5'].some(x => ctx.includes(x))) continue;
        found.push([filePath.replace(REPO_ROOT, ''), m[0].slice(0, 8) + '...']);
      }
    }
    expect(found).toEqual([]);
  });

  it.skip('c2: required env vars documented in .env.example or README', () => {
    // TODO: NEIS API key 등 외부 API key가 환경변수로만 사용되는지 확인
  });
});

// ============================================================
// D. Input·Injection
// ============================================================

describe('Threat Scenarios — D: Injection', () => {
  it.skip('d1: CSV parsing does not execute embedded formulas', () => {
    // TODO: CSV import 시 =cmd(), @SUM 등 수식 인젝션(CSV injection) 방지
    // PapaCSV 파싱 후 셀 값이 = 또는 + 로 시작하면 escape 처리
  });

  it.skip('d2: large CSV file upload size limited', () => {
    // TODO: CSV 파일 크기 제한 (예: 50MB 초과 시 거부)
  });
});

// ============================================================
// E. Data Integrity
// ============================================================

describe('Threat Scenarios — E: Data Integrity', () => {
  it.skip('e1: budget total equals sum of line items', () => {
    // TODO: 예산 총액이 항목 합계와 일치하는지 검증 (집계 오류 방지)
    // NABO 표준단가 범위 내인지도 확인
  });

  it.skip('e2: year-over-year budget change within plausible range', () => {
    // TODO: 전년 대비 예산 변화율이 비정상적으로 크지 않은지 확인 (데이터 오류 탐지)
    // 예: 1000% 이상 증가는 데이터 오류로 플래그
  });
});

// ============================================================
// F. Rate / Abuse
// ============================================================

describe('Threat Scenarios — F: Rate/Abuse', () => {
  it.skip('f1: public API endpoints have rate limiting', () => {
    // TODO: 데이터 API 엔드포인트가 rate limit 적용되는지 확인
  });
});

// ============================================================
// G. Domain-Specific — 교육예산 분석
// ============================================================

describe('Threat Scenarios — G: Domain (Budget Analysis)', () => {
  /**
   * 핵심 위협:
   * - 예산 데이터 왜곡 (의도적 집계 오류)
   * - 공공데이터 API key 노출 → 무단 쿼리
   * - CSV injection으로 스프레드시트 수식 실행
   * - 개인정보 포함 예산 데이터 노출 (수혜자 정보 등)
   */

  it.skip('g1: education budget figures match official NEIS source', () => {
    // TODO: 핵심 예산 수치가 NEIS 공공데이터와 일치하는지 샘플 검증
  });

  it.skip('g2: per-student budget calculation uses correct enrollment', () => {
    // TODO: 학생 1인당 예산 계산 시 최신 재학생 수 사용
  });

  it.skip('g3: no personally identifiable information in exported data', () => {
    // TODO: 예산 데이터 export 시 개인식별정보 포함되지 않음
  });
});
