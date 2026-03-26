// ─── Korean Field Name Mapping ───
const FIELD_MAP: Record<string, string> = {
  // Top level
  summary: '정책 요약',
  feasibility: '실현 가능성',
  timeframe: '효과 발현 기간',
  projectedGrade: '예상 등급',
  currentGrade: '현재 등급',
  currentScore: '현재 점수',
  recommendation: '종합 평가',
  similarCases: '유사 사례',
  isFallback: '규칙 기반 분석',
  // fiscalImpact
  fiscalImpact: '재정 영향',
  revenue: '세수 영향',
  expenditure: '지출 영향',
  netEffect: '순 재정효과',
  independenceChange: '재정자립도 변화(%p)',
  debtChange: '채무 변화(억원)',
  // costBreakdown
  costBreakdown: '상세 비용',
  items: '비용 항목',
  totalInitialCost: '초기 투자 총액',
  annualOperatingCost: '연간 운영비',
  category: '항목',
  amount: '금액',
  note: '산출 근거',
  // socialImpact
  socialImpact: '사회적 영향',
  populationEffect: '인구 영향',
  migrationRate: '이주율 변화',
  serviceAccessibility: '서비스 접근성',
  qualityOfLife: '삶의 질',
  employmentEffect: '고용 효과',
  // caseComparison
  caseComparison: '사례 비교',
  bestCase: '성공 사례',
  worstCase: '부진 사례',
  lesson: '시사점',
  name: '명칭',
  region: '지역',
  description: '설명',
  keyMetrics: '핵심 지표',
  // scaleAnalysis
  scaleAnalysis: '규모 분석',
  recommendedScale: '추천 규모',
  constructionCostPerUnit: '단위 건설비',
  staffingRequirement: '필요 인력',
  breakEvenPoint: '손익분기점',
  annualPatientCapacity: '연간 이용 가능 인원',
  // strategicAnalysis
  strategicAnalysis: '전략 분석',
  deficitAnalysis: '적자 분석',
  structuralCauses: '구조적 원인',
  operationalCauses: '운영적 원인',
  deficitProjection: '적자 전망',
  governmentSupport: '중앙정부 지원',
  constructionSupport: '건설비 지원',
  operatingSupport: '운영비 지원',
  subsidyPrograms: '보조금 사업',
  localBurden: '지자체 부담',
  selfSustainability: '자립 경영',
  revenueStrategy: '수익 전략',
  costOptimization: '비용 최적화',
  partnershipModel: '민관협력 모델',
  managementGoals: '경영 목표',
  alternatives: '대안 정책',
  title: '제목',
  costComparison: '비용 비교',
  effectiveness: '효과성',
  // locationAnalysis
  locationAnalysis: '입지 분석',
  recommendedLocations: '추천 입지',
  selectionCriteria: '선정 기준',
  accessibilityNote: '교통 접근성',
  medicalDesertAreas: '서비스 취약 지역',
  overallRecommendation: '종합 추천',
  rank: '순위',
  score: '점수',
  population: '인구',
  reasoning: '추천 이유',
  strengths: '강점',
  challenges: '과제',
  distanceToNearest: '최근접 시설 거리',
  landCostEstimate: '토지 비용',
  // regionData
  regionData: '지역 데이터',
  budget: '예산(억원)',
  independence: '재정자립도(%)',
  autonomy: '재정자주도(%)',
  debt: '채무(억원)',
  grade: '등급',
  // pros/cons
  pros: '장점',
  cons: '리스크',
};

function translateKey(key: string): string {
  return FIELD_MAP[key] || key;
}

