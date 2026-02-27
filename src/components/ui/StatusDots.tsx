import type { StatusCounts } from '../../types';

interface StatusDotsProps {
  counts: StatusCounts;
  size?: 'sm' | 'md';
}

export default function StatusDots({ counts, size = 'sm' }: StatusDotsProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={`flex items-center gap-2 ${textSize} text-gray-600`}>
      <span className="flex items-center gap-0.5">
        <span className={`${dotSize} rounded-full bg-red-500 inline-block`}></span>
        <span>{counts.red}</span>
      </span>
      <span className="flex items-center gap-0.5">
        <span className={`${dotSize} rounded-full bg-yellow-400 inline-block`}></span>
        <span>{counts.yellow}</span>
      </span>
      <span className="flex items-center gap-0.5">
        <span className={`${dotSize} rounded-full bg-green-500 inline-block`}></span>
        <span>{counts.green}</span>
      </span>
    </div>
  );
}
