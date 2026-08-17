# AI 데이터센터 · 3대 메가프로젝트 분석 계산기 — 설계 문서

- 작성일: 2026-08-17
- 상태: 승인됨 (구현 대기)
- 산출물: 의존성 0인 Python CLI 패키지 `datacenter_calc`

---

## 1. 목적

AI 데이터센터 사업의 단위 경제성과, 이재명 정부 3대 메가프로젝트(반도체 · 피지컬AI · AI데이터센터)의
데이터센터 부문이 지역에 미치는 영향을 정량적으로 따져보는 **교육·설명용 분석 도구**를 만든다.

이 도구는 결론을 내려주지 않는다. 기업·정부의 공식 발표치와 제3자 실측치를 같은 화면에 나란히 놓고,
가정을 바꿨을 때 결과가 어떻게 움직이는지 보여준다. 판단은 사용자가 한다.

### 1.1 이 도구가 답해야 할 질문

1. 1GW 데이터센터는 몇 년 만에 원금을 회수하는가? GPU 수명 안에 회수되는가?
2. 임대료 하락을 반영하면 그 답이 어떻게 바뀌는가?
3. 550조 원을 투자하면 상시 일자리가 몇 개 생기는가? 일자리 1개당 투자액은 얼마인가?
4. 발표된 고용 숫자는 실측 벤치마크와 몇 배 차이나는가? 그 차이를 설명하려면 승수가 얼마여야 하는가?
5. 18.4GW는 전력·용수·탄소·부지로 환산하면 얼마인가? 해당 지역이 감당 가능한 규모인가?
6. 지방자치단체는 세금을 얼마나 걷는가? 투자액 대비 몇 %인가?

### 1.2 비목표 (YAGNI)

- 몬테카를로 시뮬레이션 — 분포 가정의 근거가 없어 정밀도의 착시만 만든다.
- 그래프 렌더링 — 표와 ASCII 히트맵으로 충분하다. matplotlib 의존성을 만들지 않는다.
- 웹 UI, 데이터베이스, 실시간 데이터 연동.
- 반도체·피지컬AI 부문의 상세 모델링 — 메가프로젝트 총액 맥락으로만 등장한다.

---

## 2. 핵심 발견 (설계의 근거)

구현 전 원자료를 검산하며 확인한 사실들이다. 계산기는 이것들을 재현할 수 있어야 한다.

### 2.1 원보고서의 회수기간은 임대료 하락을 반영하지 않았다

보고서가 제시한 회수기간을 역산하면 공식이 드러난다:

```
낙관: 380억 ÷ (120억 − 9억 − 19.6억) = 4.16년   (보고서 4.13년)
비관: 470억 ÷ (120억 − 9억 − 28.0억) = 5.66년   (보고서 5.66년, 정확히 일치)
```

임대료가 일정하다고 가정한 flat 계산이다. 그런데 같은 보고서가 "3년 뒤 임대료 반토막"을 리스크로 지적한다.
둘을 합치면 (연 −23.5% 하락) 낙관 시나리오조차 5년 누적 회수액이 234억 달러로 원금 380억의 62%에 그친다.

**이 도구의 첫 번째 교육 포인트: 보고서가 자기 리스크를 자기 회수기간 계산에 넣지 않았다.**

### 2.2 부채비율 70%는 명시된 값이 아니라 역산값이다

보고서는 이자 금액(19.6억 / 28억 달러)만 제시하고 부채비율은 밝히지 않는다. 역산하면:

```
380억 × 0.70 × 7.0%  ≈ 18.6억   (보고서 19.6억, 금리 7.4% 시 일치)
380억 × 0.70 × 10.5% ≈ 27.9억   (보고서 28억, 일치)
```

부채비율 70%가 암묵적 가정이다. 파라미터로 노출하고 `[역산]` 태그를 단다.

### 2.2b 보고서의 비관 시나리오는 이자를 CAPEX와 다른 기준으로 계산했다

비관 시나리오 5.66년을 역산하면:

