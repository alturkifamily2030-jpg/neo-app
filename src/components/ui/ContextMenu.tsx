import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => onClose();
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Keep menu inside viewport
  const itemCount = items.filter(i => !i.separator).length;
  const menuHeight = itemCount * 36 + items.filter(i => i.separator).length * 9 + 8;
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y;

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-xl shadow-2xl z-[9999] w-48 py-1 overflow-hidden"
      style={{ left: adjustedX, top: adjustedY }}
      onMouseDown={e => e.stopPropagation()}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={`sep-${i}`} className="h-px bg-gray-100 my-1" />
        ) : (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose(); }}
            className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors
              ${item.danger
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-700 hover:bg-gray-50'}`}
          >
            {item.icon && (
              <span className={`flex-shrink-0 ${item.danger ? 'text-red-500' : 'text-gray-400'}`}>
                {item.icon}
              </span>
            )}
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
