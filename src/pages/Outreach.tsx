import clsx from 'clsx';
import { Check, ExternalLink, Mail, MessageSquareReply, Pencil, Plus, Send, SkipForward, Square, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmailComposer, EnrollModal } from '../components/EmailComposer';
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, NumberInput, PageHeader, Select, Stat, StatStrip, Tabs, Textarea } from '../components/ui';
import { MERGE_FIELDS, openCompose } from '../lib/email';
import { daysFromToday, fromDateInput, relDay, shortDate, toDateInput, uid } from '../lib/format';
import { useStore } from '../lib/store';
import type { EmailMessage, EmailTemplate, Sequence } from '../lib/types';

type Tab = 'queue' | 'sent' | 'sequences' | 'templates';

export default function Outreach() {
  const emails = useStore((s) => s.emails);
  const enrollments = useStore((s) => s.enrollments);
  const [tab, setTab] = useState<Tab>('queue');
  const [compose, setCompose] = useState(false);
  const [enroll, setEnroll] = useState(false);

  const scheduled = emails.filter((e) => e.status === 'scheduled').sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  const due = scheduled.filter((e) => daysFromToday(e.scheduledFor) <= 0);
  const sent = emails.filter((e) => e.status === 'sent').sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''));
  const activeEnr = enrollments.filter((e) => e.status === 'active');
  const replied = enrollments.filter((e) => e.status === 'replied').length;
  const finished = enrollments.filter((e) => e.status !== 'active').length;

  return (
    <>
      <PageHeader
        title="Outreach"
        subtitle="Personalized owner and broker outreach with automatic follow-ups"
        actions={
          <>
            <Button onClick={() => setEnroll(true)}>
              <Send size={15} /> Enroll contact
            </Button>
            <Button variant="primary" onClick={() => setCompose(true)}>
              <Mail size={15} /> Compose
            </Button>
          </>
        }
      />

      <div className="mb-8">
        <StatStrip>
          <Stat label="Due to send" value={due.length} sub={`${scheduled.length - due.length} scheduled later`} />
          <Stat label="In a sequence" value={activeEnr.length} sub="Owners and brokers mid-cadence" />
          <Stat label="Sent" value={sent.length} sub={`${sent.filter((e) => e.sentAt && daysFromToday(e.sentAt) >= -7).length} in the last week`} />
          <Stat label="Reply rate" value={finished ? `${Math.round((replied / finished) * 100)}%` : '—'} sub={finished ? `${replied} of ${finished} finished sequences` : 'No finished sequences yet'} />
        </StatStrip>
      </div>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'queue', label: 'Send queue', count: scheduled.length },
          { id: 'sent', label: 'Sent', count: sent.length },
          { id: 'sequences', label: 'Sequences', count: activeEnr.length },
          { id: 'templates', label: 'Templates' },
        ]}
      />
      <div className="mt-5">
        {tab === 'queue' && <Queue due={due} later={scheduled.filter((e) => daysFromToday(e.scheduledFor) > 0)} />}
        {tab === 'sent' && <Sent sent={sent} />}
        {tab === 'sequences' && <Sequences />}
        {tab === 'templates' && <Templates />}
      </div>

      <EmailComposer open={compose} onClose={() => setCompose(false)} />
      <EnrollModal open={enroll} onClose={() => setEnroll(false)} />
    </>
  );
}

