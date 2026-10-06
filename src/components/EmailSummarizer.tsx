import clsx from 'clsx';
import { Check, Copy, MessageSquareReply, NotebookPen, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, toDateInput } from '../lib/format';
import { useStore } from '../lib/store';
import { DEFAULT_AI, summarizeEmail, type EmailSummary, type Interest } from '../lib/summarize';
import { Badge, Button, Field, Modal, Select, Textarea } from './ui';

const INTEREST: Record<Interest, { label: string; cls: string }> = {
  hot: { label: 'Interested', cls: 'bg-emerald-50 text-emerald-800' },
  warm: { label: 'Open', cls: 'bg-amber-50 text-amber-800' },
  cold: { label: 'Not interested', cls: 'bg-rose-50 text-rose-700' },
  unclear: { label: 'Unclear', cls: 'bg-slate-100 text-slate-600' },
};

export function EmailSummarizer({ open, onClose, contactId: initialContact, dealId }: { open: boolean; onClose: () => void; contactId?: string; dealId?: string }) {
  const contacts = useStore((s) => s.contacts);
  const deals = useStore((s) => s.deals);
  const companies = useStore((s) => s.companies);
  const settings = useStore((s) => s.settings);
  const enrollments = useStore((s) => s.enrollments);
  const { addTask, addNote, markReplied, log } = useStore();

  const [contactId, setContactId] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<EmailSummary | null>(null);
  const [picked, setPicked] = useState<boolean[]>([]);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setContactId(initialContact ?? '');
    setText('');
    setResult(null);
    setError('');
    setDone([]);
  }, [open, initialContact]);

  const contact = contacts.find((c) => c.id === contactId);
  const effectiveDeal = dealId ?? contact?.dealIds[0];
  const company = companies.find((c) => c.id === deals.find((d) => d.id === effectiveDeal)?.companyId);
  const inSequence = !!contact && enrollments.some((e) => e.contactId === contact.id && e.status === 'active');
  const ai = settings.ai ?? DEFAULT_AI;
  const usingAi = ai.provider !== 'none' && !!ai.apiKey.trim();

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await summarizeEmail(text, { contact, company, myName: settings.userName }, ai);
      setResult(r);
      setPicked(r.nextSteps.map(() => true));
      setDone([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const addTasks = () => {
    if (!result) return;
    result.nextSteps.forEach((s, i) => {
      if (picked[i]) addTask({ title: s.title, type: 'follow-up', dueDate: toDateInput(addDays(new Date(), s.dueInDays)), dealId: effectiveDeal, contactId: contact?.id });
    });
    setDone((d) => [...d, 'tasks']);
  };

  const saveNote = () => {
    if (!result || !effectiveDeal) return;
    const who = contact ? `${contact.firstName} ${contact.lastName}` : 'email';
    const body = [`Email summary (${who}): ${result.summary}`, ...result.keyPoints.map((k) => `• ${k}`)].join('\n');
    addNote(effectiveDeal, body);
    setDone((d) => [...d, 'note']);
  };

  return (
    <Modal open={open} onClose={onClose} title="Summarize an email" wide>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="From">
            <Select value={contactId} onChange={(e) => setContactId(e.target.value)}>
              <option value="">Not linked to a contact</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} · {c.organization}
                </option>
              ))}
            </Select>
          </Field>
          <p className="pb-2 text-xs text-slate-500">
            {usingAi ? `Using ${ai.provider === 'openai' ? 'OpenAI' : 'Anthropic'}` : 'Basic mode · '}
            {!usingAi && (
              <Link to="/app/settings" onClick={onClose} className="text-navy-700 underline">
                add an AI key
              </Link>
            )}
          </p>
        </div>

        <Field label="Paste the email or thread">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={result ? 5 : 10} placeholder="Copy the message from Gmail or Outlook and paste it here. Quoted history is fine." className="text-[13px]" />
        </Field>

        <div className="flex justify-end">
          <Button variant="primary" onClick={run} disabled={busy || text.trim().length < 20}>
            <Sparkles size={15} /> {busy ? 'Reading…' : result ? 'Summarize again' : 'Summarize'}
          </Button>
        </div>

        {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        {result && (
          <div className="space-y-5 border-t border-slate-200 pt-5">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <Badge className={INTEREST[result.interest].cls}>{INTEREST[result.interest].label}</Badge>
                {result.source === 'basic' && <span className="text-xs text-slate-400">basic summary</span>}
              </div>
              <p className="text-[15px] leading-relaxed text-slate-800">{result.summary}</p>
            </div>

            {result.keyPoints.length > 0 && (
              <div>
                <div className="mb-1.5 text-xs font-medium text-slate-500">Key points</div>
                <ul className="space-y-1 text-sm text-slate-700">
                  {result.keyPoints.map((k, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-slate-400">–</span> {k}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.nextSteps.length > 0 && (
              <div>
                <div className="mb-1.5 text-xs font-medium text-slate-500">Next steps</div>
                <div className="space-y-1">
                  {result.nextSteps.map((s, i) => (
                    <label key={i} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" checked={picked[i] ?? false} onChange={(e) => setPicked((p) => p.map((v, j) => (j === i ? e.target.checked : v)))} className="h-4 w-4 accent-navy-900" />
                      <span className="flex-1">{s.title}</span>
                      <span className="text-xs text-slate-400 num">{s.dueInDays === 0 ? 'today' : `in ${s.dueInDays}d`}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {result.suggestedReply && (
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500">
                  Suggested reply
                  <button onClick={() => navigator.clipboard.writeText(result.suggestedReply)} className="flex items-center gap-1 text-navy-700 hover:underline">
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 font-sans text-sm text-slate-700">{result.suggestedReply}</pre>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <Button onClick={addTasks} disabled={done.includes('tasks') || !picked.some(Boolean)}>
                <Check size={15} /> {done.includes('tasks') ? 'Tasks added' : 'Add selected as tasks'}
              </Button>
              <Button onClick={saveNote} disabled={done.includes('note') || !effectiveDeal} title={effectiveDeal ? '' : 'Link a contact with a deal to save a note'}>
                <NotebookPen size={15} /> {done.includes('note') ? 'Saved to deal' : 'Save to deal notes'}
              </Button>
              {contact && (
                <Button
                  onClick={() => {
                    if (inSequence) markReplied(contact.id);
                    else log({ type: 'reply', text: `${contact.firstName} ${contact.lastName} replied`, contactId: contact.id, dealId: effectiveDeal });
                    setDone((d) => [...d, 'replied']);
                  }}
                  disabled={done.includes('replied')}
                  className={clsx(inSequence && !done.includes('replied') && 'border-gold-500')}
                >
                  <MessageSquareReply size={15} /> {done.includes('replied') ? 'Marked as replied' : inSequence ? 'Mark replied & stop sequence' : 'Log reply'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