```
47 ÷ (12 − 0.9 − 2.8) = 5.663   ← 보고서 5.66년과 정확히 일치
```

그런데 이자 28억 달러는 **CAPEX 380억 기준**으로 계산된 값이다 (380 × 0.70 × 10.53% = 28.0).
CAPEX 470억에 같은 금리를 일관되게 적용하면 이자는 34.6억이 되고:

```
47 ÷ (12 − 0.9 − 3.46) = 6.16년
```

즉 **보고서의 비관 시나리오는 실제보다 0.5년 낙관적이다.** 도구는 재현 모드에서 보고서 값을,
일관 모드에서 6.16년을 함께 출력하고 차이를 설명한다.

이 때문에 `FinanceAssumptions`에 `interest_override_usd` 필드가 필요하다. 재현 전용 필드이며,
설정 시 이자를 `debt_ratio × interest_rate`로 계산하지 않고 주어진 값을 그대로 쓴다.

### 2.3 인건비 5% 가정은 실제 고용 데이터와 정합적이다

```
1GW OPEX 9억 달러 × 5% = 4,500만 달러 ÷ 1인당 15만 달러 ≈ 300명
실측: 100MW당 30~50명 → 1GW 환산 300~500명
```

보고서의 5%는 과소평가가 아니다. **데이터센터는 원래 사람을 거의 쓰지 않는 사업이다.**
이 정합성 검증 자체를 도구가 출력한다 — 서로 독립적인 두 출처가 같은 답을 가리키는 것은 강한 증거다.

### 2.4 SK 울산의 "7만 8천 명"은 상시 140명의 557배다

공식 발표는 상시 근무인력 140여 명, 건설 일자리 1,000여 명, 그리고 "7만 8천여 명의 고용창출 효과".
마지막 숫자는 간접·유발 효과를 포함한 것으로 보이나, 산업연관표 취업유발계수는 통상 직접고용의
2~3배 수준이다. 557배를 설명하려면 별도의 근거가 필요하다. 도구가 이 역산을 수행한다.

### 2.5 서버·GPU는 지방세 과세대상이 아니다

지방세법상 재산세 과세대상은 토지 · 건축물 · 주택 · 선박 · 항공기다. 서버와 GPU는 해당하지 않는다.
CAPEX의 55%(서버·GPU)가 과세표준에서 빠지고, 건물 30% + 토지분만 남는다.

**투자액이 아무리 커도 지방세수는 그 30% 남짓에만 붙는다.** 이 구조를 도구가 명시적으로 분해해 보여준다.

### 2.6 부동산 가격 영향은 통념과 반대 방향의 증거가 있다

미국 연구 두 건은 데이터센터 인근 주택가격이 하락하지 않았고, 버지니아에서는 오히려 더 높게 거래됐다고
보고한다. 반면 주민들은 소음 · 송전선로 · 전기요금 인상을 실제 비용으로 지목한다.

균형 잡힌 도구가 되려면 이 반증 데이터를 반드시 포함해야 한다. 가격은 중립~긍정, 생활환경은 부정이라는
비대칭을 그대로 보여준다.

---

## 3. 아키텍처

### 3.1 레이어 구조

계산은 아래에서 위로 흐른다. 각 레이어는 아래 레이어의 출력만 소비하고, 위 레이어를 알지 못한다.

```
        ┌──────────────────────────────┐
        │  report.py  (한국어 서술 출력)  │
        └──────────────┬───────────────┘
                       │
    ┌──────────────────┴──────────────────┐
    │      megaproject.py  (국가 집계)      │   8.4GW / 18.4GW 스케일업 + 지역 배분
    └──────────────────┬──────────────────┘
                       │
   ┌───────────┬───────┴────────┬──────────────┐
   │ finance   │  employment    │   regional   │   단위(1GW) 분석
   └───────────┴────────────────┴──────────────┘
                       │
        ┌──────────────┴───────────────┐
        │  assumptions.py + data/sources.py │   파라미터와 출처
        └──────────────────────────────┘
```

