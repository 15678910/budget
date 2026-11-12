import type { FundRuleInput, FundRuleResult } from '@/lib/basic-income/types';
import { fmtJo, fmtWon } from './format';

const TH = 'py-2 pr-3 font-medium';
const TD = 'py-2 pr-3';

const won = (n: number | null): string => (n === null ? '기간 밖' : fmtWon(n));
const jo = (n: number | null, nominal: boolean): string => (n === null ? '기간 밖' : `${fmtJo(n)}${nominal ? '(명목)' : ''}`);

/** 같은 돈을 정부안·노르웨이·칠레 규칙에 따로 넣은 결과(평소 + 위기 시험) */
export function FundRuleTable({ rows, input }: { rows: FundRuleResult[]; input: FundRuleInput }) {
  const { aiUnemployment, mortgage } = input.crisisYears;
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">
        {input.baseYear}년 미래대응기금 {fmtJo(input.seed)}과, 그 뒤 해마다 새로 생기는 초과 세수 {fmtJo(input.annualInflow)}을 세
        규칙에 따로 넣고 {input.years}년을 계산했다. 1인당 액수는 그해 전 국민에게 나눈 값이다. 정부안 잔액은 공자기금 예탁 명목
        원금이고, 노르웨이·칠레 잔액은 실질(2027년 가격)이다.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr className="border-b border-gray-800">
              <th className={TH}>규칙</th>
              <th className={TH}>첫해 1인당</th>
              <th className={TH}>10년째 1인당</th>
              <th className={TH}>30년째 1인당</th>
              <th className={TH}>{input.years}년 누적 지급</th>
              <th className={TH}>10년 뒤 잔액</th>
              <th className="py-2 font-medium">30년 뒤 잔액</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-gray-900 align-top">
                <td className={`${TD} text-gray-200`}>
                  <span className="font-medium">{r.label}</span>
                  <span className="mt-1 block text-xs text-gray-500">{r.rule}</span>
                  {r.generalAccountInterestTotal > 0 && (
                    <span className="mt-1 block text-xs text-gray-500">
                      예탁 이자 {fmtJo(r.generalAccountInterestTotal)}(명목, 누적)은 일반회계로 가서 이 표의 지급에 넣지 않았다
                    </span>
                  )}
                </td>
                <td className={TD}>{fmtWon(r.perPersonWon.first)}</td>
                <td className={TD}>{won(r.perPersonWon.y10)}</td>
                <td className={TD}>{won(r.perPersonWon.y30)}</td>
                <td className={TD}>{fmtJo(r.paidTotal)}</td>
                <td className={TD}>{jo(r.balanceAt10, r.nominal)}</td>
                <td className="py-2">{jo(r.balanceAt30, r.nominal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="text-sm font-semibold text-gray-200">위기 시험: 그해 1인당 꺼내 줄 수 있는 돈</h4>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr className="border-b border-gray-800">
              <th className={TH}>규칙</th>
              <th className={TH}>주택담보대출 부실({mortgage}년)</th>
              <th className={TH}>AI 실업 확대({aiUnemployment}년)</th>
              <th className="py-2 font-medium">위기 대응</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-gray-900 align-top">
                <td className={`${TD} text-gray-200`}>{r.label}</td>
                <td className={TD}>{won(r.crisisPerPersonWon.mortgage)}</td>
                <td className={TD}>{won(r.crisisPerPersonWon.aiUnemployment)}</td>
                <td className="py-2 text-xs text-gray-400">{r.crisisNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">
        위기 연도와 칠레 규칙의 인출 상한은 예시 가정이다(예측 아님). 기금 수익률·인출률·인구는 위 설정을 그대로 쓴다. 초과 세수는
        정부 정의(내국세 추세선 초과분)다. 첫해 몫은 이미 미래대응기금 {fmtJo(input.seed)}에 들어 있어 둘째 해부터 새로 생기는
        몫만 더했다.
      </p>
    </div>
  );
}
