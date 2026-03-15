import { NextRequest, NextResponse } from 'next/server';
import type { DepartmentId } from '@/lib/data/ai-efficiency-data';
import {
  NTS_DATA, NTS_SOURCES, NTS_ASSUMPTIONS,
  PPS_DATA, PPS_SOURCES, PPS_ASSUMPTIONS,
  MOHW_DATA, MOHW_SOURCES, MOHW_ASSUMPTIONS,
  NHIS_DATA, NHIS_SOURCES, NHIS_ASSUMPTIONS,
  MOLIT_DATA, MOLIT_SOURCES, MOLIT_ASSUMPTIONS,
  MOE_DATA, MOE_SOURCES, MOE_ASSUMPTIONS,
  COURT_DATA, COURT_SOURCES, COURT_ASSUMPTIONS,
} from '@/lib/data/ai-efficiency-data';

// 부처별 컨텍스트 생성
function getDepartmentContext(departmentId: DepartmentId): string {
  const contexts: Record<DepartmentId, () => string> = {
    nts: () => `부처: ${NTS_DATA.name} (${NTS_DATA.nameEn})
주요 데이터: 국세 수입 ${NTS_DATA.nationalTaxRevenue}조원, 세수 Gap ${NTS_DATA.taxGap}조원, 조사 인력 ${NTS_DATA.auditStaff}명, 조사 비율 ${NTS_DATA.auditCoverage}%, 탐지율 ${NTS_DATA.currentDetectionRate}%
출처: ${NTS_SOURCES.join(', ')}
주요 가정: ${NTS_ASSUMPTIONS.join('; ')}`,

    pps: () => `부처: ${PPS_DATA.name} (${PPS_DATA.nameEn})
주요 데이터: 조달시장 ${PPS_DATA.procurementMarket}조원, 평균 낙찰률 ${PPS_DATA.avgBidRate}%, 담합 적발 ${PPS_DATA.collusionCases}건/년, 소요일 ${PPS_DATA.processTime}일, 비효율률 ${PPS_DATA.currentWasteRate}%
출처: ${PPS_SOURCES.join(', ')}
주요 가정: ${PPS_ASSUMPTIONS.join('; ')}`,

    mohw: () => `부처: ${MOHW_DATA.name} (${MOHW_DATA.nameEn})
주요 데이터: 수급자 ${MOHW_DATA.welfareRecipients}만명, 사각지대 ${MOHW_DATA.blindSpotHouseholds}만가구, 예산 ${MOHW_DATA.welfareBudget}조원, 부정수급 ${MOHW_DATA.fraudAmount}조원, 상담 ${MOHW_DATA.counselingCases}만건/년
출처: ${MOHW_SOURCES.join(', ')}
주요 가정: ${MOHW_ASSUMPTIONS.join('; ')}`,

    nhis: () => `부처: ${NHIS_DATA.name} (${NHIS_DATA.nameEn})
주요 데이터: 총 지출 ${NHIS_DATA.totalHealthSpending}조원, 부당청구 ${NHIS_DATA.fraudEstimate}조원, 심사 ${NHIS_DATA.annualReviewCases}억건, 심사인력 ${NHIS_DATA.reviewStaff}명, 오류율 ${NHIS_DATA.currentErrorRate}%
출처: ${NHIS_SOURCES.join(', ')}
주요 가정: ${NHIS_ASSUMPTIONS.join('; ')}`,

    molit: () => `부처: ${MOLIT_DATA.name} (${MOLIT_DATA.nameEn})
주요 데이터: 혼잡비용 ${MOLIT_DATA.congestionCost}조원, 대중교통 이용률 ${MOLIT_DATA.publicTransitRate}%, 유지보수 ${MOLIT_DATA.infraMaintenanceCost}조원, 스마트시티 ${MOLIT_DATA.smartCityCurrent}/${MOLIT_DATA.totalCities}개
출처: ${MOLIT_SOURCES.join(', ')}
주요 가정: ${MOLIT_ASSUMPTIONS.join('; ')}`,

    moe: () => `부처: ${MOE_DATA.name} (${MOE_DATA.nameEn})
주요 데이터: 학생 ${MOE_DATA.totalStudents}만명, 교원 ${MOE_DATA.totalTeachers}만명, 교육예산 ${MOE_DATA.educationBudget}조원, 사교육비 ${MOE_DATA.privateTutoringCost}조원, 미달률 ${MOE_DATA.underperformingRate}%, 행정비율 ${MOE_DATA.teacherAdminRatio}%
출처: ${MOE_SOURCES.join(', ')}
주요 가정: ${MOE_ASSUMPTIONS.join('; ')}`,

    court: () => `부처: ${COURT_DATA.name} (${COURT_DATA.nameEn})
주요 데이터: 연간 접수 ${COURT_DATA.annualCases}만건, 법관 ${COURT_DATA.judges}명, 직원 ${COURT_DATA.courtStaff}명, 예산 ${COURT_DATA.courtBudget}조원, 재판기간 ${COURT_DATA.avgTrialMonths}개월, 미결 ${COURT_DATA.pendingCases}만건
출처: ${COURT_SOURCES.join(', ')}
주요 가정: ${COURT_ASSUMPTIONS.join('; ')}`,
  };

  return contexts[departmentId]?.() ?? '';
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API 키가 설정되지 않았습니다.' },
      { status: 503 }
    );
  }

  try {
    const { question, departmentId } = await request.json();

    if (!question || !departmentId) {
      return NextResponse.json(
        { error: '질문과 부처 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const context = getDepartmentContext(departmentId);

    const systemPrompt = `당신은 한국 정부 AI 효율화 분석 전문가입니다. 아래 부처 데이터를 기반으로 질문에 답변하세요.
답변은 한국어로, 간결하게(3~5문장), 구체적 수치를 포함하여 작성하세요.
데이터에 없는 내용은 추정이라고 명시하세요.

${context}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: question }] }],
          generationConfig: { maxOutputTokens: 500 },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Gemini API error:', response.status, errBody);
      let detail = '';
      try {
        const errJson = JSON.parse(errBody);
        detail = errJson.error?.message || errBody.slice(0, 200);
      } catch {
        detail = errBody.slice(0, 200);
      }
      return NextResponse.json(
        { error: `AI 답변 생성에 실패했습니다. (${response.status}: ${detail})` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '답변을 생성하지 못했습니다.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
