import { useEffect, useState } from 'react';
import { CONTACT_TYPES } from '../lib/constants';
import { useStore } from '../lib/store';
import type { Contact, ContactType } from '../lib/types';
import { Button, Field, Input, Modal, Select, Textarea } from './ui';

type Draft = Omit<Contact, 'id' | 'createdAt'>;

const blank = (dealId?: string, organization = ''): Draft => ({
  firstName: '',
  lastName: '',
  title: '',
  organization,
  type: 'owner',
  email: '',
  phone: '',
  city: '',
  dealIds: dealId ? [dealId] : [],
  notes: '',
});

export function ContactForm({
  open,
  onClose,
  contact,
  dealId,
  organization,
}: {
  open: boolean;
  onClose: () => void;
  contact?: Contact;
  dealId?: string;
  organization?: string;
}) {
  const add = useStore((s) => s.addContact);
  const update = useStore((s) => s.updateContact);
  const deals = useStore((s) => s.deals);
  const companies = useStore((s) => s.companies);
  const [d, setD] = useState<Draft>(blank(dealId, organization));

  useEffect(() => {
    if (open) setD(contact ? { ...contact } : blank(dealId, organization));
  }, [open, contact, dealId, organization]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const valid = d.firstName.trim() && (d.email.trim() || d.phone.trim());

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={contact ? 'Edit contact' : 'New contact'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() => {
              if (contact) update(contact.id, d);
              else add(d);
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name">
          <Input value={d.firstName} onChange={(e) => set('firstName', e.target.value)} autoFocus />
        </Field>
        <Field label="Last name">
          <Input value={d.lastName} onChange={(e) => set('lastName', e.target.value)} />
        </Field>
        <Field label="Type">
          <Select value={d.type} onChange={(e) => set('type', e.target.value as ContactType)}>
            {CONTACT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Title">
          <Input value={d.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Organization" className="col-span-2">
          <Input value={d.organization} onChange={(e) => set('organization', e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={d.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={d.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Location" className="col-span-2">
          <Input value={d.city} onChange={(e) => set('city', e.target.value)} placeholder="City, ST" />
        </Field>
        <Field label="Linked deals" className="col-span-2" hint="Hold Ctrl / Cmd to select multiple.">
          <select
            multiple
            value={d.dealIds}
            onChange={(e) => set('dealIds', Array.from(e.target.selectedOptions).map((o) => o.value))}
            className="h-28 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
          >
            {deals.map((dl) => (
              <option key={dl.id} value={dl.id}>
                {companies.find((c) => c.id === dl.companyId)?.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes" className="col-span-2">
          <Textarea value={d.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
