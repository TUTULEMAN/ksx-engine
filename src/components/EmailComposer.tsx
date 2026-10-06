import { Copy, ExternalLink, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { fillTemplate, openCompose } from '../lib/email';
import { useStore } from '../lib/store';
import { Button, Field, Input, Modal, Select, Textarea } from './ui';

export function EmailComposer({
  open,
  onClose,
  contactId: initialContact,
  dealId,
}: {
  open: boolean;
  onClose: () => void;
  contactId?: string;
  dealId?: string;
}) {
  const contacts = useStore((s) => s.contacts);
  const templates = useStore((s) => s.templates);
  const settings = useStore((s) => s.settings);
  const deals = useStore((s) => s.deals);
  const companies = useStore((s) => s.companies);
  const logSentEmail = useStore((s) => s.logSentEmail);

  const [contactId, setContactId] = useState(initialContact ?? '');
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [followUp, setFollowUp] = useState(3);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setContactId(initialContact ?? '');
      setTemplateId('');
      setSubject('');
      setBody('');
      setCopied(false);
    }
  }, [open, initialContact]);

  const contact = contacts.find((c) => c.id === contactId);
  const effectiveDealId = dealId ?? contact?.dealIds[0];
  const company = useMemo(() => {
    const d = deals.find((x) => x.id === effectiveDealId);
    return companies.find((c) => c.id === d?.companyId);
  }, [deals, companies, effectiveDealId]);

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    const ctx = { contact, company, settings };
    setSubject(fillTemplate(t.subject, ctx));
    setBody(fillTemplate(t.body, ctx));
  };

  const log = () => {
    if (!contact) return;
    logSentEmail({ contactId: contact.id, dealId: effectiveDealId, subject, body, followUpDays: followUp });
    onClose();
  };

  const clientLabel = settings.emailClient === 'gmail' ? 'Gmail' : settings.emailClient === 'outlook' ? 'Outlook' : 'mail app';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compose email"
      wide
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
              setCopied(true);
            }}
          >
            <Copy size={15} /> {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button onClick={log} disabled={!contact || !subject}>
            <Send size={15} /> Log as sent
          </Button>
          <Button
            variant="primary"
            disabled={!contact || !subject}
            onClick={() => {
              openCompose(settings.emailClient, contact!.email, subject, body);
              log();
            }}
          >
            <ExternalLink size={15} /> Open in {clientLabel} & log
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="To">
          <Select value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">Select a contact…</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} · {c.organization}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Template">
          <Select value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
            <option value="">Blank email</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Subject" className="sm:col-span-2">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Body" className="sm:col-span-2">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className="font-mono text-[13px]" />
        </Field>
        <Field label="Follow-up reminder" hint="Creates a task if they haven't replied by then.">
          <Select value={followUp} onChange={(e) => setFollowUp(Number(e.target.value))}>
            <option value={0}>No reminder</option>
            {[2, 3, 5, 7, 14].map((d) => (
              <option key={d} value={d}>
                In {d} days
              </option>
            ))}
          </Select>
        </Field>
        {contact && (
          <div className="self-end text-xs text-slate-500">
            Sending to <span className="font-medium text-slate-700">{contact.email}</span>
            {company && <> · linked to {company.name}</>}
          </div>
        )}
      </div>
    </Modal>
  );
}

export function EnrollModal({ open, onClose, contactId, dealId }: { open: boolean; onClose: () => void; contactId?: string; dealId?: string }) {
  const sequences = useStore((s) => s.sequences);
  const contacts = useStore((s) => s.contacts);
  const enroll = useStore((s) => s.enroll);
  const templates = useStore((s) => s.templates);
  const [seqId, setSeqId] = useState('');
  const [ct, setCt] = useState(contactId ?? '');

  useEffect(() => {
    if (open) {
      setSeqId(sequences[0]?.id ?? '');
      setCt(contactId ?? '');
    }
  }, [open, contactId, sequences]);

  const seq = sequences.find((s) => s.id === seqId);
  let day = 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enroll in outreach sequence"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!seqId || !ct}
            onClick={() => {
              enroll(seqId, ct, dealId ?? contacts.find((c) => c.id === ct)?.dealIds[0]);
              onClose();
            }}
          >
            Enroll
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!contactId && (
          <Field label="Contact">
            <Select value={ct} onChange={(e) => setCt(e.target.value)}>
              <option value="">Select…</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} · {c.organization}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Sequence">
          <Select value={seqId} onChange={(e) => setSeqId(e.target.value)}>
            {sequences.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        {seq && (
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="mb-2 text-slate-600">{seq.description}</p>
            <ol className="space-y-1">
              {seq.steps.map((st, i) => {
                day += st.delayDays;
                return (
                  <li key={i} className="flex justify-between text-xs">
                    <span>
                      {i + 1}. {templates.find((t) => t.id === st.templateId)?.name ?? 'Missing template'}
                    </span>
                    <span className="text-slate-500 num">Day {day}</span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 text-xs text-slate-500">Emails are queued in Outreach on their due dates. Marking a reply stops the remaining steps.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
