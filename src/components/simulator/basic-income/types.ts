import type { SimInput, SourceKey } from '@/lib/basic-income/types';

/** 하위 컴포넌트가 입력 일부를 바꿀 때 쓰는 함수 */
export type InputPatch = (patch: Partial<SimInput>) => void;

export interface InputPanelProps {
  input: SimInput;
  onChange: InputPatch;
}

export interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  unit?: string;
  /** 화면 값 = 저장 값 × scale (비율을 %로 보일 때 100) */
  scale?: number;
  step?: number;
  min?: number;
  max?: number;
  /** 기본값의 종류 배지를 붙일 출처 키 */
  sourceKey?: SourceKey;
}
