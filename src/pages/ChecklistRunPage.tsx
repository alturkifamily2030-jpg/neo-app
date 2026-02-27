import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Wifi, AlertCircle, ChevronDown, ChevronUp,
  Camera, StickyNote, CheckCircle2, PenLine, CheckCircle,
  XCircle, MinusCircle, Flag, Hash,
} from 'lucide-react';
import { format } from 'date-fns';
import { useComply } from '../context/ComplyContext';
import type { ItemResponse, ChecklistItem } from '../types';

// ── Response display helpers ─────────────────────────────────
const responseDisplay: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  yes:  { label: 'Yes',  cls: 'bg-green-100 text-green-700',  icon: <CheckCircle size={13} /> },
  no:   { label: 'No',   cls: 'bg-red-100 text-red-700',      icon: <XCircle size={13} /> },
  pass: { label: 'Pass', cls: 'bg-green-100 text-green-700',  icon: <CheckCircle size={13} /> },
  flag: { label: 'Flag', cls: 'bg-yellow-100 text-yellow-700',icon: <Flag size={13} /> },
  fail: { label: 'Fail', cls: 'bg-red-100 text-red-700',      icon: <XCircle size={13} /> },
  na:   { label: 'N/A',  cls: 'bg-gray-100 text-gray-500',    icon: <MinusCircle size={13} /> },
};

