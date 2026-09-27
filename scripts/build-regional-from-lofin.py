# 지방재정365 「세부사업별 세출」(QWGJK) 원자료 → 지역 예산 flat JSON 집계.
# 입력: data/regional/lofin-projects/<year>.csv.gz (scripts/fetch-lofin-projects.py 결과, 금액 단위 원)
# 출력: data/processed/regional-flat-<year>.json, data/processed/regional-metadata.json
#
# 집계 규칙
#   - 금액: 예산현액(bdg_cash_amt) → amount, 지출액(ep_amt) → executed. 원 단위 합산 후 백만원 반올림.
#   - 제외: 세부사업명(dbiz_nm)에 「내부거래」 또는 「보전지출」이 포함된 행(회계 간 이동).
#   - 광역(시·도) = 본청 행(laf_cd == wa_laf_cd, 또는 자치단체명이 「본청」으로 끝남)만 districtCode '000'.
#     시·군·구는 각자 따로. 본청+시·군·구 합산은 이전재원을 두 번 세므로 화면은 본청만 쓴다.
#   - 분야: fld_nm → 기존 14개 이름(산업ㆍ중소기업및에너지 → 산업중소기업및에너지, 예비비 → 예비비기타,
#     목록 밖 → 기타).
#   - 회계: '일반회계' → 일반회계, 이름에 '기금' 포함 → 기금, 나머지 → 특별회계.
#   - 시도·시군구 이름과 코드는 기존 파일(지도·비교 화면이 이름으로 결합)의 17개 시도 / 시군구 목록
#     (REGIONS)을 그대로 유지한다. 원자료의 행정구역 변경은 MAPPING_NOTES에 적고 메타에 남긴다.
#
# Usage:
#   PYTHONIOENCODING=utf-8 python scripts/build-regional-from-lofin.py
#   npx tsx scripts/build-regional-hierarchy.ts <year>   # 이어서 트리 생성

from __future__ import annotations

import csv
import datetime
import gzip
import json
import os
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(ROOT, 'data', 'regional', 'lofin-projects')
OUT_DIR = os.path.join(ROOT, 'data', 'processed')
YEARS = [2023, 2024, 2025, 2026]

# 기존 파일의 17개 시도와 시군구(코드 = 목록 순번 3자리, '000' = 본청). 지도·비교 화면이 이름으로 결합하므로
# 이름과 코드를 바꾸지 않는다.
REGIONS: list[tuple[str, str, str]] = [
    ('11', '서울특별시', '종로구 중구 용산구 성동구 광진구 동대문구 중랑구 성북구 강북구 도봉구 노원구 은평구 서대문구 마포구 양천구 강서구 구로구 금천구 영등포구 동작구 관악구 서초구 강남구 송파구 강동구'),
    ('21', '부산광역시', '중구 서구 동구 영도구 부산진구 동래구 남구 북구 해운대구 사하구 금정구 강서구 연제구 수영구 사상구 기장군'),
    ('22', '대구광역시', '중구 동구 서구 남구 북구 수성구 달서구 달성군'),
    ('23', '인천광역시', '중구 동구 미추홀구 연수구 남동구 부평구 계양구 서구 강화군 옹진군'),
    ('24', '광주광역시', '동구 서구 남구 북구 광산구'),
    ('25', '대전광역시', '동구 중구 서구 유성구 대덕구'),
    ('26', '울산광역시', '중구 남구 동구 북구 울주군'),
    ('29', '세종특별자치시', ''),
    ('31', '경기도', '수원시 성남시 의정부시 안양시 부천시 광명시 평택시 동두천시 안산시 고양시 과천시 구리시 남양주시 오산시 시흥시 군포시 의왕시 하남시 용인시 파주시 이천시 안성시 김포시 화성시 광주시 양주시 포천시 여주시 연천군 가평군 양평군'),
    ('32', '강원특별자치도', '춘천시 원주시 강릉시 동해시 태백시 속초시 삼척시 홍천군 횡성군 영월군 평창군 정선군 철원군 화천군 양구군 인제군 고성군 양양군'),
    ('33', '충청북도', '청주시 충주시 제천시 보은군 옥천군 영동군 증평군 진천군 괴산군 음성군 단양군'),
    ('34', '충청남도', '천안시 공주시 보령시 아산시 서산시 논산시 계룡시 당진시 금산군 부여군 서천군 청양군 홍성군 예산군 태안군'),
    ('35', '전북특별자치도', '전주시 군산시 익산시 정읍시 남원시 김제시 완주군 진안군 무주군 장수군 임실군 순창군 고창군 부안군'),
    ('36', '전라남도', '목포시 여수시 순천시 나주시 광양시 담양군 곡성군 구례군 고흥군 보성군 화순군 장흥군 강진군 해남군 영암군 무안군 함평군 영광군 장성군 완도군 진도군 신안군'),
    ('37', '경상북도', '포항시 경주시 김천시 안동시 구미시 영주시 영천시 상주시 문경시 경산시 의성군 청송군 영양군 영덕군 청도군 고령군 성주군 칠곡군 예천군 봉화군 울진군 울릉군 군위군'),
    ('38', '경상남도', '창원시 진주시 통영시 사천시 김해시 밀양시 거제시 양산시 의령군 함안군 창녕군 고성군 남해군 하동군 산청군 함양군 거창군 합천군'),
    ('39', '제주특별자치도', '제주시 서귀포시'),
]