// ─── CSV Download ───
export function downloadAsCSV(data: Record<string, unknown>, filename: string) {
  const rows: string[][] = [['항목', '값']];
  function flatten(obj: Record<string, unknown>, prefix = '') {
    for (const [key, val] of Object.entries(obj)) {
      const kr = translateKey(key);
      const label = prefix ? `${prefix} > ${kr}` : kr;
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        flatten(val as Record<string, unknown>, label);
      } else if (Array.isArray(val)) {
        val.forEach((item, i) => {
          if (typeof item === 'object') {
            flatten(item as Record<string, unknown>, `${label}[${i + 1}]`);
          } else {
            rows.push([`${label}[${i + 1}]`, String(item)]);
          }
        });
      } else {
        rows.push([label, String(val ?? '')]);
      }
    }
  }
  flatten(data);
  const bom = '\uFEFF';
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── JSON Download ───
export function downloadAsJSON(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Structured PDF Report ───
export function downloadAsPDF(data: Record<string, unknown>, filename: string) {
  const d = data as Record<string, unknown>;
  const regionData = d.regionData as Record<string, unknown> | undefined;
  const fiscalImpact = d.fiscalImpact as Record<string, unknown> | undefined;
  const costBreakdown = d.costBreakdown as Record<string, unknown> | undefined;
  const socialImpact = d.socialImpact as Record<string, unknown> | undefined;
  const caseComparison = d.caseComparison as Record<string, unknown> | undefined;
  const scaleAnalysis = d.scaleAnalysis as Record<string, unknown> | undefined;
  const strategicAnalysis = d.strategicAnalysis as Record<string, unknown> | undefined;
  const costItems = (costBreakdown?.items as Array<Record<string, string>>) || [];
  const pros = (d.pros as string[]) || [];
  const cons = (d.cons as string[]) || [];
  const alternatives = (strategicAnalysis?.alternatives as Array<Record<string, string>>) || [];

  const regionName = String(d['지역'] || regionData?.name || '');
  const policyName = String(d['정책'] || '');
  const analysisDate = String(d['분석일시'] || new Date().toLocaleDateString('ko-KR'));
  const isFallback = d.isFallback === true;

  // Build sections
  const sections: string[] = [];

  // 1. Header
  sections.push(`
    <div style="text-align:center;margin-bottom:30px">
      <h1 style="font-size:22px;color:#1e40af;margin:0">정책 시뮬레이션 보고서</h1>
      <p style="color:#666;font-size:14px;margin:6px 0">${regionName} | ${policyName}</p>
      <p style="color:#999;font-size:12px">${analysisDate} | ${isFallback ? '규칙 기반 분석 (표준단가 기반)' : 'AI 분석 (Gemini)'}</p>
    </div>
  `);

  // 2. Summary
  if (d.summary) {
    sections.push(sectionBox('정책 요약', String(d.summary)));
  }

  // 3. Key metrics row
  sections.push(`
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr>
        <td style="width:25%;text-align:center;padding:12px;border:1px solid #ddd;background:#f0f9ff">
          <div style="font-size:11px;color:#666">실현 가능성</div>
          <div style="font-size:22px;font-weight:700;color:${d.feasibility === '상' ? '#16a34a' : d.feasibility === '하' ? '#dc2626' : '#d97706'}">${d.feasibility || '-'}</div>
        </td>
        <td style="width:25%;text-align:center;padding:12px;border:1px solid #ddd;background:#f0f9ff">
          <div style="font-size:11px;color:#666">효과 발현</div>
          <div style="font-size:14px;font-weight:600">${d.timeframe || '-'}</div>
        </td>
        <td style="width:25%;text-align:center;padding:12px;border:1px solid #ddd;background:#f0f9ff">
          <div style="font-size:11px;color:#666">현재 등급 → 예상</div>
          <div style="font-size:14px;font-weight:600">${d.currentGrade || '-'} → ${d.projectedGrade || '-'}</div>
        </td>
        <td style="width:25%;text-align:center;padding:12px;border:1px solid #ddd;background:#f0f9ff">
          <div style="font-size:11px;color:#666">현재 점수</div>
          <div style="font-size:14px;font-weight:600">${d.currentScore || '-'}/100</div>
        </td>
      </tr>
    </table>
  `);

  // 4. Fiscal Impact
  if (fiscalImpact) {
    sections.push(sectionTitle('재정 영향 분석'));
    sections.push(kvTable([
      ['순 재정효과', String(fiscalImpact.netEffect || '-')],
      ['재정자립도 변화', `${fiscalImpact.independenceChange || 0}%p`],
      ['채무 변화', `${fiscalImpact.debtChange || 0}억원`],
      ['세수 영향', String(fiscalImpact.revenue || '-')],
      ['지출 영향', String(fiscalImpact.expenditure || '-')],
    ]));
  }

  // 5. Cost Breakdown
  if (costItems.length > 0) {
    sections.push(sectionTitle('상세 비용 분석'));
    const costRows = costItems.map(item =>
      `<tr><td style="padding:8px;border:1px solid #ddd">${item.category || ''}</td><td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:600">${item.amount || ''}</td><td style="padding:8px;border:1px solid #ddd;font-size:12px;color:#666">${item.note || ''}</td></tr>`
    ).join('');
    sections.push(`
      <table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:13px">
        <tr style="background:#1e40af;color:white"><th style="padding:8px;text-align:left">항목</th><th style="padding:8px;text-align:right">금액</th><th style="padding:8px;text-align:left">산출 근거</th></tr>
        ${costRows}
        <tr style="background:#f0f9ff;font-weight:700"><td style="padding:8px;border:1px solid #ddd">초기 투자 총액</td><td style="padding:8px;border:1px solid #ddd;text-align:right;color:#1e40af">${costBreakdown?.totalInitialCost || '-'}</td><td style="padding:8px;border:1px solid #ddd"></td></tr>
        <tr style="background:#f0f9ff;font-weight:700"><td style="padding:8px;border:1px solid #ddd">연간 운영비</td><td style="padding:8px;border:1px solid #ddd;text-align:right;color:#d97706">${costBreakdown?.annualOperatingCost || '-'}</td><td style="padding:8px;border:1px solid #ddd"></td></tr>
      </table>
    `);
  }

  // 6. Social Impact
  if (socialImpact) {
    sections.push(sectionTitle('사회적 영향'));
    sections.push(kvTable([
      ['인구 영향', String(socialImpact.populationEffect || '-')],
      ['이주율 변화', String(socialImpact.migrationRate || '-')],
      ['서비스 접근성', String(socialImpact.serviceAccessibility || '-')],
      ['삶의 질', String(socialImpact.qualityOfLife || '-')],
      ['고용 효과', String(socialImpact.employmentEffect || '-')],
    ]));
  }

  // 7. Scale Analysis
  if (scaleAnalysis) {
    sections.push(sectionTitle('규모 분석'));
    sections.push(kvTable([
      ['추천 규모', String(scaleAnalysis.recommendedScale || '-')],
      ['단위 건설비', String(scaleAnalysis.constructionCostPerUnit || '-')],
      ['필요 인력', String(scaleAnalysis.staffingRequirement || '-')],
      ['손익분기점', String(scaleAnalysis.breakEvenPoint || '-')],
      ['연간 이용 가능', String(scaleAnalysis.annualPatientCapacity || '-')],
    ]));
  }

  // 8. Case Comparison
  if (caseComparison) {
    const best = caseComparison.bestCase as Record<string, string> | undefined;
    const worst = caseComparison.worstCase as Record<string, string> | undefined;
    sections.push(sectionTitle('사례 비교'));
    if (best) {
      sections.push(`<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:12px;margin:6px 0">
        <div style="font-weight:700;color:#16a34a">성공 사례: ${best.name || ''} (${best.region || ''})</div>
        <div style="font-size:13px;margin:4px 0">${best.description || ''}</div>
        <div style="font-size:12px;color:#666">${best.keyMetrics || ''}</div>
      </div>`);
    }
    if (worst) {
      sections.push(`<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:12px;margin:6px 0">
        <div style="font-weight:700;color:#dc2626">부진 사례: ${worst.name || ''} (${worst.region || ''})</div>
        <div style="font-size:13px;margin:4px 0">${worst.description || ''}</div>
        <div style="font-size:12px;color:#666">${worst.keyMetrics || ''}</div>
      </div>`);
    }
    if (caseComparison.lesson) {
      sections.push(`<p style="font-size:13px;color:#444;margin:8px 0"><b>시사점:</b> ${caseComparison.lesson}</p>`);
    }
  }

  // 9. Strategic Analysis
  if (strategicAnalysis) {
    const deficit = strategicAnalysis.deficitAnalysis as Record<string, string> | undefined;
    const govt = strategicAnalysis.governmentSupport as Record<string, string> | undefined;
    const self = strategicAnalysis.selfSustainability as Record<string, string> | undefined;

    if (deficit) {
      sections.push(sectionTitle('적자 구조 분석'));
      sections.push(kvTable([
        ['구조적 원인', deficit.structuralCauses || '-'],
        ['운영적 원인', deficit.operationalCauses || '-'],
        ['적자 전망', deficit.deficitProjection || '-'],
      ]));
    }

    if (govt) {
      sections.push(sectionTitle('중앙정부 지원 분석'));
      sections.push(kvTable([
        ['건설비 지원', govt.constructionSupport || '-'],
        ['운영비 지원', govt.operatingSupport || '-'],
        ['활용 가능 보조금', govt.subsidyPrograms || '-'],
        ['지자체 실질 부담', govt.localBurden || '-'],
      ]));
    }

    if (self) {
      sections.push(sectionTitle('자립 경영 전략'));
      sections.push(kvTable([
        ['수익 전략', self.revenueStrategy || '-'],
        ['비용 최적화', self.costOptimization || '-'],
        ['민관협력 모델', self.partnershipModel || '-'],
        ['경영 목표', self.managementGoals || '-'],
      ]));
    }

    if (alternatives.length > 0) {
      sections.push(sectionTitle('대안 정책'));
      const altRows = alternatives.map((alt, i) =>
        `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:600">${i + 1}. ${alt.title || ''}</td><td style="padding:8px;border:1px solid #ddd;font-size:13px">${alt.description || ''}</td><td style="padding:8px;border:1px solid #ddd;font-size:13px">${alt.costComparison || ''}</td><td style="padding:8px;border:1px solid #ddd;font-size:13px">${alt.effectiveness || ''}</td></tr>`
      ).join('');
      sections.push(`
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin:8px 0">
          <tr style="background:#1e40af;color:white"><th style="padding:8px">대안</th><th style="padding:8px">설명</th><th style="padding:8px">비용 비교</th><th style="padding:8px">효과성</th></tr>
          ${altRows}
        </table>
      `);
    }
  }

  // 10. Pros & Cons
  if (pros.length > 0 || cons.length > 0) {
    sections.push(sectionTitle('장점 및 리스크'));
    sections.push(`<table style="width:100%;border-collapse:collapse;margin:8px 0"><tr>
      <td style="width:50%;vertical-align:top;padding:8px;border:1px solid #ddd">
        <div style="font-weight:700;color:#16a34a;margin-bottom:6px">장점</div>
        ${pros.map(p => `<div style="font-size:13px;margin:3px 0">+ ${p}</div>`).join('')}
      </td>
      <td style="width:50%;vertical-align:top;padding:8px;border:1px solid #ddd">
        <div style="font-weight:700;color:#dc2626;margin-bottom:6px">리스크</div>
        ${cons.map(c => `<div style="font-size:13px;margin:3px 0">- ${c}</div>`).join('')}
      </td>
    </tr></table>`);
  }

  // 11. Recommendation
  if (d.recommendation) {
    sections.push(sectionBox('종합 평가', String(d.recommendation)));
  }

  // 12. Region Data
  if (regionData) {
    sections.push(sectionTitle('지역 기초 데이터'));
    sections.push(kvTable([
      ['지역명', String(regionData.name || '-')],
      ['예산 규모', `${regionData.budget || 0}억원`],
      ['재정자립도', `${regionData.independence || 0}%`],
      ['재정자주도', `${regionData.autonomy || 0}%`],
      ['지역채무', `${regionData.debt || 0}억원`],
      ['건전성 등급', `${regionData.grade || '-'} (${regionData.score || 0}점)`],
    ]));
  }

  // Assemble final HTML
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title><style>
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 15mm; } }
    body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; padding: 30px; color: #222; max-width: 900px; margin: 0 auto; line-height: 1.6; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 11px; color: #999; text-align: center; }
  </style></head><body>
    ${sections.join('')}
    <div class="footer">
      마을살림/나라살림 (budget.ai.kr) | AI 정책진단 시뮬레이션 보고서<br>
      본 보고서는 ${isFallback ? 'NABO/KDI 표준단가 기반 규칙 분석' : 'Gemini AI 분석'} 결과이며, 실제 정책 수립 시 전문가 검토가 필요합니다.
    </div>
    <script>window.onload=function(){window.print();}</script>
  </body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ─── Helper Functions ───
function sectionTitle(title: string): string {
  return `<h2 style="font-size:16px;color:#1e40af;border-left:4px solid #1e40af;padding-left:10px;margin:24px 0 8px">${title}</h2>`;
}

function sectionBox(title: string, content: string): string {
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:12px 0">
    <div style="font-size:12px;color:#64748b;font-weight:600;margin-bottom:6px">${title}</div>
    <div style="font-size:14px;line-height:1.7">${content}</div>
  </div>`;
}

function kvTable(rows: Array<[string, string]>): string {
  const trs = rows.map(([k, v]) =>
    `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;width:180px;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${v}</td></tr>`
  ).join('');
  return `<table style="width:100%;border-collapse:collapse;font-size:13px;margin:6px 0">${trs}</table>`;
}
