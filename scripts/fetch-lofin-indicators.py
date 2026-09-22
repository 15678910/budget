# 지방재정365 통합공시 결산기준 지표 12종 자치단체별 원자료 수집.
# 출처: https://www.lofin365.go.kr/portal/LF2220000.do (자치단체 탭, byatcClsTy=LCTSSTL21)
# 대상: 결산기준 지표 12종 (표 하단 CODES 참고), 회계연도 2019~2024, 자치단체 243개.
# 저장: data/regional/local-indicators/<code>_<year>.json (원본 그대로)
#      + all.csv (평탄화, code/name/year/lafNm/lafCd + 지표별 필드)
#      + _source.md
# 로컬 전용 스크립트. data/ 는 gitignore.
import json
import urllib.request
import urllib.error
import csv
import os
import time
import socket

BASE = 'https://www.lofin365.go.kr/lf/lnncGramStst/lnncIpaByatcStlCrtr'
OUT = os.path.join('data', 'regional', 'local-indicators')
os.makedirs(OUT, exist_ok=True)
YEARS = [str(y) for y in range(2019, 2025)]

HEADERS = {
    'User-Agent': 'Mozilla/5.0',
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
    'Referer': 'https://www.lofin365.go.kr/portal/LF2220000.do',
}

# code, name, path(끝 슬래시 없이 BASE 뒤에 붙임), list key, 유지할 필드
CODES = [
    ('A064', '통합재정수지비율', 'ccgbRtStlSvi/retvLstCcgbRtStlGov.do', 'ccgbRtStlGovIxInqRsltDto',
     ('lafCd', 'lafNm', 'waLafNm', 'lafTyCd', 'txrvAmt', 'epAmt', 'nfnlnAmt', 'itgPfinScalAmt', 'ccgbRt')),
    ('A060', '재정자립도(결산)', 'firStlSvi/retvLstFirGov.do', 'firStlIxInqRsltDto',
     ('lafCd', 'lafNm', 'selfRvAmt', 'txrvStlAmt', 'firRt')),
    ('A001', '행사축제경비비율', 'eventFstvExpsRtSvi/retvLstEventFstvExpsRtGov.do', 'eventFstvExpsRtIxInqRsltDto',
     ('lafNm', 'expsAmt', 'aneStlAmt', 'expsRt', 'smkdAvgRt')),
    ('A002', '지방보조금비율', 'lsaRtSvi/retvLstLsaRtGov.do', 'lsaRtIxInqRsltDto',
     ('lafNm', 'grsbAmt', 'aneStlAmt', 'amtRt', 'smkdAvgRt')),
    ('A003', '업무추진비비율', 'boeRtSvi/retvLstBoeRtGov.do', 'boeRtIxInqRsltDto',
     ('lafCd', 'lafNm', 'boe', 'aneStlAmt', 'boeRt', 'smkdAvgRt')),
    ('A013', '연말지출비율', 'yndEpEpnSvi/retvLstYndEpEpnGov.do', 'yndEpEpnIxInqRsltDto',
     ('lafCd', 'lafNm', 'ecaAmt', 'aneStlAmt', 'yndEpRt', 'smkdAvgRt')),
    ('A026', '수의계약비율', 'pvcnRtSvi/retvLstPvcnRtGov.do', 'pvcnRtIxInqRsltDto',
     ('lafNm', 'pvcnOutAmt', 'ctrtOutTottAmt', 'pvcnRt', 'smkdAvgRt')),
    ('A030', '보증채무비율', 'gurDbtRtSvi/retvLstGurDbtRtGov.do', 'gurDbtRtIxInqRsltDto',
     ('lafCd', 'lafNm', 'gurDbtAmt', 'aneStlAmt', 'gurDbtRt', 'smkdAvgRt')),
    ('A032', '민자사업재정부담액', 'pvcpBizPfinBdnAmtSvi/retvLstPvcpBizPfinBdnAmtGov.do', 'pvcpBizPfinBdnAmtIxInqRsltDto',
     ('lafCd', 'lafNm', 'pvcpAmt', 'btlOpct', 'btoSprf', 'smkdAvgAmt')),
    ('A023', '기금현재액', 'fndPsntAmtSvi/retvLstFndPsntAmtGov.do', 'fndPsntAmtGovIxInqRsltDto',
     ('lafCd', 'lafNm', 'waLafNm', 'pryrPsntAmt', 'variAmt', 'fndCompAmt', 'thyUseAmt', 'thyPsntAmt')),
    ('A005', '지방의회경비비율', 'lclAsmbExpsRtSvi/retvLstLclAsmbExpsRtGov.do', 'lclAsmbExpsRtIxInqRsltDto',
     ('lafCd', 'lafNm', 'lclAsmbExps', 'aneStlAmt', 'lclAsmbExpsRt', 'smkdAvgRt')),
    ('A046', '신속집행실적', 'qkexOutSvi/retvLstQkexOutGov.do', 'qkexOutIxInqRsltDto',
     ('lafNm', 'qkexTrgtAmt', 'qkexGlsAmt', 'exeAmt', 'trgtAmtCprnExeRt', 'glsAmtRt')),
]


