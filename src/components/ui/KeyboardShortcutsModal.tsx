import { X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPad|iPhone/.test(navigator.userAgent);
const mod = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS = [
  {
    category: 'Navigation',
    items: [
      { keys: ['G', 'F'], desc: 'Go to Fix' },
      { keys: ['G', 'P'], desc: 'Go to Plan' },
      { keys: ['G', 'A'], desc: 'Go to Assets' },
      { keys: ['G', 'C'], desc: 'Go to Comply' },
      { keys: ['G', 'D'], desc: 'Go to Dashboard' },
    ],
  },
  {
    category: 'Actions',
    items: [
      { keys: [mod, 'N'], desc: 'Create new task' },
      { keys: [mod, 'K'], desc: 'Focus search' },
      { keys: [mod, '/'], desc: 'Show keyboard shortcuts' },
      { keys: ['Escape'], desc: 'Close modal / menu' },
    ],
  },
];

export default function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {SHORTCUTS.map(section => (
            <div key={section.category}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                {section.category}
              </p>
              <div className="space-y-2.5">
                {section.items.map(item => (
                  <div key={item.desc} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-gray-300 text-xs mx-0.5">+</span>}
                          <kbd className="px-2 py-0.5 text-xs font-medium bg-gray-100 border border-gray-200 rounded-md text-gray-700 font-mono">
                            {k}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400 text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded font-mono">{mod}</kbd>
            <kbd className="px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded font-mono ml-1">/</kbd> anytime to show this dialog
          </p>
        </div>
      </div>
    </div>
  );
}