`sensitivity.py`는 위 어느 레이어의 함수든 감싸서 파라미터를 흔들 수 있는 범용 유틸리티다.

### 3.2 파일 구조

```
datacenter_calc/
  __init__.py
  assumptions.py       모든 파라미터를 담은 frozen dataclass들
  data/
    __init__.py
    sources.py         출처가 확인된 상수 + 출처 메타데이터
  finance.py           연도별 현금흐름, 회수기간, NPV, IRR
  employment.py        건설/상시 고용, 투자당 일자리, 발표치 검증
  regional.py          전력·용수·탄소·부지·소음·부동산·송전
  tax.py               지방세수 (법정 세율 기반 분해 계산)
  megaproject.py       8.4GW/18.4GW 집계 및 지역별 배분
  scenarios.py         프리셋 시나리오
  sensitivity.py       토네이도, 2D 그리드, 역산(bisection)
  report.py            한국어 서술형 리포트 렌더링
  formatting.py        숫자·통화·표 렌더링 헬퍼
  cli.py               argparse 진입점
  __main__.py

tests/
  test_finance.py      보고서 4.13년 / 5.66년 재현 골든테스트
  test_employment.py
  test_regional.py
  test_tax.py
  test_megaproject.py
  test_sensitivity.py
  test_sources.py      모든 상수가 출처 메타데이터를 갖는지 검사

docs/
  SOURCES.md           수치별 출처 대조표 (사람이 읽는 용도)
  superpowers/specs/   이 문서
README.md
```

**의존성: Python 3.10+ 표준 라이브러리만.** 설치 마찰이 없어야 교육 자료로 쓸 수 있다.

### 3.3 출처 추적 설계

모든 외부 수치는 `data/sources.py`에 `Figure` 객체로 저장한다.

```python
@dataclass(frozen=True)
class Figure:
    value: float
    unit: str
    label: str          # "1GW 데이터센터 상시 고용"
    kind: Kind          # MEASURED | ANNOUNCED | DERIVED | ESTIMATED
    source: str         # 발표 주체
    url: str
    date: str           # YYYY-MM
    note: str = ""
```

`kind`는 출력 시 태그로 찍힌다:

| kind | 태그 | 의미 |
|---|---|---|
| `MEASURED` | `[실측]` | 제3자가 관측·집계한 값 |
| `ANNOUNCED` | `[발표]` | 기업·정부가 발표한 값 (검증 대상) |
| `DERIVED` | `[역산]` | 공개된 다른 수치에서 계산해낸 값 |
| `ESTIMATED` | `[추정]` | 이 도구가 가정을 두고 만든 값 |

`test_sources.py`가 모든 상수에 유효한 `url`과 `date`가 있는지 검사한다.
출처 없는 숫자는 테스트가 막는다.

---

## 4. 레이어별 상세 설계

### 4.1 `assumptions.py` — 파라미터

`FinanceAssumptions`, `EmploymentAssumptions`, `RegionalAssumptions`, `TaxAssumptions` 네 개의
frozen dataclass. 각 필드는 기본값과 함께 출처 주석을 단다.

주요 재무 필드:

| 필드 | 기본값 | 출처 |
|---|---|---|
| `capex_usd` | 38e9 | 보고서 380억~470억 `[발표]` |
| `capex_split_server` / `_building` / `_other` | 0.55 / 0.30 / 0.15 | 보고서 `[발표]` |
| `opex_annual_usd` | 0.9e9 | 보고서 `[발표]` |
| `opex_split_power/tax/maint/labor/other` | 0.60/0.16/0.13/0.05/0.06 | 보고서 `[발표]` |
| `revenue_year1_usd` | 12e9 | 보고서 장기계약 기준 `[발표]` |
| `utilization` | 1.0 | 조정 파라미터 |
| `debt_ratio` | 0.70 | `[역산]` — §2.2 |
| `interest_rate` | 0.07 | 빅테크 5~7% / 네오클라우드 10~15% `[발표]` |
| `loan_type` | `interest_only` | 보고서 재현용 기본값. `amortizing` 선택 가능 |
| `rent_decline_annual` | 0.235 | $9/h → $4/h, 3년 `[역산]` |
| `gpu_life_years` | 5 | 보고서 3~5년 `[발표]` |
| `salvage_rate` | 0.0 | 보수적 기본값 `[추정]` |
| `discount_rate` | 0.08 | `[추정]` |
| `horizon_years` | 10 | |
| `opex_inflation` | 0.02 | `[추정]` |
| `commissioning_delay_years` | 0 | 송전망 지연 시나리오용 (§4.4) |