# 기존 목록에 없는 신설 자치구: 기존 번호 뒤에 고정 순번을 붙인다(연도와 무관하게 같은 코드).
ADDED_DISTRICTS: dict[str, list[str]] = {
    '23': ['영종구', '제물포구', '서해구', '검단구'],  # 인천 행정체제 개편(2026-07-01)
}

# 원자료 시도와 기존 파일 시도가 다른 시군구 → 기존 파일 시도에 둔다.
RELOCATE: dict[tuple[str, str], str] = {
    ('22', '군위군'): '37',  # 2023-07 대구 편입. 기존 파일·지도는 경상북도 아래.
}

# 자치단체코드(laf_cd) 앞 2자리 → 기존 시도코드. 강원 51·전북 52 신코드도 받는다.
LAF_PREFIX_TO_REGION: dict[str, str] = {
    '11': '11', '26': '21', '27': '22', '28': '23', '29': '24', '30': '25', '31': '26',
    '32': '29', '36': '29', '41': '31', '42': '32', '51': '32', '43': '33', '44': '34',
    '45': '35', '52': '35', '46': '36', '47': '37', '48': '38', '49': '39', '50': '39',
}

# 통합 광역 본청(2026 전남광주통합특별시 등): 세부사업코드 앞 7자리(기관코드)로 구 본청을 가른다.
MERGED_HQ: dict[str, dict[str, object]] = {
    '1300000': {'by_dbiz_prefix': {'6290000': '24', '6460000': '36'}, 'default': '36'},
}

MAPPING_NOTES: list[str] = [
    '2026년 원자료는 광주·전남을 전남광주통합특별시(wa_laf_cd 1300000, 본청 laf_cd 6100000)로 제공한다. '
    '기존 17개 시도 체계를 유지하려고 본청 세부사업을 세부사업코드 앞 7자리(6290000=구 광주본청, '
    '6460000=구 전남본청)로 나눠 광주광역시·전라남도 본청에 배정했고, 통합특별시 신규 기관코드 사업은 '
    '전라남도 본청에 넣었다. 시·군·구는 자치단체코드 앞 2자리(29=광주, 46=전남)로 배정했다.',
    '군위군은 2023-07 대구광역시로 편입됐다(원자료 2024년부터 대구 laf_cd 2772000). 지도·기존 파일 '
    '체계에 맞춰 모든 연도에서 경상북도 아래에 둔다.',
    '2026년 인천 행정체제 개편(중구·동구·서구 → 영종구·제물포구·서해구·검단구)으로 원자료에는 신설 4개 '
    '구만 있다. 신설 구를 코드 011~014로 추가했고, 중구·동구·서구는 2026년 행이 없다.',
    '제주시·서귀포시는 행정시(자치단체 아님)라 원자료가 없다. 제주 예산은 전액 본청에 있다.',
]

FUNCTIONS = [
    '일반공공행정', '공공질서및안전', '교육', '문화및관광', '환경', '사회복지', '보건',
    '농림해양수산', '산업중소기업및에너지', '교통및물류', '국토및지역개발', '과학기술',
    '예비비기타', '기타',
]
ACCOUNTS = ['일반회계', '특별회계', '기금']
TRANSFER_KEYWORDS = ('내부거래', '보전지출')


def is_transfer(dbiz_nm: str) -> bool:
    return any(kw in dbiz_nm for kw in TRANSFER_KEYWORDS)


