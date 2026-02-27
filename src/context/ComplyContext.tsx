import { createContext, useContext, useState } from 'react';
import { checklistTemplates, initialInspectionRuns, complianceCategories, complianceDocuments } from '../data/complyData';
import type { ChecklistTemplate, InspectionRun, ComplianceCategory, ComplianceDocument, ItemResponse } from '../types';

interface ComplyContextType {
  categories: ComplianceCategory[];
  templates: ChecklistTemplate[];
  inspections: InspectionRun[];
  documents: ComplianceDocument[];
  startInspection: (runId: string) => void;
  completeInspection: (runId: string, responses: Record<string, ItemResponse>, signature?: string) => void;
  createAdHocRun: (templateId: string, assigneeId: string, assigneeName: string) => string;
  addTemplate: (t: ChecklistTemplate) => void;
  addDocument: (doc: ComplianceDocument) => void;
  deleteTemplate: (id: string) => void;
  deleteDocument: (id: string) => void;
}

const ComplyContext = createContext<ComplyContextType | null>(null);

export function ComplyProvider({ children }: { children: React.ReactNode }) {
  const [inspections, setInspections] = useState<InspectionRun[]>(initialInspectionRuns);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>(checklistTemplates);
  const [documents, setDocuments] = useState<ComplianceDocument[]>(complianceDocuments);

  const startInspection = (runId: string) => {
    setInspections(prev => prev.map(r =>
      r.id === runId ? { ...r, status: 'in_progress', startedAt: new Date() } : r
    ));
  };

  const completeInspection = (runId: string, responses: Record<string, ItemResponse>, signature?: string) => {
    setInspections(prev => prev.map(r => {
      if (r.id !== runId) return r;
      // score = pass+yes items / non-NA answered items × 100
      const tpl = templates.find(t => t.id === r.templateId);
      if (!tpl) return { ...r, status: 'completed' as const, completedAt: new Date(), responses, signature, score: 100 };
      const allItems = tpl.sections.flatMap(s => s.items);
      const nonNa = allItems.filter(i => responses[i.id]?.value != null && responses[i.id]?.value !== 'na');
      const pass = nonNa.filter(i => responses[i.id]?.value === 'pass' || responses[i.id]?.value === 'yes').length;
      const score = nonNa.length > 0 ? Math.round((pass / nonNa.length) * 100) : 100;
      return { ...r, status: 'completed' as const, completedAt: new Date(), responses, signature, score };
    }));
  };

  const addTemplate = (t: ChecklistTemplate) => setTemplates(prev => [...prev, t]);
  const addDocument = (doc: ComplianceDocument) => setDocuments(prev => [doc, ...prev]);
  const deleteTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id));
  const deleteDocument = (id: string) => setDocuments(prev => prev.filter(d => d.id !== id));

  const createAdHocRun = (templateId: string, assigneeId: string, assigneeName: string): string => {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return '';
    const id = `run-adhoc-${Date.now()}`;
    const run: InspectionRun = {
      id,
      templateId,
      templateName: tpl.name,
      categoryId: tpl.categoryId,
      scheduledAt: new Date(),
      status: 'in_progress',
      startedAt: new Date(),
      assigneeId,
      assigneeName,
      responses: {},
    };
    setInspections(prev => [run, ...prev]);
    return id;
  };

  return (
    <ComplyContext.Provider value={{
      categories: complianceCategories,
      templates,
      inspections,
      documents,
      startInspection,
      completeInspection,
      createAdHocRun,
      addTemplate,
      addDocument,
      deleteTemplate,
      deleteDocument,
    }}>
      {children}
    </ComplyContext.Provider>
  );
}

export function useComply() {
  const ctx = useContext(ComplyContext);
  if (!ctx) throw new Error('useComply must be used within ComplyProvider');
  return ctx;
}