**중요:** `rent_decline_annual`의 기본값은 0.235지만, 보고서 수치 재현 시에는 0.0을 써야 한다.
`scenarios.py`의 `report_replication` 프리셋이 이를 0.0으로 고정한다.

### 4.2 `finance.py` — 재무

```python
def annual_cashflows(a: FinanceAssumptions) -> list[YearRow]
def summarize(rows: list[YearRow], a: FinanceAssumptions) -> FinanceSummary
```

`YearRow`: `year, revenue, opex, ebitda, interest, principal, net_cash, cumulative, debt_balance`

`FinanceSummary`: `payback_years (float | None), npv, irr (float | None),
recovery_ratio_at_gpu_eol, total_net_cash`

계산 규칙:

- `revenue_t = revenue_year1 × (1 − rent_decline)^(t−1) × utilization`
- `opex_t = opex_annual × (1 + opex_inflation)^(t−1)`
- `interest_t = debt_balance_{t−1} × interest_rate`
- `interest_only`: 원금 상환 없음, 분석기간 말에 잔액 존재 (보고서와 동일)
- `amortizing`: `gpu_life_years`에 걸쳐 원리금 균등
- 회수기간은 누적 현금흐름이 CAPEX를 처음 넘는 연도에서 **선형보간**하여 소수로 반환.
  분석기간 내 회수 실패 시 `None`.
- IRR은 이분법(bisection)으로 −0.99 ~ 10.0 구간에서 탐색. 부호 변화가 없으면 `None`.
- `recovery_ratio_at_gpu_eol` = GPU 수명 시점 누적 순현금 ÷ CAPEX. **이 도구의 핵심 지표.**

**에러 처리:** 음수 CAPEX, 1을 초과하는 비율, 합이 1이 아닌 split은 dataclass의
`__post_init__`에서 `ValueError`로 즉시 거부한다. 잘못된 입력으로 조용히 틀린 답을 내지 않는다.

### 4.3 `employment.py` — 고용

```python
def estimate_jobs(capacity_mw: float, capex_usd: float, a: EmploymentAssumptions) -> JobsResult
def verify_claim(claimed_jobs: float, capacity_mw: float, ...) -> ClaimVerdict
def labor_cost_crosscheck(opex_usd, labor_share, wage) -> CrossCheck
```

벤치마크 테이블(`sources.py`에 저장):

| 출처 | 상시 | 건설 | 비고 |
|---|---|---|---|
| 국내 100MW 하이퍼스케일 | 30~50명 | — | `[실측]` |
| 국내 200MW급 | ≤100명 | — | `[실측]` |
| PwC | 50~300명 | 1,000~10,000명 | `[실측]` |
| 해외 100MW 캠퍼스 | 100~200명 | 850명 (18개월) | `[실측]` |
| 스타게이트(텍사스) | 100명 | 1,500명 | `[발표]` |
| SK 울산 1GW 초기 | 140명 | 1,000명 | `[발표]` |
| 칠레 17개 시설 | 평균 90명/시설 | — | `[실측]` |
| 자동화 하이퍼스케일 | 20~30명/100MW | — | `[실측]` |
| 미 버지니아주 | 투자 5,400만 달러당 1명 | — | `[실측]` |

`JobsResult`는 **단일값이 아니라 범위**를 낸다: `permanent_low/mid/high`, `construction_low/mid/high`,
그리고 파생 지표 `jobs_per_trillion_krw`, `investment_per_job_krw`, `permanent_per_100mw`.

