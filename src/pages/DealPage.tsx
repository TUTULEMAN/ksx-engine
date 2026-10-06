import clsx from 'clsx';
import { ArrowLeft, Briefcase, Mail, MessageSquareReply, Pencil, Phone, Plus, Send, Sparkles, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ContactForm } from '../components/ContactForm';
import { DocumentTable, DocumentUploader } from '../components/DocumentList';
import { EmailComposer, EnrollModal } from '../components/EmailComposer';
import { EmailSummarizer } from '../components/EmailSummarizer';
import { AddTaskForm, sortTasks, TaskRow } from '../components/TaskList';
import { Badge, Button, Card, CardHeader, EmptyState, Field, FitBadge, Input, Select, Tabs, Textarea } from '../components/ui';
import { ValuationModel } from '../components/ValuationModel';
import { CONTACT_TYPES, STAGES, stageMeta } from '../lib/constants';
import { margin, scoreFit } from '../lib/fit';
import { money, mult, pct, relDay, shortDate, timeAgo } from '../lib/format';
import { useStore } from '../lib/store';
import type { Contact, Priority } from '../lib/types';
import { runValuation } from '../lib/valuation';

type Tab = 'overview' | 'valuation' | 'contacts' | 'emails' | 'tasks' | 'documents' | 'notes';

