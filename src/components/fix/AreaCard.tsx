import { Home, ChevronRight } from 'lucide-react';
import type { Area } from '../../types';
import StatusDots from '../ui/StatusDots';

interface AreaCardProps {
  area: Area;
  onClick: () => void;
}

export default function AreaCard({ area, onClick }: AreaCardProps) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Home size={18} className="text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{area.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{area.description}</p>
        </div>
        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
      </div>
      <div className="mt-3">
        <StatusDots counts={area.counts} />
      </div>
    </div>
  );
}
