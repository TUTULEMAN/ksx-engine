import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DILIGENCE_CHECKLIST, stageMeta } from './constants';
import { fillTemplate } from './email';
import { addDays, nowIso, toDateInput, uid } from './format';
import { buildSeed, DEFAULT_SETTINGS } from './seed';
import { defaultValuation } from './valuation';
import type {
  Activity,
  BuyBox,
  Company,
  Contact,
  Deal,
  DocMeta,
  EmailMessage,
  EmailTemplate,
  Enrollment,
  SavedSearch,
  Sequence,
  Settings,
  Stage,
  Task,
} from './types';

interface Data {
  companies: Company[];
  deals: Deal[];
  contacts: Contact[];
  templates: EmailTemplate[];
  sequences: Sequence[];
  emails: EmailMessage[];
  enrollments: Enrollment[];
  tasks: Task[];
  docs: DocMeta[];
  activities: Activity[];
  savedSearches: SavedSearch[];
  settings: Settings;
}

interface Actions {
  log: (a: Omit<Activity, 'id' | 'at'>) => void;

  addCompany: (c: Omit<Company, 'id' | 'addedAt'>) => string;
  updateCompany: (id: string, patch: Partial<Company>) => void;

  addDealFromCompany: (companyId: string) => string;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  moveDeal: (id: string, stage: Stage, passedReason?: string) => void;
  deleteDeal: (id: string) => void;
  addNote: (dealId: string, text: string) => void;
  deleteNote: (dealId: string, noteId: string) => void;

  addContact: (c: Omit<Contact, 'id' | 'createdAt'>) => string;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  saveTemplate: (t: EmailTemplate) => void;
  deleteTemplate: (id: string) => void;
  saveSequence: (s: Sequence) => void;
  deleteSequence: (id: string) => void;

  enroll: (sequenceId: string, contactId: string, dealId?: string) => void;
  markReplied: (contactId: string) => void;
  stopEnrollment: (id: string) => void;
  markEmailSent: (id: string) => void;
  updateEmail: (id: string, patch: Partial<EmailMessage>) => void;
  cancelEmail: (id: string) => void;
  logSentEmail: (e: { contactId: string; dealId?: string; subject: string; body: string; followUpDays?: number }) => void;

  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'done'>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  addDoc: (d: DocMeta) => void;
  updateDoc: (id: string, patch: Partial<DocMeta>) => void;
  removeDoc: (id: string) => void;

  saveSearch: (s: Omit<SavedSearch, 'id' | 'createdAt' | 'lastSeenAt'>) => void;
  touchSearch: (id: string) => void;
  deleteSearch: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  updateBuyBox: (patch: Partial<BuyBox>) => void;

  resetDemo: () => void;
  clearAll: () => void;
  importData: (d: Partial<Data>) => void;
}

export type AppState = Data & Actions;