`verify_claim`은 발표치를 받아 다음을 계산한다:
- 실측 벤치마크 대비 배수
- 그 배수를 취업유발계수로 설명하려면 계수가 얼마여야 하는지
- 통상 취업유발계수 범위(직접고용의 2~3배)와의 격차

`labor_cost_crosscheck`는 §2.3의 교차검증을 수행한다 — OPEX 인건비 비중에서 역산한 인원과
실측 벤치마크가 겹치는지 보고한다.

### 4.4 `regional.py` — 지역 영향

```python
def power_impact(capacity_gw) -> PowerImpact       # 원전 기수 환산, 연간 TWh
def water_impact(capacity_gw, cooling: Cooling) -> WaterImpact
def carbon_impact(capacity_gw, grid_factor) -> CarbonImpact
def land_impact(capacity_gw) -> LandImpact         # 평/㎢, 농지 전용
def amenity_impact(capacity_gw) -> AmenityImpact   # 소음·열섬·건강비용
def grid_risk(capacity_gw) -> GridRisk             # 송전선로 갈등·지연
def property_effect() -> PropertyEffect            # 부동산 (양방향 증거)
```

`Cooling`은 `WATER_COOLED` | `AIR_COOLED` 열거형. **공랭식은 용수를 0으로 만드는 대신 전력을 늘린다** —
SK 울산이 공랭식 무용수를 표방하므로 이 트레이드오프를 명시적으로 모델링한다. `[추정]` 태그를 단다.

주요 상수:

| 항목 | 값 | 출처 kind |
|---|---|---|
| 18.4GW ≈ 원전 기수 | 10여 기 | `[발표]` |
| 용인 클러스터 용수 | 150만 톤/일 | `[발표]` |
| 서남권 용수 | 65만 톤/일 | `[발표]` |
| 영산강·섬진강 장래 부족량 | 36.8만 톤/일 | `[발표]` 환경부 |
| 전남 남서부 섬진강 의존도 | 70% | `[발표]` |
| 2035 누적 추가 탄소 | 8,500만 톤 (연 감축목표의 ~10%) | `[실측]` 환경단체 추산 |
| 1GW 필요 부지 | 최소 30만 평 | `[발표]` 정부 |
| 해남 실사례 | 3GW = 120만 평 → 40만 평/GW | `[발표]` |
| 주변 온도 상승 | 평균 +2℃, 최대 +9.11℃ | `[실측]` |
| 소음 | 97 dB | `[실측]` |
| 건강피해 비용 | 연 3,000만~9,900만 달러, 조기사망 3.4~6.5명 | `[실측]` |
| 수도권 집중 | DC 60%, 전력수요 70% | `[발표]` |
| 11차 송변전계획 지연 | 54개 중 30%+ (변전 25개 중 14개) | `[실측]` |
| 동해안~수도권 HVDC 지연 손실 | 연 3,000억 원 | `[추정]` |
| 부동산 가격 | 하락 근거 없음, 버지니아는 상승 | `[실측]` 미국 연구 |

`grid_risk`는 용량을 받아 필요 송전 인프라를 추산하고, 11차 계획의 실측 지연율을 적용해
**예상 지연 연수**를 낸다. 이 값은 자동으로 재무 레이어에 결합되지 않는다 — 레이어 간 의존을
만들지 않기 위해, 사용자가 `FinanceAssumptions.commissioning_delay_years` 파라미터에
직접 넣어 "가동이 2년 늦으면 회수기간이 어떻게 되는가"를 물어보는 방식이다.
재무 모델에서 이 지연은 1~N년차 매출을 0으로 만들고 이자는 계속 발생시킨다.

`land_impact`는 부지 면적을 축구장·여의도 면적으로 환산하고, 농지 전용 시나리오를 계산한다.
농지 전용은 지역 선택에 따라 달라지므로 `farmland_ratio` 파라미터(기본 `[추정]` 0.5)로 노출한다.

