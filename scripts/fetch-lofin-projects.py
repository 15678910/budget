# 지방재정365 OpenAPI 「세부사업별 세출」(QWGJK) 원자료 수집.
# 출처: https://www.lofin365.go.kr/lf/hub/QWGJK (지방재정 Open API 허브)
# 대상: 회계연도 2023~2026, 기준일(exe_ymd)은 2023/2024/2025는 연말(12.31),
#       2026은 실행 시점 기준 최신 기준일(오늘부터 하루씩 거꾸로 존재 확인, 최대 30일).
# 저장: data/regional/lofin-projects/<year>.csv.gz (원본 필드 그대로) + _source.md
# 인증키: .env.local의 LOFIN_API_KEY. 키 값은 절대 출력·로그·커밋하지 않는다.
# 로컬 전용 스크립트. data/ 는 gitignore.
#
# Usage:
#   PYTHONIOENCODING=utf-8 python scripts/fetch-lofin-projects.py [--force]
#
# 이어받기: 이미 <year>.csv.gz 파일이 있는 연도는 건너뛴다 (--force 지정 시 재수집).

from __future__ import annotations

import csv
import gzip
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta

BASE = 'https://www.lofin365.go.kr/lf/hub/QWGJK'
OUT_DIR = os.path.join('data', 'regional', 'lofin-projects')
ENV_PATH = '.env.local'
PAGE_SIZE = 1000
PROBE_LAF_CD = '1117000'  # 중랑구 (2026 기준일 존재 확인용)
MAX_RETRIES = 3
RETRY_BACKOFF = (2, 4, 8)  # seconds
PAGE_SLEEP = 0.3
PROGRESS_EVERY = 25

# 원자료 필드 -> 한글 의미 (plan 배경 참고)
FIELD_MEANINGS = [
    ('fyr', '회계연도'),
    ('wa_laf_cd', '상위(광역) 자치단체코드'),
    ('wa_laf_hg_nm', '상위(광역) 자치단체명'),
    ('laf_cd', '자치단체코드'),
    ('laf_hg_nm', '자치단체명'),
    ('acnt_dv_cd', '회계구분코드'),
    ('acnt_dv_nm', '회계구분명(일반회계/특별회계/기금 등)'),
    ('dept_cd', '부서코드'),
    ('dbiz_cd', '세부사업코드'),
    ('dbiz_nm', '세부사업명'),
    ('exe_ymd', '기준일(YYYYMMDD)'),
    ('bdg_cash_amt', '예산현액(원) — 최종 예산'),
    ('bdg_ntep', '국비'),
    ('capep', '시도비'),
    ('sggep', '시군구비'),
    ('etc_amt', '기타(자체 등)'),
    ('ep_amt', '지출액(원) — 집행액'),
    ('cpl_amt', '보조율 등 부대 금액'),
    ('fld_cd', '분야코드'),
    ('fld_nm', '분야명'),
    ('ane_part_cd', '부문코드'),
    ('part_nm', '부문명'),
    ('padm_laf_cd', '소관 자치단체코드'),
    ('lup_ord', '표시순서'),
    ('zon_cd', '권역코드'),
]


def redact(url: str) -> str:
    """URL에서 Key 파라미터 값을 지운다."""
    return re.sub(r'([?&][Kk]ey=)[^&]*', r'\1<redacted>', url)


def load_api_key() -> str:
    if not os.path.exists(ENV_PATH):
        print(f'ERROR: {ENV_PATH} 없음', file=sys.stderr)
        sys.exit(1)
    with open(ENV_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, _, v = line.partition('=')
            k = k.strip()
            if k == 'LOFIN_API_KEY':
                v = v.strip()
                if len(v) >= 2 and v[0] == v[-1] and v[0] in ('"', "'"):
                    v = v[1:-1]
                if not v:
                    print('ERROR: LOFIN_API_KEY 값이 비어있음', file=sys.stderr)
                    sys.exit(1)
                return v
    print('ERROR: .env.local에 LOFIN_API_KEY 없음', file=sys.stderr)
    sys.exit(1)


API_KEY = load_api_key()


def request_json(params: dict) -> dict:
    """지수 백오프로 최대 MAX_RETRIES회 재시도하며 JSON 응답을 반환한다."""
    q = dict(params)
    q['Key'] = API_KEY
    url = f'{BASE}?{urllib.parse.urlencode(q)}'
    last_err = None
    for attempt in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=60) as r:
                raw = r.read().decode('utf-8')
            return json.loads(raw)
        except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError, OSError) as e:
            last_err = e
            if attempt < MAX_RETRIES - 1:
                wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)]
                print(f'  요청 실패 ({e!r}), {wait}초 후 재시도... ({redact(url)})')
                time.sleep(wait)
            continue
    raise RuntimeError(f'요청 반복 실패: {redact(url)}') from last_err