def fetch(code: str, path: str, year: str):
    url = f'{BASE}/{path}'
    body = json.dumps({'fyr': year, 'pfaIndcCd': code, 'byatcClsTy': 'LCTSSTL21', 'rgnzDvCd': '02'}).encode()
    req = urllib.request.Request(url, data=body, headers=HEADERS)
    last_err = None
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode('utf-8'))
        except (urllib.error.URLError, socket.timeout, TimeoutError, ConnectionError) as e:
            last_err = e
            if attempt == 0:
                time.sleep(2)
                continue
    raise last_err


rows_all = []
anomalies = []
report = {}  # code -> {year: count}

for code, name, path, list_key, fields in CODES:
    report[code] = {}
    for year in YEARS:
        try:
            j = fetch(code, path, year)
        except Exception as e:
            print(code, year, 'ERROR', repr(e))
            anomalies.append(f'{code} {year}: 요청 실패 - {e!r}')
            report[code][year] = 'ERR'
            time.sleep(0.8)
            continue

        rows = j.get(list_key, [])
        if not isinstance(rows, list):
            rows = []

        with open(os.path.join(OUT, f'{code}_{year}.json'), 'w', encoding='utf-8') as f:
            json.dump(j, f, ensure_ascii=False)

        report[code][year] = len(rows)
        if len(rows) == 0:
            anomalies.append(f'{code} {year}: 0건 (응답 키 {list_key} 없음 또는 빈 배열)')
        elif len(rows) != 243:
            anomalies.append(f'{code} {year}: {len(rows)}건 (243건 예상)')

        for r in rows:
            row = {'code': code, 'name': name, 'year': year}
            for fld in fields:
                row[fld] = r.get(fld, '')
            rows_all.append(row)

        first_nm = rows[0].get('lafNm') if rows else None
        last_nm = rows[-1].get('lafNm') if rows else None
        print(code, year, len(rows), 'rows; 첫', first_nm, '끝', last_nm)
        time.sleep(0.8)

# CSV 컬럼: code,name,year,lafNm,lafCd + 나머지 필드(전 코드 통틀어 등장 순서로 중복 제거)
extra_fields = []
seen = {'lafCd', 'lafNm'}
for _, _, _, _, fields in CODES:
    for fld in fields:
        if fld not in seen:
            seen.add(fld)
            extra_fields.append(fld)

fieldnames = ['code', 'name', 'year', 'lafNm', 'lafCd'] + extra_fields

with open(os.path.join(OUT, 'all.csv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    for row in rows_all:
        out_row = {k: row.get(k, '') for k in fieldnames}
        w.writerow(out_row)

with open(os.path.join(OUT, '_source.md'), 'w', encoding='utf-8') as f:
    f.write('# 출처\n')
    f.write('지방재정365 지방재정통합공시 > 항목별 현황 > 결산기준, 자치단체 탭 '
            '(https://www.lofin365.go.kr/portal/LF2220000.do, byatcClsTy=LCTSSTL21).\n\n')
    f.write('## 수집 지표 (지표코드)\n')
    for code, name, path, list_key, fields in CODES:
        f.write(f'- {code} {name}: `{BASE}/{path}` (응답 키 `{list_key}`)\n')
    f.write(f'\n수집일 {time.strftime("%Y-%m-%d")}. 회계연도 {YEARS[0]}~{YEARS[-1]} (fyr). 자치단체 rgnzDvCd=02.\n')
    f.write('단위: 금액은 원, 비율은 %. smkdAvgRt/smkdAvgAmt는 시군구 평균값.\n')
    f.write('담당부서 재정정책과. 이용조건: 출처표시(공공누리 제1유형).\n')

print()
print('=== 요약 ===')
for code, name, *_ in CODES:
    print(code, name, report[code])
print('total csv rows', len(rows_all))
if anomalies:
    print()
    print('=== 이상 항목 ===')
    for a in anomalies:
        print('-', a)