`property_effect`는 **양방향 증거를 모두 반환한다** — 가격 영향에 관한 미국 실증 연구 결과와,
주민이 실제 비용으로 지목하는 항목(소음·송전선로·전기요금)을 함께 낸다. 어느 쪽으로도 단정하지 않는다.

### 4.5 `tax.py` — 지방세수

국내 데이터센터의 실제 지방세 납부액은 공개 사례가 없다. 따라서 **법정 세율에서 직접 계산**하고
전체를 `[추정]`으로 표시한다. 계산 과정을 모두 노출해 사용자가 검증할 수 있게 한다.

```python
def local_tax(capex_usd, a: TaxAssumptions) -> TaxResult
```

과세표준 분해가 핵심이다:

```
CAPEX 100%
├─ 서버·GPU     55%  → 지방세 과세대상 아님 (지방세법상 재산세 대상은 토지·건축물·주택·선박·항공기)
├─ 건축물       30%  → 취득세 + 재산세 + 지역자원시설세 + 지방교육세 (전액 과세)
└─ 네트워크·기타 15%  → 파라미터 `other_taxable_ratio` (기본 [추정] 0.3) 만큼만 과세.
                       변전설비·배관 등 건축물에 부속되는 부분만 과세대상이 된다는 가정.
```

토지는 CAPEX에 별도 계상되지 않으므로, 부지 면적(`regional.land_impact`)과
`land_price_per_pyeong` 파라미터(기본 `[추정]`)로 별도 산출해 별도합산토지 재산세를 매긴다.

적용 세율 (`TaxAssumptions` 필드, 모두 조정 가능):

| 세목 | 세율 | 성격 |
|---|---|---|
| 취득세 | 4.0% | 일회성 |
| 재산세 (건축물) | 0.25% | 매년 |
| 재산세 (별도합산토지) | 0.2~0.4% | 매년 |
| 지역자원시설세 (특정부동산) | 0.04~0.12% | 매년 |
| 지방교육세 | 재산세의 20% | 매년 |

추가 파라미터: `taxable_base_ratio`(시가표준액/취득가액 비율, 기본 `[추정]` 0.7),
`acquisition_tax_exemption`(산업단지·기회발전특구 감면율, 기본 0.5),
`depreciation_rate`(건축물 과표 체감).

`TaxResult`는 일회성 세수와 연간 세수를 분리해 내고, **투자액 대비 세수 비율**과
**상시 일자리 1개당 세수**를 파생 지표로 낸다.

### 4.6 `megaproject.py` — 국가 단위 집계

```python
def megaproject_summary(target_year: int) -> MegaprojectSummary
def by_site() -> list[SiteSummary]
```

3대 메가프로젝트 상수:

| 항목 | 값 |
|---|---|
| 총 투자 (10년) | 1,500조 원 `[발표]` |
| AI 데이터센터 부문 | 약 550조 원 `[발표]` |
| 반도체 호남권 | 800조 원 (삼성 400 + SK하이닉스 400), 팹 4기 `[발표]` |
| 충청권 패키징 | 81조 원 `[발표]` |
| 영남권 | 약 300조 원 `[발표]` |
| 국고 지원 (반도체 인프라) | 20조 원 `[발표]` |
| DC 용량 2029 | 8.4 GW `[발표]` |
| DC 용량 2035 누적 | 18.4 GW `[발표]` |
| 현재(2024) | 2.0 GW, 325개소 `[발표]` |
| 국내 최대 DC 현재 | 100 MW `[발표]` |
| 메가프로젝트 전체 전력수요 | 약 24.7 GW `[발표]` |

입지별 배분:

| 지역 | 용량 | 사업자 |
|---|---|---|
| 울산 | 1.0 GW | SK `[발표]` |
| 전남·광주 | 1.0 GW | `[발표]` |
| 강원 동해안 | 2.4 GW | `[발표]` |
| (별도) 전남 | 3.0 GW / 50조 원 | `[발표]` |