def map_function(fld_nm: str) -> str:
    name = fld_nm.strip().replace('ㆍ', '').replace('·', '')
    if name == '예비비':
        return '예비비기타'
    return name if name in FUNCTIONS else '기타'


def map_account(acnt_dv_nm: str) -> str:
    name = acnt_dv_nm.strip()
    if name == '일반회계':
        return '일반회계'
    if '기금' in name:
        return '기금'
    return '특별회계'


def to_million(won: int) -> int:
    """원 → 백만원, 0.5 올림(음수는 대칭)."""
    if won >= 0:
        return (won + 500_000) // 1_000_000
    return -((-won + 500_000) // 1_000_000)


def build_registry() -> tuple[dict[str, str], dict[str, dict[str, str]]]:
    region_names: dict[str, str] = {}
    districts: dict[str, dict[str, str]] = {}
    for code, name, names in REGIONS:
        region_names[code] = name
        lst = names.split() + ADDED_DISTRICTS.get(code, [])
        districts[code] = {d: f'{i + 1:03d}' for i, d in enumerate(lst)}
    return region_names, districts


def process_year(year: int, region_names: dict[str, str], districts: dict[str, dict[str, str]]):
    path = os.path.join(RAW_DIR, f'{year}.csv.gz')
    agg: dict[tuple[str, str, str, str], list[int]] = defaultdict(lambda: [0, 0])
    district_names: dict[tuple[str, str], str] = {}
    excluded_won = 0
    excluded_rows = 0
    exe_ymds: set[str] = set()
    seen_entities: set[tuple[str, str]] = set()
    relocated: set[str] = set()
    unknown: dict[tuple[str, str], str] = {}
    merged_hq_rows: dict[str, int] = defaultdict(int)

    with gzip.open(path, 'rt', encoding='utf-8', newline='') as f:
        for row in csv.DictReader(f):
            exe_ymds.add(row['exe_ymd'])
            amt = int(row['bdg_cash_amt'] or 0)
            ep = int(row['ep_amt'] or 0)
            dbiz_nm = row['dbiz_nm'].strip()
            if is_transfer(dbiz_nm):
                excluded_won += amt
                excluded_rows += 1
                continue

            wa_cd, wa_nm = row['wa_laf_cd'], row['wa_laf_hg_nm']
            laf_cd, laf_nm = row['laf_cd'], row['laf_hg_nm']
            is_hq = laf_cd == wa_cd or laf_nm.endswith('본청')

            if is_hq:
                if wa_cd in MERGED_HQ:
                    rule = MERGED_HQ[wa_cd]
                    prefix_map = rule['by_dbiz_prefix']
                    assert isinstance(prefix_map, dict)
                    region = prefix_map.get(row['dbiz_cd'][:7], rule['default'])
                    merged_hq_rows[f"{row['dbiz_cd'][:7]}→{region}"] += 1
                else:
                    region = LAF_PREFIX_TO_REGION.get(wa_cd[:2], '')
                if region not in region_names:
                    unknown[(laf_cd, laf_nm)] = 'hq-region'
                    continue
                dcode, dname = '000', '본청'
            else:
                region = LAF_PREFIX_TO_REGION.get(laf_cd[:2], '')
                name = laf_nm[len(wa_nm):] if laf_nm.startswith(wa_nm) else laf_nm
                if (region, name) in RELOCATE:
                    relocated.add(f'{laf_nm}({laf_cd})→{region_names[RELOCATE[(region, name)]]}')
                    region = RELOCATE[(region, name)]
                if region not in districts or name not in districts[region]:
                    unknown[(laf_cd, laf_nm)] = f'region={region} name={name}'
                    continue
                dcode, dname = districts[region][name], name

            seen_entities.add((region, dcode))
            district_names[(region, dcode)] = dname
            key = (region, dcode, map_function(row['fld_nm']), map_account(row['acnt_dv_nm']))
            agg[key][0] += amt
            agg[key][1] += ep

    if unknown:
        print(f'[{year}] 매핑 안 된 자치단체:', file=sys.stderr)
        for (cd, nm), why in sorted(unknown.items()):
            print(f'  {cd} {nm} ({why})', file=sys.stderr)
        sys.exit(1)

    region_order = {code: i for i, (code, _, _) in enumerate(REGIONS)}
    rows = []
    for (region, dcode, fn, acct), (amt, ep) in sorted(
        agg.items(),
        key=lambda kv: (region_order[kv[0][0]], kv[0][1], FUNCTIONS.index(kv[0][2]), ACCOUNTS.index(kv[0][3])),
    ):
        amount, executed = to_million(amt), to_million(ep)
        if amount == 0 and executed == 0:
            continue
        rows.append({
            'fiscalYear': year,
            'regionCode': region,
            'regionName': region_names[region],
            'districtCode': dcode,
            'districtName': district_names[(region, dcode)],
            'functionName': fn,
            'accountType': acct,
            'amount': amount,
            'executed': executed,
        })

    missing = []
    for code, _, _ in REGIONS:
        for dname, dcode in [('본청', '000')] + list(districts[code].items()):
            if (code, dcode) not in seen_entities and not (
                code in ADDED_DISTRICTS and dname in ADDED_DISTRICTS[code]
            ):
                missing.append(f'{region_names[code]} {dname}')
    added_present = sorted(
        f'{region_names[c]} {d}' for c, ds in ADDED_DISTRICTS.items() for d in ds
        if (c, districts[c][d]) in seen_entities
    )

    return {
        'rows': rows,
        'asOf': max(exe_ymds),
        'excludedWon': excluded_won,
        'excludedRows': excluded_rows,
        'missing': missing,
        'relocated': sorted(relocated),
        'added': added_present,
        'mergedHq': dict(merged_hq_rows),
    }


def main() -> None:
    region_names, districts = build_registry()
    meta_path = os.path.join(OUT_DIR, 'regional-metadata.json')
    meta: dict = {}
    if os.path.exists(meta_path):
        with open(meta_path, encoding='utf-8') as f:
            meta = json.load(f)

    totals: dict[str, int] = {}
    as_of: dict[str, str] = {}
    excluded: dict[str, int] = {}
    for year in YEARS:
        res = process_year(year, region_names, districts)
        out = os.path.join(OUT_DIR, f'regional-flat-{year}.json')
        with open(out, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(res['rows'], f, ensure_ascii=False, indent=2)
        totals[str(year)] = sum(r['amount'] for r in res['rows'])
        as_of[str(year)] = res['asOf']
        excluded[str(year)] = round(res['excludedWon'] / 1e8)
        n_dist = len({(r['regionCode'], r['districtCode']) for r in res['rows'] if r['districtCode'] != '000'})
        print(f'[{year}] 기준일 {res["asOf"]}, {len(res["rows"])}행, 시군구 {n_dist}곳, '
              f'제외 {res["excludedRows"]}행 {excluded[str(year)]:,}억원 → {out}')
        if res['missing']:
            print(f'  원자료 없는 기존 시군구: {", ".join(res["missing"])}')
        if res['relocated']:
            print(f'  시도 재배치: {", ".join(res["relocated"])}')
        if res['added']:
            print(f'  신설 시군구(새 코드): {", ".join(res["added"])}')
        if res['mergedHq']:
            print(f'  통합 본청 분할(세부사업코드 앞 7자리→시도코드: 행 수): {res["mergedHq"]}')

    new_meta = {
        'availableYears': YEARS,
        'lastUpdated': datetime.date.today().isoformat(),
        'totalsByYear': totals,
        'source': 'lofin365-QWGJK',
        'asOf': as_of,
        'excludedTransfersEok': excluded,
        'metroBasis': '본청만(소속 시·군·구 제외)',
        'note': (
            '지방재정365 세부사업별 세출(QWGJK) 예산현액(bdg_cash_amt) 집계, 단위 백만원. '
            'executed는 지출액(ep_amt). 사업명에 「내부거래」 또는 「보전지출」이 포함된 행 제외'
            '(회계 간 이동, excludedTransfersEok = 연도별 전국 제외액, 억원). '
            '광역(시·도) 금액은 본청만이며 소속 시·군·구는 따로 집계한다. '
            'totalsByYear는 본청과 시·군·구 행의 단순 합계로 시·도→시·군·구 이전재원이 중복돼 '
            '전국 순계가 아니다(화면에서 쓰지 않음).'
        ),
        'mappingNotes': MAPPING_NOTES,
    }
    # 기존 키 중 여기서 다루지 않는 키는 보존
    for k, v in meta.items():
        new_meta.setdefault(k, v)
    with open(meta_path, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(new_meta, f, ensure_ascii=False, indent=2)
    print(f'메타데이터 → {meta_path}')


if __name__ == '__main__':
    main()
