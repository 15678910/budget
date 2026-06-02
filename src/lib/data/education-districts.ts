// ============================================================
// 전국 교육청 학교회계(세출) 집계 — 자동생성 (scripts/build-education-data.mjs)
// 원본: 학교알리미 OpenAPI apiType=27 depthNo2=02 (2024 예산세출)
//   schoolBudget = 학교회계 세출 합(원). 인건비 등 교육청 직접집행분 제외.
//   학교 8661교 집계. 학교 상세는 /data/education-schools-2024.json 지연로딩.
// ⚠️ 수동 편집 금지 — 재생성: node scripts/build-education-data.mjs 2024
// ============================================================

export interface DistrictAgg {
  code: string; name: string; metroOffice: string; sido: string;
  schoolBudget: number; students: number; schoolCount: number; perStudent: number;
}
export interface MetroAgg {
  name: string; sido: string;
  schoolBudget: number; students: number; schoolCount: number; districtCount: number; perStudent: number;
}

export const SCHOOL_BUDGET_YEAR = '2024';
export const SCHOOL_TOTAL_COUNT = 8661;

export const METRO_SCHOOL_AGG: MetroAgg[] = [
 {
  "name": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 1953303159000,
  "students": 763265,
  "schoolCount": 1332,
  "districtCount": 20,
  "perStudent": 2559142
 },
 {
  "name": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 938237500000,
  "students": 207545,
  "schoolCount": 633,
  "districtCount": 19,
  "perStudent": 4520646
 },
 {
  "name": "서울특별시교육청",
  "sido": "서울",
  "schoolBudget": 902985403000,
  "students": 558960,
  "schoolCount": 963,
  "districtCount": 13,
  "perStudent": 1615474
 },
 {
  "name": "부산광역시교육청",
  "sido": "부산",
  "schoolBudget": 803768796000,
  "students": 242497,
  "schoolCount": 499,
  "districtCount": 7,
  "perStudent": 3314552
 },
 {
  "name": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 516581639000,
  "students": 146497,
  "schoolCount": 765,
  "districtCount": 24,
  "perStudent": 3526227
 },
 {
  "name": "인천광역시교육청",
  "sido": "인천",
  "schoolBudget": 478745144000,
  "students": 280324,
  "schoolCount": 493,
  "districtCount": 7,
  "perStudent": 1707828
 },
 {
  "name": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 462066777000,
  "students": 150862,
  "schoolCount": 667,
  "districtCount": 23,
  "perStudent": 3062844
 },
 {
  "name": "대전광역시교육청",
  "sido": "대전",
  "schoolBudget": 456086071000,
  "students": 127775,
  "schoolCount": 257,
  "districtCount": 3,
  "perStudent": 3569447
 },
 {
  "name": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 454462649000,
  "students": 131268,
  "schoolCount": 528,
  "districtCount": 15,
  "perStudent": 3462098
 },
 {
  "name": "대구광역시교육청",
  "sido": "대구",
  "schoolBudget": 421927449000,
  "students": 184902,
  "schoolCount": 379,
  "districtCount": 7,
  "perStudent": 2281898
 },
 {
  "name": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 388984725000,
  "students": 123766,
  "schoolCount": 600,
  "districtCount": 19,
  "perStudent": 3142905
 },
 {
  "name": "광주광역시교육청",
  "sido": "광주",
  "schoolBudget": 335324005000,
  "students": 123427,
  "schoolCount": 244,
  "districtCount": 4,
  "perStudent": 2716780
 },
 {
  "name": "울산광역시교육청",
  "sido": "울산",
  "schoolBudget": 301493747000,
  "students": 119432,
  "schoolCount": 229,
  "districtCount": 3,
  "perStudent": 2524397
 },
 {
  "name": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 273771876000,
  "students": 78226,
  "schoolCount": 522,
  "districtCount": 15,
  "perStudent": 3499756
 },
 {
  "name": "충청북도교육청",
  "sido": "충북",
  "schoolBudget": 234305536000,
  "students": 56995,
  "schoolCount": 272,
  "districtCount": 10,
  "perStudent": 4110984
 },
 {
  "name": "제주특별자치도교육청",
  "sido": "제주",
  "schoolBudget": 219638824000,
  "students": 66010,
  "schoolCount": 178,
  "districtCount": 4,
  "perStudent": 3327357
 },
 {
  "name": "세종특별자치시교육청",
  "sido": "세종",
  "schoolBudget": 128688426000,
  "students": 61049,
  "schoolCount": 100,
  "districtCount": 1,
  "perStudent": 2107953
 }
];