def parse_response(j: dict) -> tuple[int | None, list[dict], str | None]:
    """(list_total_count 또는 None, rows, error_message 또는 None) 반환."""
    qwgjk = j.get('QWGJK')
    if qwgjk is None:
        # 오류 응답: {"RESULT": [{"CODE": "...", "MESSAGE": "..."}]}
        result = j.get('RESULT')
        if isinstance(result, list) and result:
            code = result[0].get('CODE')
            msg = result[0].get('MESSAGE')
            return None, [], f'{code}: {msg}'
        return None, [], f'알 수 없는 응답 형식: {list(j.keys())}'

    total = None
    rows: list[dict] = []
    for block in qwgjk:
        if 'head' in block:
            for h in block['head']:
                if 'list_total_count' in h:
                    total = h['list_total_count']
                if 'RESULT' in h:
                    res = h['RESULT']
                    code = res.get('CODE')
                    if code and code != 'INFO-000':
                        return total, rows, f'{code}: {res.get("MESSAGE")}'
        if 'row' in block:
            rows = block['row']
    return total, rows, None


def probe_latest_2026_date() -> str:
    """오늘부터 하루씩 거꾸로 laf_cd=1117000, pSize=1 로 존재 확인. 최대 30일."""
    today = date.today()
    for delta in range(0, 30):
        d = today - timedelta(days=delta)
        ymd = d.strftime('%Y%m%d')
        j = request_json({
            'Type': 'json',
            'pIndex': 1,
            'pSize': 1,
            'fyr': '2026',
            'exe_ymd': ymd,
            'laf_cd': PROBE_LAF_CD,
        })
        total, rows, err = parse_response(j)
        if err and not (isinstance(err, str) and err.startswith('INFO-200')):
            # 다른 오류는 존재 확인 실패로 간주하고 다음 날짜로 계속
            print(f'  probe {ymd}: {err}')
            time.sleep(0.3)
            continue
        if total and total > 0:
            print(f'  probe {ymd}: list_total_count={total} -> 확정')
            return ymd
        print(f'  probe {ymd}: 0건, 이전 날짜로 재시도')
        time.sleep(0.3)
    raise RuntimeError('2026년 최신 기준일을 30일 이내에 찾지 못함')


def fetch_year(year: str, exe_ymd: str, force: bool) -> dict:
    out_path = os.path.join(OUT_DIR, f'{year}.csv.gz')
    if os.path.exists(out_path) and not force:
        print(f'[{year}] {out_path} 이미 존재 — 건너뜀 (--force로 재수집)')
        return {'year': year, 'exe_ymd': exe_ymd, 'skipped': True}

    print(f'[{year}] exe_ymd={exe_ymd} 수집 시작')
    t0 = time.time()

    # 1페이지: 총건수 확인
    j = request_json({'Type': 'json', 'pIndex': 1, 'pSize': PAGE_SIZE, 'fyr': year, 'exe_ymd': exe_ymd})
    total, rows, err = parse_response(j)
    if err:
        raise RuntimeError(f'[{year}] 1페이지 오류: {err}')
    if total is None or total == 0:
        raise RuntimeError(f'[{year}] list_total_count 없음/0 — 데이터 없음')

    pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
    print(f'[{year}] list_total_count={total}, pages={pages}')

    all_rows: list[dict] = list(rows)
    fieldnames: list[str] = []
    seen_fields = set()
    for r in rows:
        for k in r.keys():
            if k not in seen_fields:
                seen_fields.add(k)
                fieldnames.append(k)

    for page in range(2, pages + 1):
        time.sleep(PAGE_SLEEP)
        j = request_json({'Type': 'json', 'pIndex': page, 'pSize': PAGE_SIZE, 'fyr': year, 'exe_ymd': exe_ymd})
        _, prows, perr = parse_response(j)
        if perr and not perr.startswith('INFO-200'):
            raise RuntimeError(f'[{year}] {page}페이지 오류: {perr}')
        for r in prows:
            for k in r.keys():
                if k not in seen_fields:
                    seen_fields.add(k)
                    fieldnames.append(k)
        all_rows.extend(prows)
        if page % PROGRESS_EVERY == 0 or page == pages:
            print(f'{year} {page}/{pages} {len(all_rows)}건')

    os.makedirs(OUT_DIR, exist_ok=True)
    with gzip.open(out_path, 'wt', encoding='utf-8', newline='') as gz:
        w = csv.DictWriter(gz, fieldnames=fieldnames)
        w.writeheader()
        for r in all_rows:
            w.writerow({k: r.get(k, '') for k in fieldnames})

    elapsed = time.time() - t0
    mismatch = len(all_rows) != total
    if mismatch:
        print(f'경고: [{year}] 수집 행 수({len(all_rows)}) != list_total_count({total})')

    print(f'[{year}] 완료: {len(all_rows)}건, {elapsed:.1f}초, {os.path.getsize(out_path)}바이트 -> {out_path}')
    return {
        'year': year,
        'exe_ymd': exe_ymd,
        'total': total,
        'rows': len(all_rows),
        'mismatch': mismatch,
        'elapsed': elapsed,
        'size_bytes': os.path.getsize(out_path),
        'fields': fieldnames,
        'skipped': False,
    }