function Queue({ due, later }: { due: EmailMessage[]; later: EmailMessage[] }) {
  const markEmailSent = useStore((s) => s.markEmailSent);
  if (!due.length && !later.length)
    return (
      <Card>
        <EmptyState icon={<Mail size={20} />} title="Nothing queued" body="Enroll an owner or broker in a sequence to schedule personalized follow-ups." />
      </Card>
    );
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Due now"
          subtitle="Review, personalize, and send. Sending opens your email client with everything pre-filled."
          action={
            due.length > 1 && (
              <Button size="sm" onClick={() => confirm(`Mark all ${due.length} due emails as sent?`) && due.forEach((e) => markEmailSent(e.id))}>
                <Check size={13} /> Mark all sent
              </Button>
            )
          }
        />
        <div className="divide-y divide-slate-100">
          {due.map((e) => (
            <QueueItem key={e.id} email={e} />
          ))}
          {!due.length && <p className="px-5 py-6 text-center text-sm text-slate-500">Nothing due today.</p>}
        </div>
      </Card>
      {later.length > 0 && (
        <Card>
          <CardHeader title="Upcoming" />
          <div className="divide-y divide-slate-100">
            {later.map((e) => (
              <QueueItem key={e.id} email={e} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function QueueItem({ email }: { email: EmailMessage }) {
  const contact = useStore((s) => s.contacts.find((c) => c.id === email.contactId));
  const deal = useStore((s) => s.deals.find((d) => d.id === email.dealId));
  const company = useStore((s) => s.companies.find((c) => c.id === deal?.companyId));
  const seq = useStore((s) => s.sequences.find((q) => q.id === email.sequenceId));
  const client = useStore((s) => s.settings.emailClient);
  const { markEmailSent, updateEmail, cancelEmail, markReplied } = useStore();
  const [editing, setEditing] = useState(false);
  const overdue = daysFromToday(email.scheduledFor) < 0;

  return (
    <div className="px-5 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{email.subject}</span>
            {seq && <Badge className="bg-navy-50 text-navy-700">Step {(email.stepIndex ?? 0) + 1}/{seq.steps.length}</Badge>}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            To {contact?.firstName} {contact?.lastName} &lt;{contact?.email}&gt;
            {company && (
              <>
                {' · '}
                <Link to={`/app/deals/${deal!.id}`} className="text-navy-700 hover:underline">
                  {company.name}
                </Link>
              </>
            )}
          </div>
        </div>
        <label className={clsx('relative cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium', overdue ? 'bg-rose-50 text-rose-700' : daysFromToday(email.scheduledFor) === 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600')}>
          {relDay(email.scheduledFor)}
          <input
            type="date"
            value={toDateInput(email.scheduledFor)}
            onChange={(e) => e.target.value && updateEmail(email.id, { scheduledFor: fromDateInput(e.target.value).toISOString() })}
            className="absolute inset-0 cursor-pointer opacity-0"
            title="Reschedule"
          />
        </label>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditing((x) => !x)}>
            <Pencil size={13} /> {editing ? 'Close' : 'Edit'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => cancelEmail(email.id)} title="Skip this step">
            <SkipForward size={13} />
          </Button>
          {email.sequenceId && contact && (
            <Button size="sm" variant="ghost" onClick={() => markReplied(contact.id)} title="Owner replied, stop sequence">
              <MessageSquareReply size={13} />
            </Button>
          )}
          <Button size="sm" onClick={() => markEmailSent(email.id)}>
            <Check size={13} /> Mark sent
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={!contact}
            onClick={() => {
              openCompose(client, contact!.email, email.subject, email.body);
              markEmailSent(email.id);
            }}
          >
            <ExternalLink size={13} /> Send
          </Button>
        </div>
      </div>
      {editing && (
        <div className="mt-3 space-y-2">
          <Input value={email.subject} onChange={(e) => updateEmail(email.id, { subject: e.target.value })} />
          <Textarea value={email.body} onChange={(e) => updateEmail(email.id, { body: e.target.value })} rows={10} className="font-mono text-[13px]" />
        </div>
      )}
    </div>
  );
}

function Sent({ sent }: { sent: EmailMessage[] }) {
  const contacts = useStore((s) => s.contacts);
  const deals = useStore((s) => s.deals);
  const companies = useStore((s) => s.companies);
  if (!sent.length) return <Card><EmptyState icon={<Send size={20} />} title="No emails sent yet" /></Card>;
  return (
    <Card>
      <div className="divide-y divide-slate-50">
        {sent.map((e) => {
          const c = contacts.find((x) => x.id === e.contactId);
          const co = companies.find((x) => x.id === deals.find((d) => d.id === e.dealId)?.companyId);
          return (
            <details key={e.id} className="px-5 py-3">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <Check size={15} className="text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{e.subject}</div>
                  <div className="text-xs text-slate-500">
                    {c ? `${c.firstName} ${c.lastName}` : 'Deleted contact'}
                    {co && ` · ${co.name}`}
                  </div>
                </div>
                <span className="text-xs text-slate-400">{shortDate(e.sentAt)}</span>
              </summary>
              <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-sans text-sm text-slate-700">{e.body}</pre>
            </details>
          );
        })}
      </div>
    </Card>
  );
}

function Sequences() {
  const sequences = useStore((s) => s.sequences);
  const templates = useStore((s) => s.templates);
  const enrollments = useStore((s) => s.enrollments);
  const contacts = useStore((s) => s.contacts);
  const emails = useStore((s) => s.emails);
  const { stopEnrollment, markReplied, deleteSequence } = useStore();
  const [edit, setEdit] = useState<Sequence | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {sequences.map((s) => {
          const enr = enrollments.filter((e) => e.sequenceId === s.id);
          let day = 0;
          return (
            <Card key={s.id}>
              <CardHeader
                title={s.name}
                subtitle={s.description}
                action={
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEdit(s)}>
                      <Pencil size={13} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => confirm(`Delete "${s.name}"?`) && deleteSequence(s.id)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                }
              />
              <ol className="space-y-1.5 p-5 text-sm">
                {s.steps.map((st, i) => {
                  day += st.delayDays;
                  return (
                    <li key={i} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-50 text-xs font-semibold text-navy-700">{i + 1}</span>
                      <span className="flex-1">{templates.find((t) => t.id === st.templateId)?.name ?? 'Missing template'}</span>
                      <span className="text-xs text-slate-400 num">Day {day}</span>
                    </li>
                  );
                })}
              </ol>
              <div className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">
                {enr.filter((e) => e.status === 'active').length} active · {enr.filter((e) => e.status === 'replied').length} replied · {enr.filter((e) => e.status === 'completed').length} completed
              </div>
            </Card>
          );
        })}
        <button
          onClick={() => setEdit({ id: uid(), name: '', description: '', steps: [{ templateId: templates[0]?.id ?? '', delayDays: 0 }] })}
          className="flex min-h-[160px] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-500 hover:border-slate-300 hover:bg-white"
        >
          <Plus size={16} /> New sequence
        </button>
      </div>

      <Card>
        <CardHeader title="Enrollments" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left text-xs text-slate-500 [&>th]:font-normal">
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">Sequence</th>
                <th className="px-4 py-2">Progress</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Started</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => {
                const c = contacts.find((x) => x.id === e.contactId);
                const s = sequences.find((x) => x.id === e.sequenceId);
                const msgs = emails.filter((m) => m.contactId === e.contactId && m.sequenceId === e.sequenceId);
                const sentN = msgs.filter((m) => m.status === 'sent').length;
                return (
                  <tr key={e.id} className="border-b border-slate-50">
                    <td className="px-4 py-2.5 font-medium">
                      {c?.firstName} {c?.lastName}
                      <div className="text-xs font-normal text-slate-500">{c?.organization}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{s?.name ?? 'Deleted'}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-0.5">
                        {msgs.map((m) => (
                          <span
                            key={m.id}
                            className={clsx('h-2 w-6 rounded-full', m.status === 'sent' ? 'bg-emerald-500' : m.status === 'cancelled' ? 'bg-slate-200' : 'bg-amber-300')}
                            title={`${m.subject} (${m.status})`}
                          />
                        ))}
                      </div>
                      <div className="mt-1 text-xs text-slate-400 num">
                        {sentN}/{msgs.length} sent
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        className={
                          e.status === 'active'
                            ? 'bg-amber-50 text-amber-700'
                            : e.status === 'replied'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                        }
                      >
                        {e.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{shortDate(e.startedAt)}</td>
                    <td className="px-4 py-2.5">
                      {e.status === 'active' && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" onClick={() => markReplied(e.contactId)}>
                            <MessageSquareReply size={13} /> Replied
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => stopEnrollment(e.id)}>
                            <Square size={13} /> Stop
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!enrollments.length && <p className="px-4 py-8 text-center text-sm text-slate-500">No one enrolled yet.</p>}
        </div>
      </Card>

      <SequenceEditor seq={edit} onClose={() => setEdit(null)} />
    </div>
  );
}

function SequenceEditor({ seq, onClose }: { seq: Sequence | null; onClose: () => void }) {
  const templates = useStore((s) => s.templates);
  const saveSequence = useStore((s) => s.saveSequence);
  const [d, setD] = useState<Sequence | null>(seq);
  if (seq && (!d || d.id !== seq.id)) setD(seq);
  if (!seq || !d) return null;

  const setStep = (i: number, patch: Partial<Sequence['steps'][number]>) =>
    setD({ ...d, steps: d.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  return (
    <Modal
      open
      onClose={onClose}
      title={seq.name ? 'Edit sequence' : 'New sequence'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!d.name.trim() || !d.steps.length}
            onClick={() => {
              saveSequence(d);
              onClose();
            }}
          >
            Save sequence
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name">
          <Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} autoFocus />
        </Field>
        <Field label="Description">
          <Input value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
        </Field>
        <div>
          <div className="mb-2 text-xs font-medium text-slate-600">Steps</div>
          <div className="space-y-2">
            {d.steps.map((st, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 text-xs font-semibold text-slate-400">{i + 1}</span>
                <Select value={st.templateId} onChange={(e) => setStep(i, { templateId: e.target.value })} className="flex-1">
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
                <div className="w-36">
                  <NumberInput value={st.delayDays} onChange={(v) => setStep(i, { delayDays: Math.max(0, Math.round(v)) })} prefix="+" suffix="days" />
                </div>
                <button onClick={() => setD({ ...d, steps: d.steps.filter((_, j) => j !== i) })} className="rounded p-1.5 text-slate-400 hover:text-rose-600">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => setD({ ...d, steps: [...d.steps, { templateId: templates[0]?.id ?? '', delayDays: 3 }] })}>
            <Plus size={13} /> Add step
          </Button>
          <p className="mt-2 text-xs text-slate-400">Delay is counted from the previous step.</p>
        </div>
      </div>
    </Modal>
  );
}

function Templates() {
  const templates = useStore((s) => s.templates);
  const saveTemplate = useStore((s) => s.saveTemplate);
  const deleteTemplate = useStore((s) => s.deleteTemplate);
  const [selId, setSelId] = useState(templates[0]?.id ?? '');
  const sel = templates.find((t) => t.id === selId);

  const update = (patch: Partial<EmailTemplate>) => sel && saveTemplate({ ...sel, ...patch });

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit">
        <div className="divide-y divide-slate-50">
          {templates.map((t) => (
            <button key={t.id} onClick={() => setSelId(t.id)} className={clsx('block w-full px-4 py-2.5 text-left', t.id === selId ? 'bg-navy-50' : 'hover:bg-slate-50')}>
              <div className="text-sm font-medium">{t.name}</div>
              <div className="text-xs text-slate-500">{t.category}</div>
            </button>
          ))}
        </div>
        <div className="border-t border-slate-100 p-3">
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              const t: EmailTemplate = { id: uid(), name: 'New template', category: 'Owner outreach', subject: '', body: 'Hi {{first_name}},\n\n\n\n{{signature}}' };
              saveTemplate(t);
              setSelId(t.id);
            }}
          >
            <Plus size={13} /> New template
          </Button>
        </div>
      </Card>

      {sel ? (
        <Card>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <Field label="Template name">
              <Input value={sel.name} onChange={(e) => update({ name: e.target.value })} />
            </Field>
            <Field label="Category">
              <Input value={sel.category} onChange={(e) => update({ category: e.target.value })} />
            </Field>
            <Field label="Subject" className="md:col-span-2">
              <Input value={sel.subject} onChange={(e) => update({ subject: e.target.value })} />
            </Field>
            <Field label="Body" className="md:col-span-2">
              <Textarea value={sel.body} onChange={(e) => update({ body: e.target.value })} rows={16} className="font-mono text-[13px]" />
            </Field>
            <div className="md:col-span-2">
              <div className="mb-1.5 text-xs font-medium text-slate-600">Merge fields (click to insert)</div>
              <div className="flex flex-wrap gap-1.5">
                {MERGE_FIELDS.map((m) => (
                  <button
                    key={m.key}
                    title={m.label}
                    onClick={() => update({ body: `${sel.body}{{${m.key}}}` })}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-600 hover:bg-white"
                  >
                    {`{{${m.key}}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-between border-t border-slate-100 px-5 py-3">
            <span className="text-xs text-slate-400">Changes save automatically.</span>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (!confirm(`Delete "${sel.name}"?`)) return;
                deleteTemplate(sel.id);
                setSelId(templates.find((t) => t.id !== sel.id)?.id ?? '');
              }}
            >
              <Trash2 size={13} /> Delete
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState icon={<Mail size={20} />} title="No template selected" />
        </Card>
      )}
    </div>
  );
}