export default function DealPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const deal = useStore((s) => s.deals.find((d) => d.id === id));
  const company = useStore((s) => s.companies.find((c) => c.id === deal?.companyId));
  const allContacts = useStore((s) => s.contacts);
  const allTasks = useStore((s) => s.tasks);
  const allEmails = useStore((s) => s.emails);
  const allDocs = useStore((s) => s.docs);
  const activities = useStore((s) => s.activities);
  const enrollments = useStore((s) => s.enrollments);
  const sequences = useStore((s) => s.sequences);
  const buyBox = useStore((s) => s.settings.buyBox);
  const { updateDeal, moveDeal, deleteDeal, addNote, deleteNote, markReplied, updateContact } = useStore();

  const [tab, setTab] = useState<Tab>('overview');
  const [compose, setCompose] = useState<{ contactId?: string } | null>(null);
  const [enrollFor, setEnrollFor] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<{ contact?: Contact } | null>(null);
  const [linkId, setLinkId] = useState('');
  const [note, setNote] = useState('');
  const [summarize, setSummarize] = useState(false);

  if (!deal || !company) return <EmptyState icon={<Briefcase size={20} />} title="Deal not found" action={<Link to="/app/pipeline">Back to pipeline</Link>} />;

  const fit = scoreFit(company, buyBox);
  const contacts = allContacts.filter((c) => c.dealIds.includes(deal.id));
  const tasks = sortTasks(allTasks.filter((t) => t.dealId === deal.id));
  const emails = allEmails.filter((e) => e.dealId === deal.id && e.status !== 'cancelled').sort((a, b) => (b.sentAt ?? b.scheduledFor).localeCompare(a.sentAt ?? a.scheduledFor));
  const docs = allDocs.filter((d) => d.dealId === deal.id);
  const val = runValuation(deal.valuation);
  const stageIdx = STAGES.findIndex((s) => s.id === deal.stage);

  return (
    <>
      <button onClick={() => navigate('/app/pipeline')} className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Pipeline
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[32px] font-normal leading-tight">{company.name}</h1>
            <FitBadge fit={fit} />
            <Badge className={stageMeta(deal.stage).color}>{stageMeta(deal.stage).label}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {company.subIndustry} · {company.city}, {company.state} · {money(company.revenue)} revenue · {money(company.ebitda)} EBITDA ({pct(margin(company))})
            {' · '}
            <Link to={`/app/companies/${company.id}`} className="text-navy-700 hover:underline">
              Company profile
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setSummarize(true)}>
            <Sparkles size={15} /> Summarize email
          </Button>
          <Button onClick={() => setCompose({ contactId: contacts[0]?.id })}>
            <Mail size={15} /> Email
          </Button>
          <Select value={deal.stage} onChange={(e) => moveDeal(deal.id, e.target.value as typeof deal.stage)} className="w-44">
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <ol className="mb-8 flex overflow-x-auto" aria-label="Deal stage">
        {STAGES.filter((s) => s.id !== 'passed').map((s, i) => {
          const reached = deal.stage !== 'passed' && i <= stageIdx;
          const current = deal.stage === s.id;
          return (
            <li key={s.id} className="min-w-[88px] flex-1">
              <button onClick={() => moveDeal(deal.id, s.id)} className="group block w-full pr-1 text-left" title={`Move to ${s.label}`}>
                <span className={clsx('block h-[3px] transition-colors', reached ? 'bg-navy-900' : 'bg-slate-200 group-hover:bg-slate-300')} />
                <span className={clsx('mt-1.5 block text-xs', current ? 'font-medium text-slate-900' : reached ? 'text-slate-600' : 'text-slate-400 group-hover:text-slate-600')}>
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'valuation', label: 'Valuation' },
          { id: 'contacts', label: 'Contacts', count: contacts.length },
          { id: 'emails', label: 'Emails', count: emails.length },
          { id: 'tasks', label: 'Tasks', count: tasks.filter((t) => !t.done).length },
          { id: 'documents', label: 'Documents', count: docs.length },
          { id: 'notes', label: 'Notes', count: deal.notes.length },
        ]}
      />

      <div className="mt-5">
        {tab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader title="Deal summary" />
                <div className="grid gap-4 p-5 md:grid-cols-2">
                  <Field label="Investment thesis" className="md:col-span-2">
                    <Textarea value={deal.thesis} onChange={(e) => updateDeal(deal.id, { thesis: e.target.value })} placeholder="Why this business, why now, and how we create value…" />
                  </Field>
                  <Field label="Next step">
                    <Input value={deal.nextStep} onChange={(e) => updateDeal(deal.id, { nextStep: e.target.value })} />
                  </Field>
                  <Field label="Priority">
                    <Select value={deal.priority} onChange={(e) => updateDeal(deal.id, { priority: e.target.value as Priority })}>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </Select>
                  </Field>
                  {deal.stage === 'passed' && (
                    <Field label="Pass reason" className="md:col-span-2">
                      <Input value={deal.passedReason ?? ''} onChange={(e) => updateDeal(deal.id, { passedReason: e.target.value })} />
                    </Field>
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader title="Valuation snapshot" action={<Button size="sm" variant="ghost" onClick={() => setTab('valuation')}>Open model</Button>} />
                <div className="grid grid-cols-2 gap-4 p-5 text-sm md:grid-cols-5">
                  <Kv k="Entry" v={`${mult(deal.valuation.entryMultiple)} · ${money(val.enterpriseValue, 2)}`} />
                  <Kv k="Equity check" v={money(val.equity, 2)} />
                  <Kv k="Leverage" v={mult(val.leverage)} />
                  <Kv k="Yr-1 DSCR" v={Number.isFinite(val.year1Dscr) ? `${val.year1Dscr.toFixed(2)}x` : 'n/a'} />
                  <Kv k={`IRR / MOIC (${deal.valuation.holdYears}y)`} v={`${pct(val.irr, 1)} / ${val.moic.toFixed(1)}x`} />
                </div>
              </Card>

              <Card>
                <CardHeader title="Open tasks" action={<Button size="sm" variant="ghost" onClick={() => setTab('tasks')}>All tasks</Button>} />
                <div className="divide-y divide-slate-50">
                  {tasks.filter((t) => !t.done).slice(0, 5).map((t) => (
                    <TaskRow key={t.id} task={t} showDeal={false} />
                  ))}
                  {!tasks.some((t) => !t.done) && <p className="px-5 py-6 text-center text-sm text-slate-500">No open tasks.</p>}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader title="Key contacts" action={<Button size="sm" variant="ghost" onClick={() => setTab('contacts')}>Manage</Button>} />
                <div className="divide-y divide-slate-50">
                  {contacts.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-5 py-2.5">
                      <Avatar c={c} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {c.firstName} {c.lastName}
                        </div>
                        <div className="truncate text-xs text-slate-500">{CONTACT_TYPES.find((t) => t.id === c.type)?.label}</div>
                      </div>
                      <button onClick={() => setCompose({ contactId: c.id })} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-700" title="Email">
                        <Mail size={15} />
                      </button>
                    </div>
                  ))}
                  {!contacts.length && <p className="px-5 py-6 text-center text-sm text-slate-500">No contacts linked yet.</p>}
                </div>
              </Card>

              <Card>
                <CardHeader title="Deal activity" />
                <div className="max-h-96 space-y-3 overflow-y-auto p-5">
                  {activities
                    .filter((a) => a.dealId === deal.id)
                    .slice(0, 20)
                    .map((a) => (
                      <div key={a.id} className="flex gap-3 text-sm">
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-navy-300" />
                        <div>
                          <div className="text-slate-700">{a.text}</div>
                          <div className="text-xs text-slate-400">{timeAgo(a.at)}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  if (confirm(`Remove ${company.name} from the pipeline? Tasks for this deal will be deleted.`)) {
                    deleteDeal(deal.id);
                    navigate('/app/pipeline');
                  }
                }}
              >
                <Trash2 size={15} /> Remove from pipeline
              </Button>
            </div>
          </div>
        )}

        {tab === 'valuation' && (
          <ValuationModel inputs={deal.valuation} onChange={(v) => updateDeal(deal.id, { valuation: v })} industry={company.industry} askingPrice={company.askingPrice} />
        )}

        {tab === 'contacts' && (
          <Card>
            <CardHeader
              title="Deal contacts"
              subtitle="Owners, brokers, lenders, and advisors working on this deal"
              action={
                <div className="flex gap-2">
                  <Select
                    value={linkId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const c = allContacts.find((x) => x.id === cid);
                      if (c) updateContact(c.id, { dealIds: [...c.dealIds, deal.id] });
                      setLinkId('');
                    }}
                    className="w-48 py-1.5 text-xs"
                  >
                    <option value="">Link existing contact…</option>
                    {allContacts
                      .filter((c) => !c.dealIds.includes(deal.id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName} · {c.organization}
                        </option>
                      ))}
                  </Select>
                  <Button size="sm" variant="primary" onClick={() => setContactForm({})}>
                    <UserPlus size={13} /> New contact
                  </Button>
                </div>
              }
            />
            <div className="divide-y divide-slate-50">
              {contacts.map((c) => {
                const enr = enrollments.find((e) => e.contactId === c.id && e.status === 'active');
                return (
                  <div key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
                    <Avatar c={c} />
                    <div className="min-w-[180px] flex-1">
                      <div className="text-sm font-medium">
                        {c.firstName} {c.lastName} <span className="font-normal text-slate-500">· {c.title}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {c.organization} · {c.email} · {c.phone}
                      </div>
                      {enr && (
                        <div className="mt-1 text-xs text-gold-600">
                          In sequence: {sequences.find((s) => s.id === enr.sequenceId)?.name}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{c.lastContactedAt ? `Last touch ${timeAgo(c.lastContactedAt)}` : 'Never contacted'}</span>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => setCompose({ contactId: c.id })}>
                        <Mail size={13} /> Email
                      </Button>
                      {enr ? (
                        <Button size="sm" onClick={() => markReplied(c.id)}>
                          <MessageSquareReply size={13} /> Replied
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => setEnrollFor(c.id)}>
                          <Send size={13} /> Sequence
                        </Button>
                      )}
                      {c.phone && (
                        <a href={`tel:${c.phone}`}>
                          <Button size="sm" variant="ghost">
                            <Phone size={13} />
                          </Button>
                        </a>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setContactForm({ contact: c })}>
                        <Pencil size={13} />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {!contacts.length && <EmptyState icon={<UserPlus size={20} />} title="No contacts yet" body="Add the owner or broker to start outreach." />}
            </div>
          </Card>
        )}

        {tab === 'emails' && (
          <Card>
            <CardHeader title="Email history" action={<Button size="sm" variant="primary" onClick={() => setCompose({ contactId: contacts[0]?.id })}><Plus size={13} /> Compose</Button>} />
            <div className="divide-y divide-slate-50">
              {emails.map((e) => {
                const c = allContacts.find((x) => x.id === e.contactId);
                return (
                  <details key={e.id} className="group px-5 py-3">
                    <summary className="flex cursor-pointer list-none items-center gap-3">
                      <Mail size={15} className={e.status === 'sent' ? 'text-emerald-600' : 'text-amber-500'} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{e.subject}</div>
                        <div className="text-xs text-slate-500">
                          To {c?.firstName} {c?.lastName}
                          {e.sequenceId && ` · Sequence step ${(e.stepIndex ?? 0) + 1}`}
                        </div>
                      </div>
                      <Badge className={e.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                        {e.status === 'sent' ? `Sent ${shortDate(e.sentAt)}` : `Scheduled · ${relDay(e.scheduledFor)}`}
                      </Badge>
                    </summary>
                    <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-sans text-sm text-slate-700">{e.body}</pre>
                  </details>
                );
              })}
              {!emails.length && <EmptyState icon={<Mail size={20} />} title="No emails yet" />}
            </div>
          </Card>
        )}

        {tab === 'tasks' && (
          <Card>
            <AddTaskForm dealId={deal.id} />
            <div className="divide-y divide-slate-50 border-t border-slate-100">
              {tasks.map((t) => (
                <TaskRow key={t.id} task={t} showDeal={false} />
              ))}
              {!tasks.length && <p className="px-5 py-8 text-center text-sm text-slate-500">No tasks yet.</p>}
            </div>
          </Card>
        )}

        {tab === 'documents' && (
          <div className="space-y-4">
            <DocumentUploader dealId={deal.id} />
            <Card>
              <DocumentTable docs={docs} showDeal={false} />
            </Card>
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-4">
            <Card className="p-4">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Call notes, diligence findings, owner priorities…" rows={4} />
              <div className="mt-2 flex justify-end">
                <Button
                  variant="primary"
                  disabled={!note.trim()}
                  onClick={() => {
                    addNote(deal.id, note.trim());
                    setNote('');
                  }}
                >
                  Add note
                </Button>
              </div>
            </Card>
            {deal.notes.map((n) => (
              <Card key={n.id} className="group p-4">
                <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                  {shortDate(n.at)} · {timeAgo(n.at)}
                  <button onClick={() => deleteNote(deal.id, n.id)} className="opacity-0 hover:text-rose-600 group-hover:opacity-100">
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{n.text}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EmailSummarizer open={summarize} onClose={() => setSummarize(false)} contactId={contacts.find((c) => c.type === 'owner')?.id ?? contacts[0]?.id} dealId={deal.id} />
      <EmailComposer open={!!compose} onClose={() => setCompose(null)} contactId={compose?.contactId} dealId={deal.id} />
      <EnrollModal open={!!enrollFor} onClose={() => setEnrollFor(null)} contactId={enrollFor ?? undefined} dealId={deal.id} />
      <ContactForm open={!!contactForm} onClose={() => setContactForm(null)} contact={contactForm?.contact} dealId={deal.id} organization={company.name} />
    </>
  );
}

export function Avatar({ c }: { c: Contact }) {
  const colors: Record<string, string> = {
    owner: 'bg-navy-900 text-paper',
    broker: 'bg-navy-100 text-navy-800',
    lender: 'bg-emerald-50 text-emerald-800',
    attorney: 'bg-slate-200 text-slate-700',
    accountant: 'bg-amber-50 text-amber-800',
  };
  return (
    <div className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-[12px]', colors[c.type] ?? 'bg-slate-100 text-slate-700')}>
      {c.firstName[0]}
      {c.lastName[0]}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{k}</div>
      <div className="font-semibold num">{v}</div>
    </div>
  );
}