def write_source_md(results: list[dict]) -> None:
    lines = []
    lines.append('# 출처\n')
    lines.append(
        f'지방재정365 지방재정 Open API 허브 — 세부사업별 세출(QWGJK)\n'
        f'`{BASE}`\n\n'
    )
    lines.append('## 연도별 수집 결과\n')
    lines.append('| 연도 | 기준일(exe_ymd) | 행 수 | 수집일 |\n')
    lines.append('|---|---|---|---|\n')
    today_str = time.strftime('%Y-%m-%d')
    for r in results:
        if r.get('skipped'):
            lines.append(f'| {r["year"]} | {r["exe_ymd"]} | (기존 파일 유지, 재수집 안 함) | - |\n')
        else:
            lines.append(f'| {r["year"]} | {r["exe_ymd"]} | {r["rows"]} | {today_str} |\n')
    lines.append('\n## 필드 설명\n\n')
    lines.append('| 필드 | 의미 |\n|---|---|\n')
    for fld, meaning in FIELD_MEANINGS:
        lines.append(f'| {fld} | {meaning} |\n')
    lines.append(
        '\n단위: 금액(bdg_cash_amt, bdg_ntep, capep, sggep, etc_amt, ep_amt, cpl_amt)은 원.\n'
        '이용조건: 공공누리 출처표시.\n'
    )
    with open(os.path.join(OUT_DIR, '_source.md'), 'w', encoding='utf-8') as f:
        f.writelines(lines)


def main() -> None:
    force = '--force' in sys.argv
    os.makedirs(OUT_DIR, exist_ok=True)

    print('2026년 최신 기준일 확인 중...')
    latest_2026_path = os.path.join(OUT_DIR, '2026.csv.gz')
    if os.path.exists(latest_2026_path) and not force:
        # 이미 수집된 2026 파일이 있으면 probe 생략 (정확한 exe_ymd는 _source.md 참고 불가하므로 재확인 필요 시 --force)
        print('  2026.csv.gz 이미 존재 — probe 생략, 건너뜀 대상으로 처리')
        exe_2026 = 'UNKNOWN(기존 파일 유지)'
    else:
        exe_2026 = probe_latest_2026_date()

    plan = [
        ('2023', '20231231'),
        ('2024', '20241231'),
        ('2025', '20251231'),
        ('2026', exe_2026),
    ]

    results = []
    for year, exe_ymd in plan:
        r = fetch_year(year, exe_ymd, force)
        results.append(r)

    write_source_md(results)

    print()
    print('=== 요약 ===')
    for r in results:
        if r.get('skipped'):
            print(f'{r["year"]}: 건너뜀 (기존 파일 유지)')
        else:
            status = '경고: 행수 불일치' if r['mismatch'] else 'OK'
            print(f'{r["year"]} exe_ymd={r["exe_ymd"]} rows={r["rows"]} size={r["size_bytes"]}B elapsed={r["elapsed"]:.1f}s [{status}]')


if __name__ == '__main__':
    main()