export default function ChecklistRunPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { templates, inspections, categories, startInspection, completeInspection } = useComply();

  const run = inspections.find(r => r.id === id);
  const tpl = run ? templates.find(t => t.id === run.templateId) : undefined;
  const cat = run ? categories.find(c => c.id === run.categoryId) : undefined;

  const isCompleted = run?.status === 'completed';

  // responses keyed by item id
  const [responses, setResponses] = useState<Record<string, ItemResponse>>(() => run?.responses ?? {});
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [signature, setSignature] = useState('');
  const [sigMode, setSigMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const sigRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (run && run.status === 'scheduled') {
      startInspection(run.id);
    }
    if (tpl) {
      const openAll: Record<string, boolean> = {};
      tpl.sections.forEach(s => { openAll[s.id] = true; });
      setOpenSections(openAll);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!run || !tpl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
        <AlertCircle size={40} className="mb-3 text-gray-300" />
        <p>Inspection not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 text-sm hover:underline">Back</button>
      </div>
    );
  }

  const allItems     = tpl.sections.flatMap(s => s.items);
  const mandatoryItems = allItems.filter(i => i.mandatory);
  const answeredCount  = allItems.filter(i => responses[i.id]?.value != null).length;
  const mandatoryDone  = mandatoryItems.every(i => responses[i.id]?.value != null);
  const progress       = allItems.length > 0 ? Math.round((answeredCount / allItems.length) * 100) : 0;
  const canSubmit      = mandatoryDone && (!tpl.requiresSignature || signature.trim().length > 0);

  const setResponse = (itemId: string, value: string | null) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: { value, notes: prev[itemId]?.notes ?? '', photos: prev[itemId]?.photos ?? [] },
    }));
  };

  const setNotes = (itemId: string, notes: string) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: { value: prev[itemId]?.value ?? null, notes, photos: prev[itemId]?.photos ?? [] },
    }));
  };

  const handleSubmit = () => {
    completeInspection(run.id, responses, signature || undefined);
    setSubmitted(true);
  };

  // ── Submitted success screen ──────────────────────────────
  if (submitted) {
    const nonNaItems = allItems.filter(i => responses[i.id]?.value != null && responses[i.id]?.value !== 'na');
    const passItems = nonNaItems.filter(i => responses[i.id]?.value === 'pass' || responses[i.id]?.value === 'yes');
    const score = nonNaItems.length > 0 ? Math.round((passItems.length / nonNaItems.length) * 100) : 100;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Inspection Complete!</h2>
        <p className="text-gray-500 text-sm mb-6">{tpl.name}</p>
        <div className="bg-gray-50 rounded-2xl px-8 py-4 mb-8 flex gap-8">
          <div className="text-center">
            <p className={`text-3xl font-bold ${score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{score}%</p>
            <p className="text-xs text-gray-400 mt-1">Score</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-800">{answeredCount}/{allItems.length}</p>
            <p className="text-xs text-gray-400 mt-1">Items</p>
          </div>
        </div>
        <button onClick={() => navigate('/comply')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium">
          Back to Comply
        </button>
      </div>
    );
  }

  // ── Completed read-only result view ───────────────────────
  if (isCompleted) {
    const score = run.score ?? 0;
    const completedResponses = run.responses;
    const failCount = Object.values(completedResponses).filter(r => r.value === 'fail' || r.value === 'no').length;
    const flagCount = Object.values(completedResponses).filter(r => r.value === 'flag').length;

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ChevronLeft size={20} />
            </button>
            <span className="text-xl flex-shrink-0">{cat?.icon}</span>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 truncate">{tpl.name}</h1>
              <p className="text-xs text-gray-400">
                {run.assigneeName} · {run.completedAt ? format(run.completedAt, 'MMM d, yyyy HH:mm') : ''}
              </p>
            </div>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${score >= 90 ? 'bg-green-100 text-green-700' : score >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              {score}%
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* Score summary */}
          <div className="p-4 space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Inspection Summary</h3>
                <CheckCircle2 size={18} className="text-green-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Score',      value: `${score}%`,      cls: score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600' },
                  { label: 'Issues',     value: failCount,         cls: failCount > 0 ? 'text-red-600' : 'text-gray-700' },
                  { label: 'Flagged',    value: flagCount,         cls: flagCount > 0 ? 'text-yellow-600' : 'text-gray-700' },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <p className={`text-xl font-bold ${stat.cls}`}>{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
              {/* Score bar */}
              <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${score >= 90 ? 'bg-green-500' : score >= 70 ? 'bg-yellow-400' : 'bg-red-500'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {/* Issues summary */}
            {(failCount + flagCount) > 0 && (
              <div className="bg-white rounded-xl border border-red-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={15} className="text-red-500" />
                  <h3 className="text-sm font-semibold text-red-700">Issues Found ({failCount + flagCount})</h3>
                </div>
                <div className="space-y-2">
                  {tpl.sections.flatMap(section =>
                    section.items
                      .filter(item => {
                        const v = completedResponses[item.id]?.value;
                        return v === 'fail' || v === 'no' || v === 'flag';
                      })
                      .map(item => {
                        const v = completedResponses[item.id]!.value!;
                        const isFail = v === 'fail' || v === 'no';
                        return (
                          <div key={item.id} className={`flex items-start gap-2.5 px-3 py-2 rounded-lg ${isFail ? 'bg-red-50' : 'bg-yellow-50'}`}>
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isFail ? 'bg-red-500' : 'bg-yellow-400'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 leading-snug">{item.label}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">{section.title}</p>
                              {completedResponses[item.id]?.notes && (
                                <p className="text-[11px] text-gray-500 italic mt-0.5">📝 {completedResponses[item.id].notes}</p>
                              )}
                            </div>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isFail ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                              {v === 'flag' ? 'Flagged' : 'Failed'}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}

            {/* Sections with responses */}
            {tpl.sections.map(section => {
              const sectionOpen = openSections[section.id] !== false;
              const sectionFails = section.items.filter(i => {
                const v = completedResponses[i.id]?.value;
                return v === 'fail' || v === 'no';
              }).length;
              const sectionFlags = section.items.filter(i => completedResponses[i.id]?.value === 'flag').length;

              return (
                <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    onClick={() => setOpenSections(prev => ({ ...prev, [section.id]: !sectionOpen }))}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">{section.title}</span>
                      {sectionFails > 0 && (
                        <span className="text-[11px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                          {sectionFails} fail
                        </span>
                      )}
                      {sectionFlags > 0 && (
                        <span className="text-[11px] bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded-full font-medium">
                          {sectionFlags} flagged
                        </span>
                      )}
                    </div>
                    {sectionOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>

                  {sectionOpen && (
                    <div className="divide-y divide-gray-100">
                      {section.items.map(item => {
                        const resp = completedResponses[item.id];
                        const disp = resp?.value ? responseDisplay[resp.value] : null;
                        const isIssue = resp?.value === 'fail' || resp?.value === 'no';

                        return (
                          <div key={item.id} className={`px-4 py-3 ${isIssue ? 'border-l-2 border-red-400 bg-red-50/30' : ''}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 leading-snug">{item.label}</p>
                                {item.helpText && <p className="text-xs text-gray-400 mt-0.5">{item.helpText}</p>}
                                {resp?.notes && (
                                  <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1 mt-1.5 italic">
                                    📝 {resp.notes}
                                  </p>
                                )}
                              </div>
                              {disp ? (
                                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${disp.cls}`}>
                                  {disp.icon} {disp.label}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300 flex-shrink-0">—</span>
                              )}
                            </div>
                            {/* Text/number response */}
                            {(item.responseType === 'text' || item.responseType === 'number') && resp?.value && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Hash size={12} className="text-gray-400" />
                                <span className="text-sm text-gray-700 font-medium">{resp.value}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Signature */}
            {run.signature && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PenLine size={15} className="text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Signature</span>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-center">
                  <p className="font-semibold text-gray-700 italic text-lg" style={{ fontFamily: 'cursive' }}>{run.signature}</p>
                  <p className="text-[11px] text-gray-400 mt-1">Electronic signature · {run.assigneeName}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/comply')}
              className="w-full border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Back to Comply
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active inspection form ────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl flex-shrink-0">{cat?.icon}</span>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 truncate">{tpl.name}</h1>
              <p className="text-xs text-gray-400">{cat?.name} · {allItems.length} items · ~{tpl.estimatedMinutes} min</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-blue-600">{progress}%</p>
            <p className="text-[11px] text-gray-400">{answeredCount}/{allItems.length}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="flex-1 overflow-y-auto">
        {tpl.sections.map(section => {
          const sectionOpen = openSections[section.id] !== false;
          const sectionDone = section.items.filter(i => responses[i.id]?.value != null).length;
          return (
            <div key={section.id} className="border-b border-gray-100">
              {/* Section header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                onClick={() => setOpenSections(prev => ({ ...prev, [section.id]: !sectionOpen }))}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">{section.title}</span>
                  <span className="text-xs text-gray-400">({sectionDone}/{section.items.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  {sectionDone === section.items.length && (
                    <CheckCircle2 size={16} className="text-green-500" />
                  )}
                  {sectionOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {/* Items */}
              {sectionOpen && (
                <div className="divide-y divide-gray-100">
                  {section.items.map(item => (
                    <ChecklistItemRow
                      key={item.id}
                      item={item}
                      response={responses[item.id]}
                      notesOpen={!!openNotes[item.id]}
                      onToggleNotes={() => setOpenNotes(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      onResponse={value => setResponse(item.id, value)}
                      onNotes={notes => setNotes(item.id, notes)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Signature ── */}
        {tpl.requiresSignature && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <PenLine size={16} className="text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Signature Required</span>
              <span className="text-xs text-red-500">*</span>
            </div>
            {sigMode ? (
              <div className="space-y-2">
                <input
                  ref={sigRef}
                  type="text"
                  placeholder="Type your full name to sign"
                  value={signature}
                  onChange={e => setSignature(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {signature.trim() && (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-center">
                    <p className="font-semibold text-gray-700 italic text-lg" style={{ fontFamily: 'cursive' }}>{signature}</p>
                    <p className="text-[11px] text-gray-400 mt-1">Electronic signature</p>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => { setSigMode(true); setTimeout(() => sigRef.current?.focus(), 50); }}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                <PenLine size={24} />
                <span className="text-sm">Tap to sign</span>
              </button>
            )}
          </div>
        )}

        {/* ── Submit ── */}
        <div className="p-4 pb-8">
          {!mandatoryDone && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
              <AlertCircle size={14} />
              Complete all mandatory items (marked with *) before submitting.
            </p>
          )}
          {tpl.requiresSignature && !signature.trim() && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
              <AlertCircle size={14} />
              A signature is required before submitting.
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Submit Inspection
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Checklist item row ────────────────────────────────────────
function ChecklistItemRow({ item, response, notesOpen, onToggleNotes, onResponse, onNotes }: {
  item: ChecklistItem;
  response?: ItemResponse;
  notesOpen: boolean;
  onToggleNotes: () => void;
  onResponse: (value: string | null) => void;
  onNotes: (notes: string) => void;
}) {
  const hasValue = response?.value != null;
  const failed = response?.value === 'fail' || response?.value === 'no';

  return (
    <div className={`px-4 py-3 ${failed ? 'border-l-2 border-red-400 bg-red-50/30' : 'bg-white'}`}>
      {/* Label row */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1.5">
            <p className="text-sm text-gray-800 leading-snug">{item.label}</p>
            {item.mandatory && <span className="text-red-500 text-xs flex-shrink-0 mt-0.5">*</span>}
          </div>
          {item.helpText && <p className="text-xs text-gray-400 mt-0.5">{item.helpText}</p>}
          <div className="flex items-center gap-2 mt-1">
            {item.nfcEnabled && (
              <span className="flex items-center gap-1 text-[11px] text-blue-500">
                <Wifi size={11} /> NFC
              </span>
            )}
          </div>
        </div>
        {hasValue && <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />}
      </div>

      {/* Response buttons */}
      {item.responseType === 'yes_no' && (
        <div className="flex gap-2">
          {(['yes', 'no'] as const).map(v => (
            <button
              key={v}
              onClick={() => onResponse(response?.value === v ? null : v)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                response?.value === v
                  ? v === 'yes' ? 'bg-green-500 border-green-500 text-white' : 'bg-red-500 border-red-500 text-white'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {v === 'yes' ? '✓ Yes' : '✗ No'}
            </button>
          ))}
        </div>
      )}

      {item.responseType === 'pass_flag_fail_na' && (
        <div className="grid grid-cols-4 gap-1.5">
          {([
            { v: 'pass', label: 'Pass', cls: 'bg-green-500 border-green-500 text-white', idle: 'border-gray-200 text-gray-500 hover:bg-green-50' },
            { v: 'flag', label: 'Flag', cls: 'bg-yellow-400 border-yellow-400 text-white', idle: 'border-gray-200 text-gray-500 hover:bg-yellow-50' },
            { v: 'fail', label: 'Fail', cls: 'bg-red-500 border-red-500 text-white',   idle: 'border-gray-200 text-gray-500 hover:bg-red-50'   },
            { v: 'na',   label: 'N/A',  cls: 'bg-gray-400 border-gray-400 text-white',  idle: 'border-gray-200 text-gray-400 hover:bg-gray-50'  },
          ]).map(opt => (
            <button
              key={opt.v}
              onClick={() => onResponse(response?.value === opt.v ? null : opt.v)}
              className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${response?.value === opt.v ? opt.cls : opt.idle}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {item.responseType === 'text' && (
        <input
          type="text"
          placeholder="Enter response…"
          value={response?.value ?? ''}
          onChange={e => onResponse(e.target.value || null)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      {item.responseType === 'number' && (
        <input
          type="number"
          placeholder="0"
          value={response?.value ?? ''}
          onChange={e => onResponse(e.target.value || null)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      {/* Notes & Photo row */}
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={onToggleNotes}
          className={`flex items-center gap-1 text-[11px] transition-colors ${notesOpen || response?.notes ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <StickyNote size={12} />
          {response?.notes ? 'Edit note' : 'Add note'}
        </button>
        <button className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
          <Camera size={12} />
          Photo
        </button>
        {(response?.value === 'fail' || response?.value === 'flag') ? (
          <span className="text-[11px] text-amber-600 ml-auto">⚠ Add corrective note</span>
        ) : null}
      </div>

      {notesOpen && (
        <textarea
          className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Add a note for this item…"
          value={response?.notes ?? ''}
          onChange={e => onNotes(e.target.value)}
        />
      )}
    </div>
  );
}