집계 방식은 **단순 선형 스케일업**이다(1GW 결과 × N). 규모의 경제나 입지별 차이는 반영하지 않으며,
이 한계를 출력에 명시한다. 선형 가정은 보수적이지도 낙관적이지도 않은 중립 기준선이다.

### 4.7 `scenarios.py` — 프리셋

| 이름 | 설명 |
|---|---|
| `report_replication` | 보고서 수치 정확 재현 (하락률 0%, 가동률 100%) — 골든테스트용 |
| `semianalysis` | 세미애널리시스의 이상적 가정 (하락률 0, 가동률 100%) |
| `bigtech` | CAPEX 380억, 금리 7%, 하락률 0% |
| `bigtech_realistic` | 위 + 하락률 23.5%, 가동률 85% |
| `neocloud` | CAPEX 470억, 금리 10.5%, 하락률 0% |
| `neocloud_realistic` | 위 + 하락률 23.5%, 가동률 85% |
| `ulsan` / `honam` / `donghae` | 메가프로젝트 입지별 (용량·냉각방식·농지비율 반영) |

### 4.8 `sensitivity.py` — 민감도와 역산

```python
def tornado(base, params: list[str], delta=0.2, metric="payback_years") -> list[TornadoRow]
def grid_2d(base, x_param, y_param, x_vals, y_vals, metric) -> Grid2D
def solve_for(base, param: str, target_metric: str, target_value: float,
              lo: float, hi: float) -> float | None
```

- `tornado`: 각 파라미터를 ±20% 흔들어 지표 변화폭 순으로 정렬. 무엇이 결과를 지배하는지 보여준다.
- `grid_2d`: 2변수 격자를 ASCII 히트맵으로 렌더링 (금리 × 임대료 하락률 → 회수기간).
- `solve_for`: 이분법. "GPU 수명 5년 안에 회수하려면 임대료 하락률이 몇 % 이하여야 하나?"
  해가 구간 밖이면 `None`을 반환하고, 리포트는 "어떤 값으로도 달성 불가"로 서술한다.

### 4.9 `report.py` — 한국어 서술형 출력

교육 용도이므로 숫자만 던지지 않는다. 각 명령은 표와 함께 문장 설명을 낸다.

```
1년차 매출 120.0억 달러 [발표] 에서 OPEX 9.0억 달러 [발표] 와
이자 19.6억 달러 (부채비율 70% [역산] × 금리 7.0%) 를 빼면 순현금 91.4억 달러가 남습니다.
이 속도가 유지되면 CAPEX 380억 달러를 4.16년에 회수합니다.

그런데 임대료가 연 23.5% [역산] 씩 하락하면 3년차 순현금은 41.6억 달러로 줄어듭니다.
GPU 경제수명 5년 시점의 누적 회수액은 234억 달러 — 원금의 61.6%입니다.
```

렌더링은 `formatting.py`가 담당한다: 달러/원 환산(환율 파라미터), 억/조 단위 한국식 표기,
표 정렬, ASCII 히트맵.

### 4.10 `cli.py` — 명령어

```bash
python -m datacenter_calc compare                        # 재무 시나리오 비교표
python -m datacenter_calc explain --scenario neocloud_realistic
python -m datacenter_calc jobs --capacity-gw 1
python -m datacenter_calc verify-claim --claimed 78000 --capacity-gw 1
python -m datacenter_calc region --site ulsan
python -m datacenter_calc tax --capex 38e9
python -m datacenter_calc megaproject --year 2035
python -m datacenter_calc sensitivity --tornado
python -m datacenter_calc sensitivity --grid interest_rate rent_decline_annual
python -m datacenter_calc breakeven --solve rent_decline_annual --target-years 5
python -m datacenter_calc run --capex 42e9 --interest-rate 0.12 --csv out.csv
python -m datacenter_calc sources                        # 모든 수치의 출처 덤프
```

공통 옵션: `--scenario`, `--csv PATH`, `--krw` (원화 표기), `--no-narrative` (표만).
모든 `assumptions` 필드는 `--<kebab-case-name>` 플래그로 덮어쓸 수 있다.

