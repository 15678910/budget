// 고교 유형별 집계 — 자동생성 (scripts/fetch-highschool-types.mjs)
// 출처: 학교알리미 apiType=62(학교현황) HS_KND_SC_NM + 학교회계 예산(27) 조인. 2024.
// 유형: 일반고/특목고(과학·외고·국제 등)/특성화고/자율고. 영재학교는 미포함(별도법).
// budget = 학교회계 세출 합(원, 인건비 제외). 수동편집 금지.
export interface HsTypeAgg { type: string; schools: number; students: number; budget: number; perStudent: number }
export interface HsTypeSidoAgg extends HsTypeAgg { sido: string }
export const HS_TYPE_TOTAL = 2351;
export const HS_TYPE_AGG: HsTypeAgg[] = [
 {
  "type": "일반고",
  "schools": 1625,
  "students": 995520,
  "budget": 971994264000,
  "perStudent": 976368
 },
 {
  "type": "특성화고",
  "schools": 483,
  "students": 169354,
  "budget": 223680059000,
  "perStudent": 1320784
 },
 {
  "type": "자율고",
  "schools": 85,
  "students": 62267,
  "budget": 69193680000,
  "perStudent": 1111242
 },
 {
  "type": "특목고",
  "schools": 158,
  "students": 58581,
  "budget": 244035931000,
  "perStudent": 4165786
 }
];
export const HS_TYPE_SIDO_AGG: HsTypeSidoAgg[] = [
 {
  "type": "일반고",
  "sido": "서울",
  "schools": 213,
  "students": 152970,
  "budget": 73382417000,
  "perStudent": 479718
 },
 {
  "type": "자율고",
  "sido": "서울",
  "schools": 16,
  "students": 16238,
  "budget": 0,
  "perStudent": 0
 },
 {
  "type": "특목고",
  "sido": "서울",
  "schools": 21,
  "students": 11800,
  "budget": 22147625000,
  "perStudent": 1876917
 },
 {
  "type": "특성화고",
  "sido": "서울",
  "schools": 68,
  "students": 26302,
  "budget": 12961334000,
  "perStudent": 492789
 },
 {
  "type": "일반고",
  "sido": "부산",
  "schools": 93,
  "students": 49574,
  "budget": 65356001000,
  "perStudent": 1318352
 },
 {
  "type": "특성화고",
  "sido": "부산",
  "schools": 32,
  "students": 14001,
  "budget": 10789450000,
  "perStudent": 770620
 },
 {
  "type": "자율고",
  "sido": "부산",
  "schools": 4,
  "students": 1867,
  "budget": 4257058000,
  "perStudent": 2280160
 },
 {
  "type": "특목고",
  "sido": "부산",
  "schools": 12,
  "students": 5585,
  "budget": 21010346000,
  "perStudent": 3761924
 },
 {
  "type": "일반고",
  "sido": "대구",
  "schools": 63,
  "students": 42330,
  "budget": 44189681000,
  "perStudent": 1043933
 },
 {
  "type": "특성화고",
  "sido": "대구",
  "schools": 18,
  "students": 9695,
  "budget": 12410736000,
  "perStudent": 1280117
 },
 {
  "type": "자율고",
  "sido": "대구",
  "schools": 6,
  "students": 4020,
  "budget": 10079274000,
  "perStudent": 2507282
 },
 {
  "type": "특목고",
  "sido": "대구",
  "schools": 10,
  "students": 4038,
  "budget": 21587712000,
  "perStudent": 5346140
 },
 {
  "type": "특목고",
  "sido": "인천",
  "schools": 10,
  "students": 3633,
  "budget": 28816459000,
  "perStudent": 7931863
 },
 {
  "type": "일반고",
  "sido": "인천",
  "schools": 81,
  "students": 55530,
  "budget": 56745336000,
  "perStudent": 1021886
 },
 {
  "type": "특성화고",
  "sido": "인천",
  "schools": 28,
  "students": 11396,
  "budget": 17625554000,
  "perStudent": 1546644
 },
 {
  "type": "자율고",
  "sido": "인천",
  "schools": 8,
  "students": 4927,
  "budget": 7924151000,
  "perStudent": 1608312
 },
 {
  "type": "자율고",
  "sido": "광주",
  "schools": 3,
  "students": 1772,
  "budget": 5925599000,
  "perStudent": 3344017
 },
 {
  "type": "일반고",
  "sido": "광주",
  "schools": 49,
  "students": 33722,
  "budget": 15295961000,
  "perStudent": 453590
 },
 {
  "type": "특성화고",
  "sido": "광주",
  "schools": 11,
  "students": 5381,
  "budget": 5997931000,
  "perStudent": 1114650
 },
 {
  "type": "특목고",
  "sido": "광주",
  "schools": 5,
  "students": 1314,
  "budget": 5983911000,
  "perStudent": 4553966
 },
 {
  "type": "특성화고",
  "sido": "대전",
  "schools": 10,
  "students": 4400,
  "budget": 8232422000,
  "perStudent": 1871005
 },
 {
  "type": "특목고",
  "sido": "대전",
  "schools": 6,
  "students": 2113,
  "budget": 7661136000,
  "perStudent": 3625715
 },
 {
  "type": "자율고",
  "sido": "대전",
  "schools": 7,
  "students": 6318,
  "budget": 2156501000,
  "perStudent": 341327
 },
 {
  "type": "일반고",
  "sido": "대전",
  "schools": 39,
  "students": 26508,
  "budget": 33820363000,
  "perStudent": 1275855
 },
 {
  "type": "일반고",
  "sido": "울산",
  "schools": 40,
  "students": 23844,
  "budget": 29965633000,
  "perStudent": 1256737
 },
 {
  "type": "특성화고",
  "sido": "울산",
  "schools": 8,
  "students": 3928,
  "budget": 6979956000,
  "perStudent": 1776975
 },
 {
  "type": "자율고",
  "sido": "울산",
  "schools": 3,
  "students": 1774,
  "budget": 2579629000,
  "perStudent": 1454131
 },
 {
  "type": "특목고",
  "sido": "울산",
  "schools": 6,
  "students": 1705,
  "budget": 16936003000,
  "perStudent": 9933140
 },
 {
  "type": "일반고",
  "sido": "세종",
  "schools": 16,
  "students": 12361,
  "budget": 11666832000,
  "perStudent": 943842
 },
 {
  "type": "특성화고",
  "sido": "세종",
  "schools": 2,
  "students": 623,
  "budget": 3341096000,
  "perStudent": 5362915
 },
 {
  "type": "특목고",
  "sido": "세종",
  "schools": 3,
  "students": 790,
  "budget": 2564857000,
  "perStudent": 3246654
 },
 {
  "type": "특목고",
  "sido": "경기",
  "schools": 20,
  "students": 10911,
  "budget": 8521154000,
  "perStudent": 780969
 },
 {
  "type": "일반고",
  "sido": "경기",
  "schools": 361,
  "students": 289775,
  "budget": 324020605000,
  "perStudent": 1118180
 },
 {
  "type": "특성화고",
  "sido": "경기",
  "schools": 70,
  "students": 31867,
  "budget": 25333378000,
  "perStudent": 794972
 },
 {
  "type": "자율고",
  "sido": "경기",
  "schools": 11,
  "students": 9774,
  "budget": 18198404000,
  "perStudent": 1861920
 },
 {
  "type": "일반고",
  "sido": "충북",
  "schools": 48,
  "students": 26628,
  "budget": 21463574000,
  "perStudent": 806053
 },
 {
  "type": "특성화고",
  "sido": "충북",
  "schools": 24,
  "students": 8555,
  "budget": 12736174000,
  "perStudent": 1488740
 },
 {
  "type": "특목고",
  "sido": "충북",
  "schools": 7,
  "students": 1926,
  "budget": 5704624000,
  "perStudent": 2961902
 },
 {
  "type": "자율고",
  "sido": "충북",
  "schools": 5,
  "students": 3229,
  "budget": 0,
  "perStudent": 0
 },
 {
  "type": "일반고",
  "sido": "충남",
  "schools": 73,
  "students": 45071,
  "budget": 39610710000,
  "perStudent": 878851
 },
 {
  "type": "특성화고",
  "sido": "충남",
  "schools": 30,
  "students": 8663,
  "budget": 14594994000,
  "perStudent": 1684751
 },
 {
  "type": "자율고",
  "sido": "충남",
  "schools": 5,
  "students": 3127,
  "budget": 1545365000,
  "perStudent": 494201
 },
 {
  "type": "특목고",
  "sido": "충남",
  "schools": 10,
  "students": 2378,
  "budget": 23051891000,
  "perStudent": 9693815
 },
 {
  "type": "일반고",
  "sido": "전남",
  "schools": 87,
  "students": 32042,
  "budget": 43492499000,
  "perStudent": 1357359
 },
 {
  "type": "특성화고",
  "sido": "전남",
  "schools": 42,
  "students": 9934,
  "budget": 15000507000,
  "perStudent": 1510017
 },
 {
  "type": "특목고",
  "sido": "전남",
  "schools": 12,
  "students": 2455,
  "budget": 12799060000,
  "perStudent": 5213466
 },
 {
  "type": "자율고",
  "sido": "전남",
  "schools": 2,
  "students": 1303,
  "budget": 0,
  "perStudent": 0
 },
 {
  "type": "특목고",
  "sido": "경북",
  "schools": 12,
  "students": 3387,
  "budget": 25711616000,
  "perStudent": 7591265
 },
 {
  "type": "특성화고",
  "sido": "경북",
  "schools": 48,
  "students": 11234,
  "budget": 20457477000,
  "perStudent": 1821032
 },
 {
  "type": "일반고",
  "sido": "경북",
  "schools": 111,
  "students": 43367,
  "budget": 44433388000,
  "perStudent": 1024590
 },
 {
  "type": "자율고",
  "sido": "경북",
  "schools": 12,
  "students": 6170,
  "budget": 15427549000,
  "perStudent": 2500413
 },
 {
  "type": "일반고",
  "sido": "경남",
  "schools": 149,
  "students": 76841,
  "budget": 92439071000,
  "perStudent": 1202992
 },
 {
  "type": "특성화고",
  "sido": "경남",
  "schools": 34,
  "students": 9727,
  "budget": 14437304000,
  "perStudent": 1484250
 },
 {
  "type": "특목고",
  "sido": "경남",
  "schools": 9,
  "students": 2830,
  "budget": 19740832000,
  "perStudent": 6975559
 },
 {
  "type": "일반고",
  "sido": "제주",
  "schools": 21,
  "students": 15301,
  "budget": 15617452000,
  "perStudent": 1020682
 },
 {
  "type": "특성화고",
  "sido": "제주",
  "schools": 6,
  "students": 2851,
  "budget": 12733767000,
  "perStudent": 4466421
 },
 {
  "type": "특목고",
  "sido": "제주",
  "schools": 2,
  "students": 397,
  "budget": 0,
  "perStudent": 0
 },
 {
  "type": "자율고",
  "sido": "제주",
  "schools": 1,
  "students": 284,
  "budget": 1100150000,
  "perStudent": 3873768
 },
 {
  "type": "일반고",
  "sido": "강원",
  "schools": 85,
  "students": 30331,
  "budget": 44315543000,
  "perStudent": 1461064
 },
 {
  "type": "특목고",
  "sido": "강원",
  "schools": 6,
  "students": 1195,
  "budget": 7354609000,
  "perStudent": 6154485
 },
 {
  "type": "특성화고",
  "sido": "강원",
  "schools": 23,
  "students": 4698,
  "budget": 22699986000,
  "perStudent": 4831840
 },
 {
  "type": "자율고",
  "sido": "강원",
  "schools": 1,
  "students": 451,
  "budget": 0,
  "perStudent": 0
 },
 {
  "type": "일반고",
  "sido": "전북",
  "schools": 96,
  "students": 39325,
  "budget": 16179198000,
  "perStudent": 411423
 },
 {
  "type": "자율고",
  "sido": "전북",
  "schools": 1,
  "students": 1013,
  "budget": 0,
  "perStudent": 0
 },
 {
  "type": "특성화고",
  "sido": "전북",
  "schools": 29,
  "students": 6099,
  "budget": 7347993000,
  "perStudent": 1204787
 },
 {
  "type": "특목고",
  "sido": "전북",
  "schools": 7,
  "students": 2124,
  "budget": 14444096000,
  "perStudent": 6800422
 }
];