export const DISTRICT_SCHOOL_AGG: DistrictAgg[] = [
 {
  "code": "S100000294",
  "name": "의령교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 10611785000,
  "students": 796,
  "schoolCount": 16,
  "perStudent": 13331388
 },
 {
  "code": "R100000503",
  "name": "경상북도울릉교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 4116342000,
  "students": 314,
  "schoolCount": 5,
  "perStudent": 13109369
 },
 {
  "code": "S100000401",
  "name": "하동교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 19306775000,
  "students": 1485,
  "schoolCount": 25,
  "perStudent": 13001195
 },
 {
  "code": "S100000447",
  "name": "합천교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 14365781000,
  "students": 1113,
  "schoolCount": 22,
  "perStudent": 12907261
 },
 {
  "code": "S100000264",
  "name": "산청교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 13849763000,
  "students": 1208,
  "schoolCount": 17,
  "perStudent": 11465036
 },
 {
  "code": "Q100000106",
  "name": "전라남도신안교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 11382051000,
  "students": 1050,
  "schoolCount": 34,
  "perStudent": 10840049
 },
 {
  "code": "S100000171",
  "name": "남해교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 15719976000,
  "students": 1649,
  "schoolCount": 18,
  "perStudent": 9533036
 },
 {
  "code": "S100000137",
  "name": "고성교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 22171311000,
  "students": 2530,
  "schoolCount": 26,
  "perStudent": 8763364
 },
 {
  "code": "S100000432",
  "name": "함양교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 14682348000,
  "students": 1742,
  "schoolCount": 18,
  "perStudent": 8428443
 },
 {
  "code": "M100000060",
  "name": "충청북도단양교육지원청",
  "metroOffice": "충청북도교육청",
  "sido": "충북",
  "schoolBudget": 9356023000,
  "students": 1159,
  "schoolCount": 18,
  "perStudent": 8072496
 },
 {
  "code": "M100000065",
  "name": "충청북도보은교육지원청",
  "metroOffice": "충청북도교육청",
  "sido": "충북",
  "schoolBudget": 11057147000,
  "students": 1447,
  "schoolCount": 20,
  "perStudent": 7641428
 },
 {
  "code": "D100002168",
  "name": "대구광역시군위교육지원청",
  "metroOffice": "대구광역시교육청",
  "sido": "대구",
  "schoolBudget": 4558433000,
  "students": 598,
  "schoolCount": 13,
  "perStudent": 7622798
 },
 {
  "code": "S100000346",
  "name": "창녕교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 17089007000,
  "students": 2305,
  "schoolCount": 21,
  "perStudent": 7413886
 },
 {
  "code": "R100000306",
  "name": "경상북도봉화교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 8539649000,
  "students": 1158,
  "schoolCount": 22,
  "perStudent": 7374481
 },
 {
  "code": "N100000086",
  "name": "충청남도청양교육지원청",
  "metroOffice": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 8591744000,
  "students": 1176,
  "schoolCount": 15,
  "perStudent": 7305905
 },
 {
  "code": "S100000123",
  "name": "거창교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 21039465000,
  "students": 2913,
  "schoolCount": 22,
  "perStudent": 7222611
 },
 {
  "code": "R100000580",
  "name": "경상북도청송교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 4868668000,
  "students": 691,
  "schoolCount": 14,
  "perStudent": 7045829
 },
 {
  "code": "R100000415",
  "name": "경상북도영양교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 3649992000,
  "students": 523,
  "schoolCount": 10,
  "perStudent": 6978952
 },
 {
  "code": "R100000540",
  "name": "경상북도의성교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 9419413000,
  "students": 1365,
  "schoolCount": 25,
  "perStudent": 6900669
 },
 {
  "code": "M100000071",
  "name": "충청북도영동교육지원청",
  "metroOffice": "충청북도교육청",
  "sido": "충북",
  "schoolBudget": 11719158000,
  "students": 1769,
  "schoolCount": 17,
  "perStudent": 6624736
 },
 {
  "code": "R100000561",
  "name": "경상북도청도교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 6008871000,
  "students": 959,
  "schoolCount": 14,
  "perStudent": 6265767
 },
 {
  "code": "S100000415",
  "name": "함안교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 21181237000,
  "students": 3475,
  "schoolCount": 19,
  "perStudent": 6095320
 },
 {
  "code": "N100000062",
  "name": "충청남도부여교육지원청",
  "metroOffice": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 15615537000,
  "students": 2587,
  "schoolCount": 32,
  "perStudent": 6036157
 },
 {
  "code": "S100000224",
  "name": "밀양교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 28788156000,
  "students": 4773,
  "schoolCount": 25,
  "perStudent": 6031459
 },
 {
  "code": "Q100000096",
  "name": "전라남도보성교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 8907380000,
  "students": 1497,
  "schoolCount": 24,
  "perStudent": 5950154
 },
 {
  "code": "P100000224",
  "name": "전북특별자치도임실교육지원청",
  "metroOffice": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 6205227000,
  "students": 1077,
  "schoolCount": 23,
  "perStudent": 5761585
 },
 {
  "code": "K100000228",
  "name": "강원특별자치도정선교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 9280407000,
  "students": 1623,
  "schoolCount": 27,
  "perStudent": 5718057
 },
 {
  "code": "N100000099",
  "name": "충청남도서천교육지원청",
  "metroOffice": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 11472063000,
  "students": 2019,
  "schoolCount": 24,
  "perStudent": 5682052
 },
 {
  "code": "R100000351",
  "name": "경상북도성주교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 6671442000,
  "students": 1180,
  "schoolCount": 18,
  "perStudent": 5653764
 },
 {
  "code": "Q100000055",
  "name": "전라남도고흥교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 12896760000,
  "students": 2295,
  "schoolCount": 32,
  "perStudent": 5619503
 },
 {
  "code": "P100000288",
  "name": "전북특별자치도진안교육지원청",
  "metroOffice": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 5914385000,
  "students": 1061,
  "schoolCount": 23,
  "perStudent": 5574350
 },
 {
  "code": "Q100000147",
  "name": "전라남도함평교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 7031249000,
  "students": 1262,
  "schoolCount": 18,
  "perStudent": 5571513
 },
 {
  "code": "K100000184",
  "name": "강원특별자치도영월교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 8290881000,
  "students": 1517,
  "schoolCount": 22,
  "perStudent": 5465314
 },
 {
  "code": "A000000001",
  "name": "서울특별시중부교육지원청",
  "metroOffice": "서울특별시교육청",
  "sido": "서울",
  "schoolBudget": 97566476000,
  "students": 18029,
  "schoolCount": 36,
  "perStudent": 5411641
 },
 {
  "code": "Q100000127",
  "name": "전라남도완도교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 13989862000,
  "students": 2683,
  "schoolCount": 37,
  "perStudent": 5214261
 },
 {
  "code": "R100000395",
  "name": "경상북도영덕교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 6863381000,
  "students": 1319,
  "schoolCount": 17,
  "perStudent": 5203473
 },
 {
  "code": "Q100000141",
  "name": "전라남도진도교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 5480003000,
  "students": 1062,
  "schoolCount": 18,
  "perStudent": 5160078
 },
 {
  "code": "K100000107",
  "name": "강원특별자치도고성교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 6567729000,
  "students": 1273,
  "schoolCount": 18,
  "perStudent": 5159253
 },
 {
  "code": "Q100000071",
  "name": "전라남도구례교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 6042265000,
  "students": 1179,
  "schoolCount": 15,
  "perStudent": 5124907
 },
 {
  "code": "Q100000136",
  "name": "전라남도장흥교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 9053265000,
  "students": 1770,
  "schoolCount": 23,
  "perStudent": 5114839
 },
 {
  "code": "P100000176",
  "name": "전북특별자치도순창교육지원청",
  "metroOffice": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 6325190000,
  "students": 1239,
  "schoolCount": 21,
  "perStudent": 5105077
 },
 {
  "code": "Q100000051",
  "name": "전라남도강진교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 8661997000,
  "students": 1699,
  "schoolCount": 22,
  "perStudent": 5098291
 },
 {
  "code": "K100000291",
  "name": "강원특별자치도평창교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 9084021000,
  "students": 1785,
  "schoolCount": 26,
  "perStudent": 5089087
 },
 {
  "code": "K100000336",
  "name": "강원특별자치도횡성교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 9575117000,
  "students": 1882,
  "schoolCount": 26,
  "perStudent": 5087735
 },
 {
  "code": "M100000052",
  "name": "충청북도괴산증평교육지원청",
  "metroOffice": "충청북도교육청",
  "sido": "충북",
  "schoolBudget": 19833811000,
  "students": 4047,
  "schoolCount": 27,
  "perStudent": 4900868
 },
 {
  "code": "Q100000081",
  "name": "전라남도담양교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 9906484000,
  "students": 2027,
  "schoolCount": 21,
  "perStudent": 4887264
 },
 {
  "code": "R100000194",
  "name": "경상북도고령교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 5448452000,
  "students": 1116,
  "schoolCount": 14,
  "perStudent": 4882125
 },
 {
  "code": "N100000054",
  "name": "충청남도금산교육지원청",
  "metroOffice": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 12719851000,
  "students": 2635,
  "schoolCount": 25,
  "perStudent": 4827268
 },
 {
  "code": "K100000321",
  "name": "강원특별자치도화천교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 6506353000,
  "students": 1361,
  "schoolCount": 17,
  "perStudent": 4780568
 },
 {
  "code": "N100000109",
  "name": "충청남도태안교육지원청",
  "metroOffice": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 13820746000,
  "students": 2904,
  "schoolCount": 28,
  "perStudent": 4759210
 },
 {
  "code": "Q100000001",
  "name": "전라남도교육청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 129698382000,
  "students": 27481,
  "schoolCount": 99,
  "perStudent": 4719566
 },
 {
  "code": "N100000049",
  "name": "충청남도공주교육지원청",
  "metroOffice": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 21631072000,
  "students": 4599,
  "schoolCount": 37,
  "perStudent": 4703429
 },
 {
  "code": "K100000169",
  "name": "강원특별자치도양구교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 6553843000,
  "students": 1398,
  "schoolCount": 16,
  "perStudent": 4688014
 },
 {
  "code": "P100000165",
  "name": "전북특별자치도부안교육지원청",
  "metroOffice": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 8595769000,
  "students": 1836,
  "schoolCount": 27,
  "perStudent": 4681791
 },
 {
  "code": "S100000001",
  "name": "경상남도교육청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 188769984000,
  "students": 40384,
  "schoolCount": 86,
  "perStudent": 4674376
 },
 {
  "code": "Q100000152",
  "name": "전라남도해남교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 15789584000,
  "students": 3381,
  "schoolCount": 31,
  "perStudent": 4670093
 },
 {
  "code": "J100000357",
  "name": "경기도연천교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 10345555000,
  "students": 2216,
  "schoolCount": 19,
  "perStudent": 4668572
 },
 {
  "code": "M100000001",
  "name": "충청북도교육청",
  "metroOffice": "충청북도교육청",
  "sido": "충북",
  "schoolBudget": 58428434000,
  "students": 12518,
  "schoolCount": 37,
  "perStudent": 4667553
 },
 {
  "code": "S100000240",
  "name": "사천교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 32852898000,
  "students": 7058,
  "schoolCount": 24,
  "perStudent": 4654704
 },
 {
  "code": "Q100000060",
  "name": "전라남도곡성교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 5247218000,
  "students": 1145,
  "schoolCount": 11,
  "perStudent": 4582723
 },
 {
  "code": "P100000001",
  "name": "전북특별자치도교육청",
  "metroOffice": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 55027658000,
  "students": 12124,
  "schoolCount": 53,
  "perStudent": 4538738
 },
 {
  "code": "Q100000131",
  "name": "전라남도장성교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 10634907000,
  "students": 2350,
  "schoolCount": 20,
  "perStudent": 4525492
 },
 {
  "code": "S100000383",
  "name": "통영교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 40410074000,
  "students": 9053,
  "schoolCount": 33,
  "perStudent": 4463722
 },
 {
  "code": "N100000075",
  "name": "충청남도예산교육지원청",
  "metroOffice": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 19368176000,
  "students": 4362,
  "schoolCount": 31,
  "perStudent": 4440205
 },
 {
  "code": "N100000001",
  "name": "충청남도교육청",
  "metroOffice": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 115318181000,
  "students": 25991,
  "schoolCount": 65,
  "perStudent": 4436850
 },
 {
  "code": "P100000097",
  "name": "전북특별자치도고창교육지원청",
  "metroOffice": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 9415721000,
  "students": 2143,
  "schoolCount": 31,
  "perStudent": 4393710
 },
 {
  "code": "P100000235",
  "name": "전북특별자치도장수교육지원청",
  "metroOffice": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 4566961000,
  "students": 1041,
  "schoolCount": 16,
  "perStudent": 4387090
 },
 {
  "code": "J100000426",
  "name": "경기도포천교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 33087311000,
  "students": 7568,
  "schoolCount": 42,
  "perStudent": 4372002
 },
 {
  "code": "T100000001",
  "name": "제주특별자치도교육청",
  "metroOffice": "제주특별자치도교육청",
  "sido": "제주",
  "schoolBudget": 43493182000,
  "students": 10001,
  "schoolCount": 20,
  "perStudent": 4348883
 },
 {
  "code": "K100000306",
  "name": "강원특별자치도홍천교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 14685777000,
  "students": 3396,
  "schoolCount": 36,
  "perStudent": 4324434
 },
 {
  "code": "M100000077",
  "name": "충청북도옥천교육지원청",
  "metroOffice": "충청북도교육청",
  "sido": "충북",
  "schoolBudget": 11394022000,
  "students": 2638,
  "schoolCount": 19,
  "perStudent": 4319190
 },
 {
  "code": "K100000213",
  "name": "강원특별자치도인제교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 8529244000,
  "students": 1975,
  "schoolCount": 20,
  "perStudent": 4318605
 },
 {
  "code": "N100000103",
  "name": "충청남도보령교육지원청",
  "metroOffice": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 23272451000,
  "students": 5424,
  "schoolCount": 42,
  "perStudent": 4290644
 },
 {
  "code": "R100000001",
  "name": "경상북도교육청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 104980164000,
  "students": 24481,
  "schoolCount": 80,
  "perStudent": 4288230
 },
 {
  "code": "S100000312",
  "name": "진주교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 100831590000,
  "students": 23555,
  "schoolCount": 60,
  "perStudent": 4280687
 },
 {
  "code": "R100000327",
  "name": "경상북도상주교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 17434611000,
  "students": 4117,
  "schoolCount": 43,
  "perStudent": 4234785
 },
 {
  "code": "M100000083",
  "name": "충청북도음성교육지원청",
  "metroOffice": "충청북도교육청",
  "sido": "충북",
  "schoolBudget": 18527380000,
  "students": 4388,
  "schoolCount": 24,
  "perStudent": 4222284
 },
 {
  "code": "G100000001",
  "name": "대전광역시교육청",
  "metroOffice": "대전광역시교육청",
  "sido": "대전",
  "schoolBudget": 95563083000,
  "students": 22979,
  "schoolCount": 34,
  "perStudent": 4158714
 },
 {
  "code": "K100000001",
  "name": "강원특별자치도교육청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 106442154000,
  "students": 25658,
  "schoolCount": 93,
  "perStudent": 4148498
 },
 {
  "code": "P100000154",
  "name": "전북특별자치도무주교육지원청",
  "metroOffice": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 5036693000,
  "students": 1230,
  "schoolCount": 16,
  "perStudent": 4094872
 },
 {
  "code": "C100000001",
  "name": "부산광역시교육청",
  "metroOffice": "부산광역시교육청",
  "sido": "부산",
  "schoolBudget": 136488485000,
  "students": 33795,
  "schoolCount": 63,
  "perStudent": 4038718
 },
 {
  "code": "Q100000122",
  "name": "전라남도영암교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 12036740000,
  "students": 3020,
  "schoolCount": 25,
  "perStudent": 3985675
 },
 {
  "code": "P100000128",
  "name": "전북특별자치도김제교육지원청",
  "metroOffice": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 14187395000,
  "students": 3570,
  "schoolCount": 41,
  "perStudent": 3974060
 },
 {
  "code": "Q100000117",
  "name": "전라남도영광교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 10700802000,
  "students": 2693,
  "schoolCount": 22,
  "perStudent": 3973562
 },
 {
  "code": "K100000137",
  "name": "강원특별자치도삼척교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 12241528000,
  "students": 3105,
  "schoolCount": 27,
  "perStudent": 3942521
 },
 {
  "code": "K100000243",
  "name": "강원특별자치도철원교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 9939546000,
  "students": 2544,
  "schoolCount": 21,
  "perStudent": 3907054
 },
 {
  "code": "D100000001",
  "name": "대구광역시교육청",
  "metroOffice": "대구광역시교육청",
  "sido": "대구",
  "schoolBudget": 103935417000,
  "students": 26702,
  "schoolCount": 47,
  "perStudent": 3892421
 },
 {
  "code": "G100000108",
  "name": "대전광역시동부교육지원청",
  "metroOffice": "대전광역시교육청",
  "sido": "대전",
  "schoolBudget": 137557427000,
  "students": 35582,
  "schoolCount": 96,
  "perStudent": 3865927
 },
 {
  "code": "R100000521",
  "name": "경상북도울진교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 9792064000,
  "students": 2553,
  "schoolCount": 23,
  "perStudent": 3835513
 },
 {
  "code": "S100000106",
  "name": "거제교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 90515810000,
  "students": 23609,
  "schoolCount": 54,
  "perStudent": 3833954
 },
 {
  "code": "E100000070",
  "name": "인천광역시강화교육지원청",
  "metroOffice": "인천광역시교육청",
  "sido": "인천",
  "schoolBudget": 11818507000,
  "students": 3112,
  "schoolCount": 27,
  "perStudent": 3797721
 },
 {
  "code": "P100000272",
  "name": "전북특별자치도정읍교육지원청",
  "metroOffice": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 19701190000,
  "students": 5196,
  "schoolCount": 46,
  "perStudent": 3791607
 },
 {
  "code": "Q100000157",
  "name": "전라남도화순교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 12443701000,
  "students": 3341,
  "schoolCount": 26,
  "perStudent": 3724544
 },
 {
  "code": "T100000095",
  "name": "서귀포시교육지원청",
  "metroOffice": "제주특별자치도교육청",
  "sido": "제주",
  "schoolBudget": 49505445000,
  "students": 13417,
  "schoolCount": 59,
  "perStudent": 3689755
 },
 {
  "code": "J100000086",
  "name": "경기도가평교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 11617706000,
  "students": 3195,
  "schoolCount": 21,
  "perStudent": 3636215
 },
 {
  "code": "S100000152",
  "name": "김해교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 175043431000,
  "students": 48816,
  "schoolCount": 89,
  "perStudent": 3585780
 },
 {
  "code": "R100000460",
  "name": "경상북도영천교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 14110826000,
  "students": 3939,
  "schoolCount": 28,
  "perStudent": 3582337
 },
 {
  "code": "C100000284",
  "name": "부산광역시서부교육지원청",
  "metroOffice": "부산광역시교육청",
  "sido": "부산",
  "schoolBudget": 96302553000,
  "students": 27229,
  "schoolCount": 75,
  "perStudent": 3536764
 },
 {
  "code": "S100000280",
  "name": "양산교육지원청",
  "metroOffice": "경상남도교육청",
  "sido": "경남",
  "schoolBudget": 104681389000,
  "students": 29603,
  "schoolCount": 55,
  "perStudent": 3536175
 },
 {
  "code": "N100000113",
  "name": "충청남도홍성교육지원청",
  "metroOffice": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 24463812000,
  "students": 6919,
  "schoolCount": 28,
  "perStudent": 3535744
 },
 {
  "code": "K100000276",
  "name": "강원특별자치도태백교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 8835831000,
  "students": 2508,
  "schoolCount": 18,
  "perStudent": 3523059
 },
 {
  "code": "F100000001",
  "name": "광주광역시교육청",
  "metroOffice": "광주광역시교육청",
  "sido": "광주",
  "schoolBudget": 54200062000,
  "students": 15435,
  "schoolCount": 24,
  "perStudent": 3511504
 },
 {
  "code": "M100000091",
  "name": "충청북도제천교육지원청",
  "metroOffice": "충청북도교육청",
  "sido": "충북",
  "schoolBudget": 27277842000,
  "students": 7902,
  "schoolCount": 35,
  "perStudent": 3452017
 },
 {
  "code": "R100000280",
  "name": "경상북도문경교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 11617923000,
  "students": 3379,
  "schoolCount": 28,
  "perStudent": 3438273
 },
 {
  "code": "R100000484",
  "name": "경상북도예천교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 8916445000,
  "students": 2597,
  "schoolCount": 19,
  "perStudent": 3433363
 },
 {
  "code": "P100000141",
  "name": "전북특별자치도남원교육지원청",
  "metroOffice": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 15854757000,
  "students": 4639,
  "schoolCount": 39,
  "perStudent": 3417710
 },
 {
  "code": "N100000058",
  "name": "충청남도논산계룡교육지원청",
  "metroOffice": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 36313823000,
  "students": 10767,
  "schoolCount": 48,
  "perStudent": 3372696
 },
 {
  "code": "M100000120",
  "name": "충청북도충주교육지원청",
  "metroOffice": "충청북도교육청",
  "sido": "충북",
  "schoolBudget": 44299104000,
  "students": 13350,
  "schoolCount": 53,
  "perStudent": 3318285
 },
 {
  "code": "J100000343",
  "name": "경기도여주교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 21141849000,
  "students": 6502,
  "schoolCount": 34,
  "perStudent": 3251592
 },
 {
  "code": "C100000258",
  "name": "부산광역시북부교육지원청",
  "metroOffice": "부산광역시교육청",
  "sido": "부산",
  "schoolBudget": 143081915000,
  "students": 44287,
  "schoolCount": 99,
  "perStudent": 3230788
 },
 {
  "code": "G100000138",
  "name": "대전광역시서부교육지원청",
  "metroOffice": "대전광역시교육청",
  "sido": "대전",
  "schoolBudget": 222965561000,
  "students": 69214,
  "schoolCount": 127,
  "perStudent": 3221394
 },
 {
  "code": "J100000287",
  "name": "경기도안성교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 44044478000,
  "students": 13857,
  "schoolCount": 44,
  "perStudent": 3178500
 },
 {
  "code": "C100000175",
  "name": "부산광역시남부교육지원청",
  "metroOffice": "부산광역시교육청",
  "sido": "부산",
  "schoolBudget": 127424928000,
  "students": 40137,
  "schoolCount": 86,
  "perStudent": 3174750
 },
 {
  "code": "R100000255",
  "name": "경상북도김천교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 24668514000,
  "students": 8078,
  "schoolCount": 38,
  "perStudent": 3053790
 },
 {
  "code": "C100000312",
  "name": "부산광역시해운대교육지원청",
  "metroOffice": "부산광역시교육청",
  "sido": "부산",
  "schoolBudget": 155684893000,
  "students": 51700,
  "schoolCount": 91,
  "perStudent": 3011313
 },
 {
  "code": "P100000190",
  "name": "전북특별자치도완주교육지원청",
  "metroOffice": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 19016436000,
  "students": 6362,
  "schoolCount": 40,
  "perStudent": 2989066
 },
 {
  "code": "C100000202",
  "name": "부산광역시동래교육지원청",
  "metroOffice": "부산광역시교육청",
  "sido": "부산",
  "schoolBudget": 127466149000,
  "students": 43027,
  "schoolCount": 81,
  "perStudent": 2962469
 },
 {
  "code": "J100000331",
  "name": "경기도양평교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 17594413000,
  "students": 5997,
  "schoolCount": 29,
  "perStudent": 2933869
 },
 {
  "code": "T100000110",
  "name": "제주시교육지원청",
  "metroOffice": "제주특별자치도교육청",
  "sido": "제주",
  "schoolBudget": 118963901000,
  "students": 40702,
  "schoolCount": 96,
  "perStudent": 2922802
 },
 {
  "code": "H100000001",
  "name": "울산광역시교육청",
  "metroOffice": "울산광역시교육청",
  "sido": "울산",
  "schoolBudget": 75953028000,
  "students": 26075,
  "schoolCount": 45,
  "perStudent": 2912868
 },
 {
  "code": "J100000144",
  "name": "경기도군포의왕교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 82319168000,
  "students": 28383,
  "schoolCount": 60,
  "perStudent": 2900298
 },
 {
  "code": "M100000098",
  "name": "충청북도진천교육지원청",
  "metroOffice": "충청북도교육청",
  "sido": "충북",
  "schoolBudget": 22412615000,
  "students": 7777,
  "schoolCount": 22,
  "perStudent": 2881910
 },
 {
  "code": "J100000001",
  "name": "경기도의정부교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 412960995000,
  "students": 144992,
  "schoolCount": 191,
  "perStudent": 2848164
 },
 {
  "code": "Q100000110",
  "name": "전라남도여수교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 50632883000,
  "students": 17937,
  "schoolCount": 72,
  "perStudent": 2822818
 },
 {
  "code": "K100000152",
  "name": "강원특별자치도속초양양교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 19580880000,
  "students": 7013,
  "schoolCount": 36,
  "perStudent": 2792083
 },
 {
  "code": "F100000057",
  "name": "광주광역시동부교육지원청",
  "metroOffice": "광주광역시교육청",
  "sido": "광주",
  "schoolBudget": 91975232000,
  "students": 33065,
  "schoolCount": 79,
  "perStudent": 2781649
 },
 {
  "code": "Q100000076",
  "name": "전라남도나주교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 24855617000,
  "students": 8941,
  "schoolCount": 38,
  "perStudent": 2779959
 },
 {
  "code": "R100000433",
  "name": "경상북도영주교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 13435315000,
  "students": 4870,
  "schoolCount": 25,
  "perStudent": 2758792
 },
 {
  "code": "J100000389",
  "name": "경기도이천교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 48397184000,
  "students": 17662,
  "schoolCount": 45,
  "perStudent": 2740187
 },
 {
  "code": "R100000370",
  "name": "경상북도안동교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 26595203000,
  "students": 9853,
  "schoolCount": 40,
  "perStudent": 2699199
 },
 {
  "code": "Q100000065",
  "name": "전라남도광양교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 32033244000,
  "students": 11887,
  "schoolCount": 41,
  "perStudent": 2694813
 },
 {
  "code": "P100000204",
  "name": "전북특별자치도익산교육지원청",
  "metroOffice": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 43227223000,
  "students": 16363,
  "schoolCount": 76,
  "perStudent": 2641766
 },
 {
  "code": "R100000168",
  "name": "경상북도경주교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 36551036000,
  "students": 13878,
  "schoolCount": 56,
  "perStudent": 2633739
 },
 {
  "code": "N100000090",
  "name": "충청남도당진교육지원청",
  "metroOffice": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 33751132000,
  "students": 12866,
  "schoolCount": 43,
  "perStudent": 2623281
 },
 {
  "code": "H100000041",
  "name": "울산광역시강남교육지원청",
  "metroOffice": "울산광역시교육청",
  "sido": "울산",
  "schoolBudget": 106613250000,
  "students": 40663,
  "schoolCount": 93,
  "perStudent": 2621874
 },
 {
  "code": "K100000092",
  "name": "강원특별자치도강릉교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 34779443000,
  "students": 13435,
  "schoolCount": 50,
  "perStudent": 2588719
 },
 {
  "code": "P100000108",
  "name": "전북특별자치도군산교육지원청",
  "metroOffice": "전북특별자치도교육청",
  "sido": "전북",
  "schoolBudget": 49272228000,
  "students": 19260,
  "schoolCount": 68,
  "perStudent": 2558267
 },
 {
  "code": "N100000094",
  "name": "충청남도서산교육지원청",
  "metroOffice": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 34440111000,
  "students": 13494,
  "schoolCount": 41,
  "perStudent": 2552254
 },
 {
  "code": "Q100000091",
  "name": "전라남도무안교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 20540330000,
  "students": 8084,
  "schoolCount": 29,
  "perStudent": 2540862
 },
 {
  "code": "Q100000102",
  "name": "전라남도순천교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 58321570000,
  "students": 23100,
  "schoolCount": 64,
  "perStudent": 2524743
 },
 {
  "code": "J100000170",
  "name": "경기도구리남양주교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 184609884000,
  "students": 73601,
  "schoolCount": 124,
  "perStudent": 2508252
 },
 {
  "code": "J100000412",
  "name": "경기도평택교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 115291463000,
  "students": 45982,
  "schoolCount": 85,
  "perStudent": 2507317
 },
 {
  "code": "J100000400",
  "name": "경기도파주교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 110034652000,
  "students": 44062,
  "schoolCount": 82,
  "perStudent": 2497269
 },
 {
  "code": "J100000117",
  "name": "경기도광명교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 54580819000,
  "students": 21961,
  "schoolCount": 37,
  "perStudent": 2485352
 },
 {
  "code": "E100000001",
  "name": "인천광역시교육청",
  "metroOffice": "인천광역시교육청",
  "sido": "인천",
  "schoolBudget": 136712691000,
  "students": 55137,
  "schoolCount": 93,
  "perStudent": 2479509
 },
 {
  "code": "F100000072",
  "name": "광주광역시서부교육지원청",
  "metroOffice": "광주광역시교육청",
  "sido": "광주",
  "schoolBudget": 181788843000,
  "students": 73447,
  "schoolCount": 138,
  "perStudent": 2475102
 },
 {
  "code": "K100000257",
  "name": "강원특별자치도춘천교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 48051355000,
  "students": 19985,
  "schoolCount": 59,
  "perStudent": 2404371
 },
 {
  "code": "J100000377",
  "name": "경기도의정부교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 75734442000,
  "students": 31681,
  "schoolCount": 52,
  "perStudent": 2390532
 },
 {
  "code": "B100000359",
  "name": "서울특별시중부교육지원청",
  "metroOffice": "서울특별시교육청",
  "sido": "서울",
  "schoolBudget": 34466611000,
  "students": 14422,
  "schoolCount": 41,
  "perStudent": 2389863
 },
 {
  "code": "J100005083",
  "name": "경기도시흥교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 114148743000,
  "students": 47997,
  "schoolCount": 75,
  "perStudent": 2378247
 },
 {
  "code": "Q100000086",
  "name": "전라남도목포교육지원청",
  "metroOffice": "전라남도교육청",
  "sido": "전남",
  "schoolBudget": 38347299000,
  "students": 16219,
  "schoolCount": 42,
  "perStudent": 2364344
 },
 {
  "code": "K100000121",
  "name": "강원특별자치도동해교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 14331336000,
  "students": 6149,
  "schoolCount": 18,
  "perStudent": 2330678
 },
 {
  "code": "J100000432",
  "name": "경기도화성오산교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 284854623000,
  "students": 122470,
  "schoolCount": 174,
  "perStudent": 2325913
 },
 {
  "code": "J100000158",
  "name": "경기도김포교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 115953654000,
  "students": 49995,
  "schoolCount": 68,
  "perStudent": 2319305
 },
 {
  "code": "J100000189",
  "name": "경기도동두천양주교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 64202459000,
  "students": 27727,
  "schoolCount": 60,
  "perStudent": 2315521
 },
 {
  "code": "R100000599",
  "name": "경상북도칠곡교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 19859275000,
  "students": 8701,
  "schoolCount": 30,
  "perStudent": 2282413
 },
 {
  "code": "J100000132",
  "name": "경기도광주하남교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 135638353000,
  "students": 59987,
  "schoolCount": 81,
  "perStudent": 2261129
 },
 {
  "code": "H100000058",
  "name": "울산광역시강북교육지원청",
  "metroOffice": "울산광역시교육청",
  "sido": "울산",
  "schoolBudget": 118927469000,
  "students": 52694,
  "schoolCount": 91,
  "perStudent": 2256945
 },
 {
  "code": "J100000299",
  "name": "경기도안양과천교육지원청",
  "metroOffice": "경기도교육청",
  "sido": "경기",
  "schoolBudget": 16745408000,
  "students": 7430,
  "schoolCount": 9,
  "perStudent": 2253756
 },
 {
  "code": "N100000066",
  "name": "충청남도아산교육지원청",
  "metroOffice": "충청남도교육청",
  "sido": "충남",
  "schoolBudget": 75296783000,
  "students": 34426,
  "schoolCount": 66,
  "perStudent": 2187207
 },
 {
  "code": "R100000147",
  "name": "경상북도경산교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 35138161000,
  "students": 16453,
  "schoolCount": 40,
  "perStudent": 2135669
 },
 {
  "code": "I100000001",
  "name": "세종특별자치시교육청",
  "metroOffice": "세종특별자치시교육청",
  "sido": "세종",
  "schoolBudget": 128688426000,
  "students": 61049,
  "schoolCount": 100,
  "perStudent": 2107953
 },
 {
  "code": "D100000199",
  "name": "대구광역시서부교육지원청",
  "metroOffice": "대구광역시교육청",
  "sido": "대구",
  "schoolBudget": 75414309000,
  "students": 35994,
  "schoolCount": 83,
  "perStudent": 2095191
 },
 {
  "code": "B100000001",
  "name": "서울특별시교육청",
  "metroOffice": "서울특별시교육청",
  "sido": "서울",
  "schoolBudget": 146332674000,
  "students": 71186,
  "schoolCount": 115,
  "perStudent": 2055638
 },
 {
  "code": "D100000117",
  "name": "대구광역시남부교육지원청",
  "metroOffice": "대구광역시교육청",
  "sido": "대구",
  "schoolBudget": 84683749000,
  "students": 41955,
  "schoolCount": 89,
  "perStudent": 2018442
 },
 {
  "code": "K100000198",
  "name": "강원특별자치도원주교육지원청",
  "metroOffice": "강원특별자치도교육청",
  "sido": "강원",
  "schoolBudget": 51702579000,
  "students": 26029,
  "schoolCount": 68,
  "perStudent": 1986345
 },
 {
  "code": "R100000213",
  "name": "경상북도구미교육지원청",
  "metroOffice": "경상북도교육청",
  "sido": "경북",
  "schoolBudget": 71601162000,
  "students": 38310,
  "schoolCount": 76,
  "perStudent": 1868994
 },
 {
  "code": "D100000171",
  "name": "대구광역시동부교육지원청",
  "metroOffice": "대구광역시교육청",
  "sido": "대구",
  "schoolBudget": 98400605000,
  "students": 52769,
  "schoolCount": 97,
  "perStudent": 1864743
 },
 {
  "code": "D100000143",
  "name": "대구광역시달성교육지원청",
  "metroOffice": "대구광역시교육청",
  "sido": "대구",
  "schoolBudget": 45747955000,
  "students": 24679,
  "schoolCount": 46,
  "perStudent": 1853720
 },
 {
  "code": "B100000337",
  "name": "서울특별시성동광진교육지원청",
  "metroOffice": "서울특별시교육청",
  "sido": "서울",
  "schoolBudget": 47239788000,
  "students": 27908,
  "schoolCount": 57,
  "perStudent": 1692697
 },
 {
  "code": "B100000304",
  "name": "서울특별시동작관악교육지원청",
  "metroOffice": "서울특별시교육청",
  "sido": "서울",
  "schoolBudget": 56334443000,
  "students": 33673,
  "schoolCount": 66,
  "perStudent": 1672986
 },
 {
  "code": "B100000315",
  "name": "서울특별시북부교육지원청",
  "metroOffice": "서울특별시교육청",
  "sido": "서울",
  "schoolBudget": 72836061000,
  "students": 44708,
  "schoolCount": 91,
  "perStudent": 1629151
 },
 {
  "code": "B100000326",
  "name": "서울특별시서부교육지원청",
  "metroOffice": "서울특별시교육청",
  "sido": "서울",
  "schoolBudget": 83848208000,
  "students": 51835,
  "schoolCount": 90,
  "perStudent": 1617598
 },
 {
  "code": "E100000150",
  "name": "인천광역시북부교육지원청",
  "metroOffice": "인천광역시교육청",
  "sido": "인천",
  "schoolBudget": 79226266000,
  "students": 48989,
  "schoolCount": 103,
  "perStudent": 1617226
 },
 {
  "code": "B100000348",
  "name": "서울특별시성북강북교육지원청",
  "metroOffice": "서울특별시교육청",
  "sido": "서울",
  "schoolBudget": 48397403000,
  "students": 30631,
  "schoolCount": 54,
  "perStudent": 1580014
 },
 {
  "code": "B100000282",
  "name": "서울특별시남부교육지원청",
  "metroOffice": "서울특별시교육청",
  "sido": "서울",
  "schoolBudget": 80252133000,
  "students": 51547,
  "schoolCount": 98,
  "perStudent": 1556873
 },
 {
  "code": "B100000293",
  "name": "서울특별시동부교육지원청",
  "metroOffice": "서울특별시교육청",
  "sido": "서울",
  "schoolBudget": 48294811000,
  "students": 31481,
  "schoolCount": 60,
  "perStudent": 1534094
 },
 {
  "code": "E100000117",
  "name": "인천광역시동부교육지원청",
  "metroOffice": "인천광역시교육청",
  "sido": "인천",
  "schoolBudget": 115172965000,
  "students": 75778,
  "schoolCount": 110,
  "perStudent": 1519873
 },
 {
  "code": "B100000260",
  "name": "서울특별시강동송파교육지원청",
  "metroOffice": "서울특별시교육청",
  "sido": "서울",
  "schoolBudget": 106285974000,
  "students": 70030,
  "schoolCount": 104,
  "perStudent": 1517721
 },
 {
  "code": "E100000082",
  "name": "인천광역시남부교육지원청",
  "metroOffice": "인천광역시교육청",
  "sido": "인천",
  "schoolBudget": 60205983000,
  "students": 39804,
  "schoolCount": 79,
  "perStudent": 1512561
 },
 {
  "code": "B100000271",
  "name": "서울특별시강서양천교육지원청",
  "metroOffice": "서울특별시교육청",
  "sido": "서울",
  "schoolBudget": 89414547000,
  "students": 61648,
  "schoolCount": 95,
  "perStudent": 1450405
 },
 {
  "code": "E100001748",
  "name": "인천광역시서부교육지원청",
  "metroOffice": "인천광역시교육청",
  "sido": "인천",
  "schoolBudget": 72109931000,
  "students": 56617,
  "schoolCount": 79,
  "perStudent": 1273645
 },
 {
  "code": "B100000249",
  "name": "서울특별시강남서초교육지원청",
  "metroOffice": "서울특별시교육청",
  "sido": "서울",
  "schoolBudget": 80631638000,
  "students": 66860,
  "schoolCount": 85,
  "perStudent": 1205977
 }
];
