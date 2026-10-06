import type { ContactType, Priority, Stage, TaskType } from './types';

export const STAGES: { id: Stage; label: string; color: string; dot: string }[] = [
  { id: 'sourced', label: 'Sourced', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' },
  { id: 'contacted', label: 'Contacted', color: 'bg-slate-100 text-slate-700', dot: 'bg-navy-200' },
  { id: 'nda', label: 'NDA signed', color: 'bg-slate-100 text-slate-700', dot: 'bg-navy-300' },
  { id: 'cim', label: 'CIM & financials', color: 'bg-navy-50 text-navy-700', dot: 'bg-navy-500' },
  { id: 'ioi', label: 'IOI', color: 'bg-navy-50 text-navy-700', dot: 'bg-navy-700' },
  { id: 'loi', label: 'LOI signed', color: 'bg-navy-50 text-navy-800', dot: 'bg-navy-800' },
  { id: 'diligence', label: 'Diligence', color: 'bg-navy-100 text-navy-900', dot: 'bg-navy-900' },
  { id: 'closing', label: 'Closing', color: 'bg-amber-50 text-amber-800', dot: 'bg-gold-500' },
  { id: 'closed', label: 'Closed', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600' },
  { id: 'passed', label: 'Passed', color: 'bg-rose-50 text-rose-700', dot: 'bg-rose-400' },
];

export const stageMeta = (s: Stage) => STAGES.find((x) => x.id === s)!;

export const ACTIVE_STAGES: Stage[] = ['sourced', 'contacted', 'nda', 'cim', 'ioi', 'loi', 'diligence', 'closing'];

export const PRIORITY_STYLE: Record<Priority, string> = {
  high: 'bg-rose-50 text-rose-700',
  medium: 'bg-slate-100 text-slate-600',
  low: 'bg-transparent px-0 text-slate-400',
};

export const CONTACT_TYPES: { id: ContactType; label: string }[] = [
  { id: 'owner', label: 'Owner / Seller' },
  { id: 'broker', label: 'Broker / Banker' },
  { id: 'lender', label: 'Lender' },
  { id: 'attorney', label: 'Attorney' },
  { id: 'accountant', label: 'Accountant / QoE' },
  { id: 'advisor', label: 'Advisor' },
  { id: 'other', label: 'Other' },
];

export const TASK_TYPES: { id: TaskType; label: string }[] = [
  { id: 'follow-up', label: 'Follow-up' },
  { id: 'call', label: 'Call' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'diligence', label: 'Diligence' },
  { id: 'general', label: 'General' },
];

/** Default diligence checklist created when a deal moves to LOI / diligence. */
export const DILIGENCE_CHECKLIST = [
  'Request 3 years of tax returns and monthly P&Ls',
  'Engage QoE provider and schedule kickoff',
  'Customer concentration and churn analysis',
  'Review key employee roster and compensation',
  'Legal: corporate docs, contracts, litigation search',
  'Lender term sheet and credit committee materials',
  'Insurance and benefits review',
  'Draft 100-day plan with KBS playbook',
];
