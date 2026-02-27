import type { ComplianceCategory, ChecklistTemplate, InspectionRun, ComplianceDocument } from '../types';

export const complianceCategories: ComplianceCategory[] = [
  { id: 'fire',        name: 'Fire Safety',             icon: '🔥', color: '#ef4444', description: 'Fire walks, equipment checks, escape route inspections' },
  { id: 'hs',          name: 'Health & Safety',          icon: '🏥', color: '#f59e0b', description: 'General H&S inspections and risk assessments' },
  { id: 'hygiene',     name: 'Hygiene',                  icon: '🧼', color: '#10b981', description: 'Food hygiene, kitchen cleanliness, HACCP compliance' },
  { id: 'env',         name: 'Environmental',            icon: '🌿', color: '#14b8a6', description: 'Air & water quality, legionella, waste management' },
  { id: 'permits',     name: 'Licenses & Permits',       icon: '📋', color: '#8b5cf6', description: 'Operating licenses, permits, warranties, insurance' },
  { id: 'training',    name: 'Staff Training',           icon: '👥', color: '#3b82f6', description: 'Training records, certifications, induction logs' },
  { id: 'contractors', name: 'Contractors',              icon: '🏗️', color: '#f97316', description: 'Contractor qualifications, insurance, site inductions' },
  { id: 'access',      name: 'Accessibility',            icon: '♿', color: '#6b7280', description: 'Accessibility standards, lift checks, signage' },
];

