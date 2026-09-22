# 지방재정365 통합공시 「예산대비채무비율」(결산기준) 자치단체별 원자료 수집.
# 출처: https://www.lofin365.go.kr/portal/LF2220000.do?byatcClsTy=LCTSSTL21&pfaIndcCd=A015 (자치단체 탭)
# 값: 채무잔액(dbtRestAmt, 원), 최종예산액(lastBdgAmt, 원), 예산대비채무비율(dbtRt, %).
#     대상회계 통합회계(일반+공기업특별+기타특별+기금). 산정공식 (채무잔액÷최종예산액)×100.
# 저장: data/regional/local-debt/debt_<year>.json (원본 그대로) + all.csv (평탄화)
# 로컬 전용 스크립트. data/ 는 gitignore.
import json, urllib.request, csv, os, time, sys

EP = 'https://www.lofin365.go.kr/lf/lnncGramStst/lnncIpaByatcStlCrtr/bdgCprnDbtRtSvi/retvLstBdgCprnDbtRtGov.do'
OUT = os.path.join('data', 'regional', 'local-debt')
os.makedirs(OUT, exist_ok=True)
YEARS = range(2009, 2025)


def fetch(year: int):
    body = json.dumps({'fyr': str(year), 'pfaIndcCd': 'A015', 'byatcClsTy': 'LCTSSTL21', 'rgnzDvCd': '02'}).encode()
    req = urllib.request.Request(EP, data=body, headers={
        'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json',
        'Referer': 'https://www.lofin365.go.kr/portal/LF2220000.do'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


rows_all = []
for y in YEARS:
    j = fetch(y)
    rows = j.get('bdgCprnDbtRtIxInqRsltDto', [])
    with open(os.path.join(OUT, f'debt_{y}.json'), 'w', encoding='utf-8') as f:
        json.dump(j, f, ensure_ascii=False)
    for r in rows:
        rows_all.append({'year': y, 'name': r['lafNm'], 'debt_won': r['dbtRestAmt'], 'budget_won': r['lastBdgAmt'], 'ratio_pct': r['dbtRt']})
    print(y, len(rows), 'rows; 첫', rows[0]['lafNm'], '끝', rows[-1]['lafNm'] if rows else None)
    time.sleep(0.8)

with open(os.path.join(OUT, 'all.csv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=['year', 'name', 'debt_won', 'budget_won', 'ratio_pct'])
    w.writeheader(); w.writerows(rows_all)

with open(os.path.join(OUT, '_source.md'), 'w', encoding='utf-8') as f:
    f.write('# 출처\n지방재정365 지방재정통합공시 > 항목별 현황 > 결산기준 > 부채/채무/채권 > 예산대비채무비율 (지표코드 A015), 자치단체 탭.\n'
            f'수집일 {time.strftime("%Y-%m-%d")}. 엔드포인트 {EP}\n'
            '단위 원. 채무잔액=통합회계(일반회계+공기업특별회계+기타특별회계+기금). 산정공식 (채무잔액÷최종예산액)×100.\n'
            '담당부서 재정정책과(044-205-3717). 이용조건: 출처표시(공공누리).\n')
print('total rows', len(rows_all), '->', OUT)