const freshData = (): Data => ({ ...buildSeed(), docs: [], savedSearches: [], settings: DEFAULT_SETTINGS });

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      const companyOf = (dealId?: string) => {
        const deal = get().deals.find((d) => d.id === dealId);
        return deal ? get().companies.find((c) => c.id === deal.companyId) : undefined;
      };
      const dealName = (dealId?: string) => companyOf(dealId)?.name ?? 'deal';
      const contactName = (id: string) => {
        const c = get().contacts.find((x) => x.id === id);
        return c ? `${c.firstName} ${c.lastName}` : 'contact';
      };
      const touchDeal = (id?: string) => {
        if (!id) return;
        set((s) => ({ deals: s.deals.map((d) => (d.id === id ? { ...d, updatedAt: nowIso() } : d)) }));
      };

      return {
        ...freshData(),

        log: (a) => set((s) => ({ activities: [{ ...a, id: uid(), at: nowIso() }, ...s.activities].slice(0, 300) })),

        addCompany: (c) => {
          const id = `co-${uid()}`;
          set((s) => ({ companies: [{ ...c, id, addedAt: nowIso() }, ...s.companies] }));
          return id;
        },
        updateCompany: (id, patch) => set((s) => ({ companies: s.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

        addDealFromCompany: (companyId) => {
          const existing = get().deals.find((d) => d.companyId === companyId);
          if (existing) return existing.id;
          const co = get().companies.find((c) => c.id === companyId)!;
          const id = `deal-${uid()}`;
          const deal: Deal = {
            id,
            companyId,
            stage: 'sourced',
            priority: 'medium',
            thesis: '',
            nextStep: co.listing === 'off-market' ? 'Find owner contact and enroll in outreach' : 'Request NDA from broker',
            valuation: defaultValuation(co.ebitda),
            notes: [],
            createdAt: nowIso(),
            updatedAt: nowIso(),
          };
          set((s) => ({ deals: [deal, ...s.deals] }));
          get().log({ type: 'deal', text: `${co.name} added to pipeline`, dealId: id });
          return id;
        },
        updateDeal: (id, patch) => set((s) => ({ deals: s.deals.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: nowIso() } : d)) })),
        moveDeal: (id, stage, passedReason) => {
          const deal = get().deals.find((d) => d.id === id);
          if (!deal || deal.stage === stage) return;
          get().updateDeal(id, { stage, passedReason: stage === 'passed' ? passedReason ?? deal.passedReason : undefined });
          get().log({ type: 'stage', text: `${dealName(id)} moved to ${stageMeta(stage).label}`, dealId: id });
          const hasDiligence = get().tasks.some((t) => t.dealId === id && t.type === 'diligence');
          if ((stage === 'loi' || stage === 'diligence') && !hasDiligence) {
            const tasks: Task[] = DILIGENCE_CHECKLIST.map((title, i) => ({
              id: uid(),
              title,
              type: 'diligence',
              dueDate: toDateInput(addDays(new Date(), 3 + i * 3)),
              done: false,
              dealId: id,
              createdAt: nowIso(),
            }));
            set((s) => ({ tasks: [...s.tasks, ...tasks] }));
            get().log({ type: 'task', text: `Diligence checklist (${tasks.length} tasks) created for ${dealName(id)}`, dealId: id });
          }
        },
        deleteDeal: (id) =>
          set((s) => ({
            deals: s.deals.filter((d) => d.id !== id),
            tasks: s.tasks.filter((t) => t.dealId !== id),
            contacts: s.contacts.map((c) => ({ ...c, dealIds: c.dealIds.filter((x) => x !== id) })),
          })),
        addNote: (dealId, text) => {
          set((s) => ({
            deals: s.deals.map((d) => (d.id === dealId ? { ...d, updatedAt: nowIso(), notes: [{ id: uid(), at: nowIso(), text }, ...d.notes] } : d)),
          }));
          get().log({ type: 'note', text: `Note added to ${dealName(dealId)}`, dealId });
        },
        deleteNote: (dealId, noteId) =>
          set((s) => ({ deals: s.deals.map((d) => (d.id === dealId ? { ...d, notes: d.notes.filter((n) => n.id !== noteId) } : d)) })),

        addContact: (c) => {
          const id = `ct-${uid()}`;
          set((s) => ({ contacts: [{ ...c, id, createdAt: nowIso() }, ...s.contacts] }));
          get().log({ type: 'contact', text: `Added contact ${c.firstName} ${c.lastName}`, contactId: id, dealId: c.dealIds[0] });
          return id;
        },
        updateContact: (id, patch) => set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
        deleteContact: (id) =>
          set((s) => ({
            contacts: s.contacts.filter((c) => c.id !== id),
            emails: s.emails.filter((e) => !(e.contactId === id && e.status === 'scheduled')),
            enrollments: s.enrollments.filter((e) => e.contactId !== id),
          })),

        saveTemplate: (t) =>
          set((s) => ({ templates: s.templates.some((x) => x.id === t.id) ? s.templates.map((x) => (x.id === t.id ? t : x)) : [...s.templates, t] })),
        deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),
        saveSequence: (q) =>
          set((s) => ({ sequences: s.sequences.some((x) => x.id === q.id) ? s.sequences.map((x) => (x.id === q.id ? q : x)) : [...s.sequences, q] })),
        deleteSequence: (id) => set((s) => ({ sequences: s.sequences.filter((q) => q.id !== id) })),

        enroll: (sequenceId, contactId, dealId) => {
          const { sequences, templates, contacts, settings, enrollments } = get();
          const seq = sequences.find((q) => q.id === sequenceId);
          const contact = contacts.find((c) => c.id === contactId);
          if (!seq || !contact) return;
          if (enrollments.some((e) => e.contactId === contactId && e.sequenceId === sequenceId && e.status === 'active')) return;
          const company = companyOf(dealId);
          const enr: Enrollment = { id: uid(), sequenceId, contactId, dealId, status: 'active', startedAt: nowIso() };
          let offset = 0;
          const emails: EmailMessage[] = seq.steps.flatMap((step, i) => {
            const tpl = templates.find((t) => t.id === step.templateId);
            offset += step.delayDays;
            if (!tpl) return [];
            const ctx = { contact, company, settings };
            return [{
              id: uid(),
              contactId,
              dealId,
              subject: fillTemplate(tpl.subject, ctx),
              body: fillTemplate(tpl.body, ctx),
              status: 'scheduled' as const,
              scheduledFor: addDays(new Date(), offset).toISOString(),
              sequenceId,
              stepIndex: i,
              createdAt: nowIso(),
            }];
          });
          set((s) => ({ enrollments: [enr, ...s.enrollments], emails: [...s.emails, ...emails] }));
          get().log({ type: 'email', text: `${contactName(contactId)} enrolled in "${seq.name}"`, contactId, dealId });
          const deal = get().deals.find((d) => d.id === dealId);
          if (deal && deal.stage === 'sourced') get().moveDeal(deal.id, 'contacted');
        },
        markReplied: (contactId) => {
          set((s) => ({
            enrollments: s.enrollments.map((e) => (e.contactId === contactId && e.status === 'active' ? { ...e, status: 'replied' } : e)),
            emails: s.emails.map((e) => (e.contactId === contactId && e.status === 'scheduled' && e.sequenceId ? { ...e, status: 'cancelled' } : e)),
            contacts: s.contacts.map((c) => (c.id === contactId ? { ...c, lastContactedAt: nowIso() } : c)),
          }));
          const contact = get().contacts.find((c) => c.id === contactId);
          const dealId = contact?.dealIds[0];
          get().addTask({ title: `Respond to ${contactName(contactId)}'s reply`, type: 'follow-up', dueDate: toDateInput(new Date()), dealId, contactId });
          get().log({ type: 'reply', text: `${contactName(contactId)} replied; remaining sequence steps cancelled`, contactId, dealId });
        },
        stopEnrollment: (id) => {
          const enr = get().enrollments.find((e) => e.id === id);
          if (!enr) return;
          set((s) => ({
            enrollments: s.enrollments.map((e) => (e.id === id ? { ...e, status: 'stopped' } : e)),
            emails: s.emails.map((e) =>
              e.contactId === enr.contactId && e.sequenceId === enr.sequenceId && e.status === 'scheduled' ? { ...e, status: 'cancelled' } : e,
            ),
          }));
        },
        markEmailSent: (id) => {
          const email = get().emails.find((e) => e.id === id);
          if (!email || email.status === 'sent') return;
          set((s) => ({
            emails: s.emails.map((e) => (e.id === id ? { ...e, status: 'sent', sentAt: nowIso() } : e)),
            contacts: s.contacts.map((c) => (c.id === email.contactId ? { ...c, lastContactedAt: nowIso() } : c)),
          }));
          if (email.sequenceId) {
            const remaining = get().emails.some(
              (e) => e.contactId === email.contactId && e.sequenceId === email.sequenceId && e.status === 'scheduled',
            );
            if (!remaining) {
              set((s) => ({
                enrollments: s.enrollments.map((e) =>
                  e.contactId === email.contactId && e.sequenceId === email.sequenceId && e.status === 'active' ? { ...e, status: 'completed' } : e,
                ),
              }));
            }
          }
          touchDeal(email.dealId);
          get().log({ type: 'email', text: `Email "${email.subject}" sent to ${contactName(email.contactId)}`, contactId: email.contactId, dealId: email.dealId });
        },
        updateEmail: (id, patch) => set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
        cancelEmail: (id) => set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, status: 'cancelled' } : e)) })),
        logSentEmail: ({ contactId, dealId, subject, body, followUpDays }) => {
          const msg: EmailMessage = { id: uid(), contactId, dealId, subject, body, status: 'sent', scheduledFor: nowIso(), sentAt: nowIso(), createdAt: nowIso() };
          set((s) => ({
            emails: [...s.emails, msg],
            contacts: s.contacts.map((c) => (c.id === contactId ? { ...c, lastContactedAt: nowIso() } : c)),
          }));
          touchDeal(dealId);
          get().log({ type: 'email', text: `Email "${subject}" sent to ${contactName(contactId)}`, contactId, dealId });
          if (followUpDays && followUpDays > 0) {
            get().addTask({
              title: `Follow up with ${contactName(contactId)} re: "${subject}"`,
              type: 'follow-up',
              dueDate: toDateInput(addDays(new Date(), followUpDays)),
              dealId,
              contactId,
            });
          }
        },

        addTask: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, id: uid(), done: false, createdAt: nowIso() }] })),
        updateTask: (id, patch) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
        toggleTask: (id) => {
          const t = get().tasks.find((x) => x.id === id);
          if (!t) return;
          set((s) => ({ tasks: s.tasks.map((x) => (x.id === id ? { ...x, done: !x.done, completedAt: !x.done ? nowIso() : undefined } : x)) }));
          if (!t.done) get().log({ type: 'task', text: `Completed: ${t.title}`, dealId: t.dealId, contactId: t.contactId });
        },
        deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

        addDoc: (d) => {
          set((s) => ({ docs: [d, ...s.docs] }));
          touchDeal(d.dealId);
          get().log({ type: 'document', text: `Uploaded ${d.name}${d.dealId ? ` to ${dealName(d.dealId)}` : ''}`, dealId: d.dealId });
        },
        updateDoc: (id, patch) => set((s) => ({ docs: s.docs.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
        removeDoc: (id) => set((s) => ({ docs: s.docs.filter((d) => d.id !== id) })),

        saveSearch: (q) => set((s) => ({ savedSearches: [{ ...q, id: uid(), createdAt: nowIso(), lastSeenAt: nowIso() }, ...s.savedSearches] })),
        touchSearch: (id) => set((s) => ({ savedSearches: s.savedSearches.map((q) => (q.id === id ? { ...q, lastSeenAt: nowIso() } : q)) })),
        deleteSearch: (id) => set((s) => ({ savedSearches: s.savedSearches.filter((q) => q.id !== id) })),

        updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
        updateBuyBox: (patch) => set((s) => ({ settings: { ...s.settings, buyBox: { ...s.settings.buyBox, ...patch } } })),

        resetDemo: () => set({ ...freshData(), settings: get().settings }),
        clearAll: () =>
          set({ companies: [], deals: [], contacts: [], emails: [], enrollments: [], tasks: [], docs: [], activities: [], savedSearches: [] }),
        importData: (d) => set((s) => ({ ...s, ...d })),
      };
    },
    {
      name: 'ksx-engine-v1',
      version: 1,
      partialize: (s) => {
        const { companies, deals, contacts, templates, sequences, emails, enrollments, tasks, docs, activities, savedSearches, settings } = s;
        return { companies, deals, contacts, templates, sequences, emails, enrollments, tasks, docs, activities, savedSearches, settings };
      },
    },
  ),
);

export const exportData = (): Data => {
  const s = useStore.getState();
  const { companies, deals, contacts, templates, sequences, emails, enrollments, tasks, docs, activities, savedSearches, settings } = s;
  const safeSettings = settings.ai ? { ...settings, ai: { ...settings.ai, apiKey: '' } } : settings;
  return { companies, deals, contacts, templates, sequences, emails, enrollments, tasks, docs, activities, savedSearches, settings: safeSettings };
};