export const checklistTemplates: ChecklistTemplate[] = [
  {
    id: 'tpl-fire-daily',
    name: 'Daily Fire Walk',
    categoryId: 'fire',
    description: 'Daily inspection of fire escape routes, extinguishers, and emergency lighting',
    frequency: 'daily',
    requiresSignature: true,
    estimatedMinutes: 15,
    sections: [
      {
        id: 's1', title: 'Escape Routes',
        items: [
          { id: 'i1', label: 'All fire exits clear and unobstructed',           responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
          { id: 'i2', label: 'Emergency exit signs illuminated',                 responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
          { id: 'i3', label: 'Fire doors close fully and latch securely',        responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
          { id: 'i4', label: 'Stairways clear of obstructions',                  responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
        ],
      },
      {
        id: 's2', title: 'Fire Equipment',
        items: [
          { id: 'i5', label: 'Fire extinguishers in place and visible',          responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: true  },
          { id: 'i6', label: 'Fire hose reel operational and accessible',        responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: false },
          { id: 'i7', label: 'Fire alarm call points unobstructed',              responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
          { id: 'i8', label: 'Sprinkler heads clear (no obstruction within 18")',responseType: 'yes_no',           mandatory: false, nfcEnabled: false },
        ],
      },
      {
        id: 's3', title: 'Emergency Lighting',
        items: [
          { id: 'i9',  label: 'Emergency lighting operational in all zones',     responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: false },
          { id: 'i10', label: 'Battery backup lights functioning',               responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
        ],
      },
    ],
  },
  {
    id: 'tpl-fire-weekly',
    name: 'Weekly Fire Alarm Test',
    categoryId: 'fire',
    description: 'Weekly test of fire alarm system zones and call points',
    frequency: 'weekly',
    requiresSignature: true,
    estimatedMinutes: 30,
    sections: [
      {
        id: 's1', title: 'Alarm System',
        items: [
          { id: 'i1', label: 'Fire alarm panel shows no faults',                 responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
          { id: 'i2', label: 'Zone tested this week',                            responseType: 'text',   mandatory: true,  nfcEnabled: false, helpText: 'Enter zone number tested' },
          { id: 'i3', label: 'All sounders audible throughout building',          responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
          { id: 'i4', label: 'Alarm acknowledged and reset correctly',            responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
        ],
      },
      {
        id: 's2', title: 'Log & Documentation',
        items: [
          { id: 'i5', label: 'Test recorded in fire log book',                   responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
          { id: 'i6', label: 'Any defects reported to maintenance',              responseType: 'yes_no', mandatory: false, nfcEnabled: false },
        ],
      },
    ],
  },
  {
    id: 'tpl-hygiene-kitchen',
    name: 'Kitchen Hygiene Inspection',
    categoryId: 'hygiene',
    description: 'Daily kitchen hygiene check covering surfaces, equipment, and food storage',
    frequency: 'daily',
    requiresSignature: true,
    estimatedMinutes: 20,
    sections: [
      {
        id: 's1', title: 'Food Storage',
        items: [
          { id: 'i1', label: 'Fridge temperatures within safe range (1–4 °C)',         responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: false },
          { id: 'i2', label: 'Freezer temperatures within safe range (−18 °C or below)',responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: false },
          { id: 'i3', label: 'All food items properly labelled and dated',              responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
          { id: 'i4', label: 'No expired or spoiled food products',                    responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
          { id: 'i5', label: 'Raw and cooked foods stored separately',                 responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
        ],
      },
      {
        id: 's2', title: 'Surfaces & Equipment',
        items: [
          { id: 'i6', label: 'Food contact surfaces clean and sanitised',              responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: false },
          { id: 'i7', label: 'Cooking equipment clean and serviceable',                responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: false },
          { id: 'i8', label: 'Chopping boards colour-coded and in good condition',     responseType: 'yes_no',           mandatory: false, nfcEnabled: false },
          { id: 'i9', label: 'Extraction fans and filters clean',                      responseType: 'pass_flag_fail_na', mandatory: false, nfcEnabled: false },
        ],
      },
      {
        id: 's3', title: 'Staff & Hygiene',
        items: [
          { id: 'i10', label: 'Staff wearing clean uniforms and PPE',                  responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
          { id: 'i11', label: 'Handwashing facilities stocked and accessible',         responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
          { id: 'i12', label: 'No evidence of pests',                                  responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
        ],
      },
    ],
  },
  {
    id: 'tpl-hs-monthly',
    name: 'Monthly H&S Inspection',
    categoryId: 'hs',
    description: 'Comprehensive monthly health and safety walkthrough of all areas',
    frequency: 'monthly',
    requiresSignature: true,
    estimatedMinutes: 45,
    sections: [
      {
        id: 's1', title: 'General Safety',
        items: [
          { id: 'i1', label: 'First aid kits stocked and accessible',             responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: false },
          { id: 'i2', label: 'First aiders list current and displayed',            responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
          { id: 'i3', label: 'Safety signage visible and legible',                 responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
          { id: 'i4', label: 'Slip/trip hazards identified and addressed',         responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: false },
        ],
      },
      {
        id: 's2', title: 'Equipment & Machinery',
        items: [
          { id: 'i5', label: 'PAT testing certificates up to date',               responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: false },
          { id: 'i6', label: 'Machinery guards in place and functional',           responseType: 'yes_no',           mandatory: false, nfcEnabled: false },
          { id: 'i7', label: 'Ladders and step equipment inspected',              responseType: 'pass_flag_fail_na', mandatory: false, nfcEnabled: false },
        ],
      },
      {
        id: 's3', title: 'Documentation',
        items: [
          { id: 'i8',  label: 'Risk assessments current and reviewed',            responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
          { id: 'i9',  label: 'Accident/incident log up to date',                 responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
          { id: 'i10', label: 'COSHH assessments in place for all chemicals',     responseType: 'yes_no', mandatory: false, nfcEnabled: false },
        ],
      },
    ],
  },
  {
    id: 'tpl-env-legionella',
    name: 'Legionella Water Temperature Check',
    categoryId: 'env',
    description: 'Monthly temperature monitoring of hot and cold water outlets to prevent Legionella growth',
    frequency: 'monthly',
    requiresSignature: false,
    estimatedMinutes: 30,
    sections: [
      {
        id: 's1', title: 'Hot Water Outlets',
        items: [
          { id: 'i1', label: 'Hot water at outlet reaches 50 °C within 1 min',   responseType: 'pass_flag_fail_na', mandatory: true, nfcEnabled: true,  helpText: 'Record temperature in notes' },
          { id: 'i2', label: 'Calorifier temperature ≥ 60 °C',                   responseType: 'pass_flag_fail_na', mandatory: true, nfcEnabled: false },
          { id: 'i3', label: 'Thermostatic mixing valve (TMV) checked',           responseType: 'yes_no',           mandatory: false, nfcEnabled: false },
        ],
      },
      {
        id: 's2', title: 'Cold Water Outlets',
        items: [
          { id: 'i4', label: 'Cold water at outlet ≤ 20 °C',                     responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: true  },
          { id: 'i5', label: 'Cold water tank temperature ≤ 20 °C',              responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: false },
          { id: 'i6', label: 'Unused outlets flushed weekly',                     responseType: 'yes_no',           mandatory: false, nfcEnabled: false },
        ],
      },
    ],
  },
  {
    id: 'tpl-training-induction',
    name: 'New Staff Induction Checklist',
    categoryId: 'training',
    description: 'Confirms all induction topics covered for new team members before they start work',
    frequency: 'once',
    requiresSignature: true,
    estimatedMinutes: 60,
    sections: [
      {
        id: 's1', title: 'Safety Briefing',
        items: [
          { id: 'i1', label: 'Fire evacuation procedure explained',               responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
          { id: 'i2', label: 'Muster points identified',                          responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
          { id: 'i3', label: 'First aid and emergency contacts provided',         responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
          { id: 'i4', label: 'PPE requirements explained',                        responseType: 'yes_no', mandatory: false, nfcEnabled: false },
        ],
      },
      {
        id: 's2', title: 'Policies & Procedures',
        items: [
          { id: 'i5', label: 'Health & Safety policy reviewed',                   responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
          { id: 'i6', label: 'GDPR and data handling policy acknowledged',        responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
          { id: 'i7', label: 'Uniform and grooming standards confirmed',          responseType: 'yes_no', mandatory: false, nfcEnabled: false },
          { id: 'i8', label: 'Social media policy reviewed',                      responseType: 'yes_no', mandatory: false, nfcEnabled: false },
        ],
      },
      {
        id: 's3', title: 'Sign-Off',
        items: [
          { id: 'i9',  label: 'Employee confirms understanding of all points',    responseType: 'yes_no', mandatory: true,  nfcEnabled: false },
          { id: 'i10', label: 'Buddy/mentor assigned',                            responseType: 'yes_no', mandatory: false, nfcEnabled: false },
        ],
      },
    ],
  },
  {
    id: 'tpl-contractor-induction',
    name: 'Contractor Site Induction',
    categoryId: 'contractors',
    description: 'Site safety briefing and documentation check for contractors before starting work',
    frequency: 'once',
    requiresSignature: true,
    estimatedMinutes: 20,
    sections: [
      {
        id: 's1', title: 'Documentation',
        items: [
          { id: 'i1', label: 'Public liability insurance verified (min. €5 M)',   responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: false },
          { id: 'i2', label: 'Employer liability insurance verified',              responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: false },
          { id: 'i3', label: 'Risk assessment / method statement (RAMS) received', responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
          { id: 'i4', label: 'Contractor qualifications/certifications checked',   responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
        ],
      },
      {
        id: 's2', title: 'Site Briefing',
        items: [
          { id: 'i5', label: 'Evacuation procedure explained',                    responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
          { id: 'i6', label: 'Work area boundaries confirmed',                    responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
          { id: 'i7', label: 'Permit to work issued if required',                 responseType: 'pass_flag_fail_na', mandatory: false, nfcEnabled: false },
          { id: 'i8', label: 'Emergency contact numbers provided',                responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
        ],
      },
    ],
  },
  {
    id: 'tpl-access-monthly',
    name: 'Accessibility Monthly Check',
    categoryId: 'access',
    description: 'Monthly check of accessibility features: lifts, ramps, toilets, signage',
    frequency: 'monthly',
    requiresSignature: false,
    estimatedMinutes: 20,
    sections: [
      {
        id: 's1', title: 'Lifts & Mobility',
        items: [
          { id: 'i1', label: 'Passenger lift operational',                        responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: false },
          { id: 'i2', label: 'Lift inspection certificate current',               responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
          { id: 'i3', label: 'Disabled access ramps clear and in good condition', responseType: 'yes_no',           mandatory: true,  nfcEnabled: false },
          { id: 'i4', label: 'Accessible parking spaces available and marked',    responseType: 'yes_no',           mandatory: false, nfcEnabled: false },
        ],
      },
      {
        id: 's2', title: 'Signage & Facilities',
        items: [
          { id: 'i5', label: 'Accessible toilet available and clean',             responseType: 'pass_flag_fail_na', mandatory: true,  nfcEnabled: false },
          { id: 'i6', label: 'Braille signage in place at key locations',         responseType: 'yes_no',           mandatory: false, nfcEnabled: false },
          { id: 'i7', label: 'Hearing loop functional at reception',              responseType: 'pass_flag_fail_na', mandatory: false, nfcEnabled: false },
        ],
      },
    ],
  },
];

const d = (offset: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + offset);
  dt.setHours(9, 0, 0, 0);
  return dt;
};

export const initialInspectionRuns: InspectionRun[] = [
  // Completed
  { id: 'run-1',  templateId: 'tpl-fire-daily',         templateName: 'Daily Fire Walk',                   categoryId: 'fire',        scheduledAt: d(-1), startedAt: d(-1), completedAt: d(-1), status: 'completed', assigneeId: 'u1', assigneeName: 'John Smith',     responses: {}, score: 100 },
  { id: 'run-2',  templateId: 'tpl-hygiene-kitchen',    templateName: 'Kitchen Hygiene Inspection',        categoryId: 'hygiene',     scheduledAt: d(-1), startedAt: d(-1), completedAt: d(-1), status: 'completed', assigneeId: 'u3', assigneeName: 'Sophie Brennan', responses: {}, score: 92  },
  { id: 'run-3',  templateId: 'tpl-fire-weekly',        templateName: 'Weekly Fire Alarm Test',            categoryId: 'fire',        scheduledAt: d(-4), startedAt: d(-4), completedAt: d(-4), status: 'completed', assigneeId: 'u2', assigneeName: 'Maria Garcia',   responses: {}, score: 100 },
  { id: 'run-11', templateId: 'tpl-fire-daily',         templateName: 'Daily Fire Walk',                   categoryId: 'fire',        scheduledAt: d(-2), startedAt: d(-2), completedAt: d(-2), status: 'completed', assigneeId: 'u1', assigneeName: 'John Smith',     responses: {}, score: 100 },
  { id: 'run-12', templateId: 'tpl-hygiene-kitchen',    templateName: 'Kitchen Hygiene Inspection',        categoryId: 'hygiene',     scheduledAt: d(-2), startedAt: d(-2), completedAt: d(-2), status: 'completed', assigneeId: 'u3', assigneeName: 'Sophie Brennan', responses: {}, score: 85  },
  { id: 'run-13', templateId: 'tpl-training-induction', templateName: 'New Staff Induction Checklist',     categoryId: 'training',    scheduledAt: d(-7), startedAt: d(-7), completedAt: d(-7), status: 'completed', assigneeId: 'u2', assigneeName: 'Maria Garcia',   responses: {}, score: 100 },
  // Overdue
  { id: 'run-4',  templateId: 'tpl-hs-monthly',         templateName: 'Monthly H&S Inspection',           categoryId: 'hs',          scheduledAt: d(-5), status: 'overdue',   assigneeId: 'u1', assigneeName: 'John Smith',     responses: {} },
  { id: 'run-5',  templateId: 'tpl-env-legionella',     templateName: 'Legionella Water Temperature Check',categoryId: 'env',         scheduledAt: d(-2), status: 'overdue',   assigneeId: 'u4', assigneeName: 'Tom Wilson',      responses: {} },
  // Today / Scheduled
  { id: 'run-6',  templateId: 'tpl-fire-daily',         templateName: 'Daily Fire Walk',                   categoryId: 'fire',        scheduledAt: d(0),  status: 'scheduled', assigneeId: 'u1', assigneeName: 'John Smith',     responses: {} },
  { id: 'run-7',  templateId: 'tpl-hygiene-kitchen',    templateName: 'Kitchen Hygiene Inspection',        categoryId: 'hygiene',     scheduledAt: d(0),  status: 'scheduled', assigneeId: 'u3', assigneeName: 'Sophie Brennan', responses: {} },
  // Upcoming
  { id: 'run-8',  templateId: 'tpl-fire-weekly',        templateName: 'Weekly Fire Alarm Test',            categoryId: 'fire',        scheduledAt: d(3),  status: 'scheduled', assigneeId: 'u2', assigneeName: 'Maria Garcia',   responses: {} },
  { id: 'run-9',  templateId: 'tpl-access-monthly',     templateName: 'Accessibility Monthly Check',       categoryId: 'access',      scheduledAt: d(6),  status: 'scheduled', assigneeId: 'u1', assigneeName: 'John Smith',     responses: {} },
  { id: 'run-10', templateId: 'tpl-env-legionella',     templateName: 'Legionella Water Temperature Check',categoryId: 'env',         scheduledAt: d(14), status: 'scheduled', assigneeId: 'u4', assigneeName: 'Tom Wilson',      responses: {} },
];

export const complianceDocuments: ComplianceDocument[] = [
  { id: 'doc-1',  name: 'Fire Safety Certificate 2025',         category: 'certificate', expiryDate: new Date('2025-12-31'), uploadedAt: new Date('2025-01-10'), uploadedBy: 'John Smith',     fileType: 'pdf' },
  { id: 'doc-2',  name: 'Public Liability Insurance Policy',    category: 'insurance',   expiryDate: new Date('2026-03-01'), uploadedAt: new Date('2025-03-05'), uploadedBy: 'Admin',          fileType: 'pdf' },
  { id: 'doc-3',  name: 'Employer Liability Insurance',         category: 'insurance',   expiryDate: new Date('2026-03-01'), uploadedAt: new Date('2025-03-05'), uploadedBy: 'Admin',          fileType: 'pdf' },
  { id: 'doc-4',  name: 'Health & Safety Policy v3',            category: 'sop',         uploadedAt: new Date('2024-11-01'), uploadedBy: 'Maria Garcia',   fileType: 'doc' },
  { id: 'doc-5',  name: 'Food Hygiene Policy',                  category: 'sop',         uploadedAt: new Date('2024-09-15'), uploadedBy: 'Sophie Brennan', fileType: 'doc' },
  { id: 'doc-6',  name: 'Legionella Risk Assessment',           category: 'sop',         expiryDate: new Date('2026-06-01'), uploadedAt: new Date('2024-06-01'), uploadedBy: 'Tom Wilson',     fileType: 'pdf' },
  { id: 'doc-7',  name: 'COSHH Assessments Register',          category: 'sop',         uploadedAt: new Date('2025-02-01'), uploadedBy: 'Maria Garcia',   fileType: 'doc' },
  { id: 'doc-8',  name: 'Fire Warden Training — John Smith',   category: 'training',    expiryDate: new Date('2026-05-01'), uploadedAt: new Date('2024-05-10'), uploadedBy: 'John Smith',     fileType: 'pdf' },
  { id: 'doc-9',  name: 'First Aid Certificate — Maria Garcia',category: 'training',    expiryDate: new Date('2026-08-01'), uploadedAt: new Date('2023-08-20'), uploadedBy: 'Maria Garcia',   fileType: 'pdf' },
  { id: 'doc-10', name: 'Lift Inspection Certificate',          category: 'certificate', expiryDate: new Date('2025-11-01'), uploadedAt: new Date('2024-11-05'), uploadedBy: 'Tom Wilson',     fileType: 'pdf' },
  { id: 'doc-11', name: 'Alcohol License',                      category: 'permit',      expiryDate: new Date('2026-01-31'), uploadedAt: new Date('2025-02-01'), uploadedBy: 'Admin',          fileType: 'pdf' },
  { id: 'doc-12', name: 'Food Business Registration',           category: 'permit',      uploadedAt: new Date('2020-03-01'), uploadedBy: 'Admin',          fileType: 'pdf' },
  { id: 'doc-13', name: 'Plumbing Co. — RAMS',                  category: 'contractor', uploadedAt: new Date('2025-01-20'), uploadedBy: 'Tom Wilson',     fileType: 'pdf' },
  { id: 'doc-14', name: 'Electric Services Ltd — Insurance',    category: 'contractor', expiryDate: new Date('2026-02-01'), uploadedAt: new Date('2025-02-05'), uploadedBy: 'John Smith',     fileType: 'pdf' },
];
