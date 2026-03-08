"use client";

import { useVotes, VoteType } from '@/hooks/useVotes';
import { cn } from '@/lib/utils/format';

interface VoteButtonsProps {
  itemId: string;
}

interface ButtonConfig {
  type: VoteType;
  label: string;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
  icon: React.ReactNode;
}

function PlusIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx={12} cy={12} r={10} />
      <line x1={12} y1={7} x2={12} y2={17} />
      <line x1={7} y1={12} x2={17} y2={12} />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx={12} cy={12} r={10} />
      <text
        x={12}
        y={16}
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
        stroke="none"
        fill="currentColor"
        fontFamily="sans-serif"
      >
        ?
      </text>
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx={12} cy={12} r={10} />
      <line x1={7} y1={12} x2={17} y2={12} />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx={12} cy={12} r={10} />
      <line x1={8} y1={8} x2={16} y2={16} />
      <line x1={16} y1={8} x2={8} y2={16} />
    </svg>
  );
}

const BUTTON_CONFIGS: ButtonConfig[] = [
  {
    type: 'add',
    label: '희망 추가',
    activeColor: 'text-white',
    activeBg: 'bg-blue-500',
    activeBorder: 'border-blue-500',
    icon: <PlusIcon />,
  },
  {
    type: 'confused',
    label: '이해 불가',
    activeColor: 'text-white',
    activeBg: 'bg-amber-400',
    activeBorder: 'border-amber-400',
    icon: <QuestionIcon />,
  },
  {
    type: 'reduce',
    label: '감소 건의',
    activeColor: 'text-white',
    activeBg: 'bg-orange-500',
    activeBorder: 'border-orange-500',
    icon: <MinusIcon />,
  },
  {
    type: 'remove',
    label: '삭제 요청',
    activeColor: 'text-white',
    activeBg: 'bg-red-500',
    activeBorder: 'border-red-500',
    icon: <XIcon />,
  },
];

export function VoteButtons({ itemId }: VoteButtonsProps) {
  const { castVote, getVoteData } = useVotes();
  const voteData = getVoteData(itemId);

  return (
    <div className="grid grid-cols-4 gap-2">
      {BUTTON_CONFIGS.map(({ type, label, activeColor, activeBg, activeBorder, icon }) => {
        const isActive = voteData.vote === type;
        const count = voteData.counts[type] ?? 0;

        return (
          <button
            key={type}
            onClick={() => castVote(itemId, type)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors cursor-pointer text-xs',
              isActive
                ? cn(activeBg, activeBorder, activeColor)
                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            <span className={cn(isActive ? activeColor : 'text-gray-400')}>
              {icon}
            </span>
            <span className="font-medium">{count}명</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
