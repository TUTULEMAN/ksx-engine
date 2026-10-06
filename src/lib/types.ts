export type Stage =
  | 'sourced'
  | 'contacted'
  | 'nda'
  | 'cim'
  | 'ioi'
  | 'loi'
  | 'diligence'
  | 'closing'
  | 'closed'
  | 'passed';

export type ListingType = 'off-market' | 'intermediated';

export interface Company {
  id: string;
  name: string;
  industry: string;
  subIndustry: string;
  city: string;
  state: string;
  founded: number;
  employees: number;
  revenue: number;
  ebitda: number;
  revenueGrowth: number;
  recurringPct: number;
  topCustomerPct: number;
  ownerAge: number;
  listing: ListingType;
  source: string;
  askingPrice?: number;
  description: string;
  highlights: string[];
  risks: string[];
  website?: string;
  addedAt: string;
}

export type Priority = 'high' | 'medium' | 'low';

export interface ValuationInputs {
  ebitda: number;
  entryMultiple: number;
  feesPct: number;
  seniorDebtPct: number;
  sellerNotePct: number;
  seniorRate: number;
  seniorTermYears: number;
  sellerNoteRate: number;
  ebitdaGrowth: number;
  capexPct: number;
  taxRate: number;
  exitMultiple: number;
  holdYears: number;
}

export interface Note {
  id: string;
  at: string;
  text: string;
}

export interface Deal {
  id: string;
  companyId: string;
  stage: Stage;
  priority: Priority;
  thesis: string;
  nextStep: string;
  passedReason?: string;
  valuation: ValuationInputs;
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}

export type ContactType = 'owner' | 'broker' | 'lender' | 'attorney' | 'accountant' | 'advisor' | 'other';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  organization: string;
  type: ContactType;
  email: string;
  phone: string;
  city: string;
  dealIds: string[];
  notes: string;
  lastContactedAt?: string;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
}

export interface SequenceStep {
  templateId: string;
  delayDays: number;
}

export interface Sequence {
  id: string;
  name: string;
  description: string;
  steps: SequenceStep[];
}

export type EmailStatus = 'scheduled' | 'sent' | 'cancelled';

export interface EmailMessage {
  id: string;
  contactId: string;
  dealId?: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledFor: string;
  sentAt?: string;
  sequenceId?: string;
  stepIndex?: number;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  sequenceId: string;
  contactId: string;
  dealId?: string;
  status: 'active' | 'replied' | 'completed' | 'stopped';
  startedAt: string;
}

export type TaskType = 'follow-up' | 'call' | 'diligence' | 'meeting' | 'general';

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  dueDate: string;
  done: boolean;
  dealId?: string;
  contactId?: string;
  createdAt: string;
  completedAt?: string;
}

export const DOC_CATEGORIES = [
  'NDA',
  'CIM / Teaser',
  'Financials',
  'Valuation',
  'IOI / LOI',
  'Quality of Earnings',
  'Legal',
  'Diligence',
  'Financing',
  'Other',
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number];

export interface DocMeta {
  id: string;
  name: string;
  size: number;
  mime: string;
  category: DocCategory;
  dealId?: string;
  uploadedAt: string;
}

export type ActivityType = 'stage' | 'email' | 'note' | 'task' | 'document' | 'deal' | 'contact' | 'reply';

export interface Activity {
  id: string;
  at: string;
  type: ActivityType;
  text: string;
  dealId?: string;
  contactId?: string;
}

export interface BuyBox {
  minRevenue: number;
  maxRevenue: number;
  minEbitda: number;
  maxEbitda: number;
  minMargin: number;
  minRecurring: number;
  maxTopCustomer: number;
  minYears: number;
  focusIndustries: string[];
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SourcingFilters;
  alert: boolean;
  createdAt: string;
  lastSeenAt: string;
}

export interface SourcingFilters {
  query: string;
  industries: string[];
  states: string[];
  listing: 'all' | ListingType;
  minEbitda: number;
  maxEbitda: number;
  minMargin: number;
  minFit: number;
}

export interface Settings {
  userName: string;
  userTitle: string;
  userEmail: string;
  userPhone: string;
  signature: string;
  emailClient: 'mailto' | 'gmail' | 'outlook';
  buyBox: BuyBox;
}