---

## 5. 테스트 전략

TDD로 진행한다. 각 모듈은 테스트를 먼저 쓴다.

### 5.1 골든 테스트 (가장 중요)

`test_finance.py`가 보고서 수치를 재현하는지 검증한다. **이게 통과하지 않으면 나머지는 의미가 없다.**

```python
def test_report_replication_optimistic():
    # CAPEX 380억, 금리 7%, 부채비율 70%, 하락률 0
    assert summary.payback_years == pytest.approx(4.13, abs=0.06)

def test_report_replication_pessimistic():
    # CAPEX 470억, 금리 10.5%, 부채비율 70%, 하락률 0
    assert summary.payback_years == pytest.approx(5.66, abs=0.03)
```

### 5.2 그 외

- `test_finance.py`: 선형보간 정확성, 회수 실패 시 `None`, IRR 부호 변화 없을 때 `None`,
  `amortizing` 시 잔액 0 수렴, 잘못된 입력이 `ValueError`를 내는지.
- `test_employment.py`: §2.3 교차검증이 300~500명 구간에서 겹친다고 보고하는지,
  `verify_claim(78000, 1GW)`가 557배 근처를 내는지.
- `test_tax.py`: 과세표준에서 서버·GPU 55%가 제외되는지, 감면율 0/1 경계.
- `test_regional.py`: 공랭 선택 시 용수 0 · 전력 증가, 18.4GW가 원전 10기 근처로 환산되는지.
- `test_megaproject.py`: 8.4GW 집계가 1GW 결과의 8.4배인지 (선형성 명시).
- `test_sensitivity.py`: `solve_for`가 해 없는 구간에서 `None`, 알려진 해를 찾는지.
- `test_sources.py`: 모든 `Figure`가 비어있지 않은 `url`·`date`·`kind`를 갖는지.

`pytest`는 개발 의존성이며, 패키지 실행에는 필요 없다.

---

## 6. 이 도구의 한계 (README와 출력에 명시)

정직하게 밝히지 않으면 교육 도구가 아니라 선전 도구가 된다.

1. **선형 스케일업 가정** — 8.4GW를 1GW의 8.4배로 계산한다. 규모의 경제, 입지별 전력·용지 비용 차이,
   동시 건설로 인한 자재·인력 단가 상승을 반영하지 않는다.
2. **원보고서 수치가 검증되지 않았다** — CAPEX 380~470억 달러, 매출 120억 달러는 원보고서의 주장이며
   1차 자료로 확인하지 않았다. 모든 재무 결과는 이 입력에 의존한다.
3. **지방세수는 전부 추정이다** — 국내 실납부 사례가 공개되지 않아 법정 세율에서 계산했다.
   실제로는 감면 협약, 시가표준액 산정 방식, 지자체별 탄력세율에 따라 크게 달라진다.
4. **고용 벤치마크는 해외 사례가 다수** — 국내 1GW급 데이터센터의 완전 가동 실적이 아직 없다.
5. **환경·건강 비용은 해외 연구 기반** — 국내 기후·인구밀도·전력믹스에 그대로 적용되지 않을 수 있다.
6. **정치적 판단을 하지 않는다** — 이 도구는 3대 메가프로젝트의 찬반을 계산하지 않는다.
   투입과 산출을 분해해 보여줄 뿐이다.

---

## 7. 구현 순서

1. `data/sources.py` + `test_sources.py` — 모든 수치를 출처와 함께 먼저 고정
2. `assumptions.py` — 검증 로직 포함
3. `finance.py` + 골든 테스트 — **여기서 4.13년/5.66년이 재현되어야 다음으로 진행**
4. `formatting.py`
5. `employment.py`
6. `tax.py`
7. `regional.py`
8. `megaproject.py`
9. `scenarios.py`
10. `sensitivity.py`
11. `report.py`
12. `cli.py` + `__main__.py`
13. `README.md`, `docs/SOURCES.md`

각 단계는 테스트 통과를 완료 기준으로 한다.
