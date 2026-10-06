import { Mail, MessageSquareReply, Pencil, Search, Send, Trash2, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ContactForm } from '../components/ContactForm';
import { EmailComposer, EnrollModal } from '../components/EmailComposer';
import { Badge, Button, Card, EmptyState, Input, PageHeader } from '../components/ui';
import { CONTACT_TYPES } from '../lib/constants';
import { timeAgo } from '../lib/format';
import { useStore } from '../lib/store';
import type { Contact, ContactType } from '../lib/types';
import { Avatar } from './DealPage';

export default function Contacts() {
  const contacts = useStore((s) => s.contacts);
  const deals = useStore((s) => s.deals);
  const companies = useStore((s) => s.companies);
  const enrollments = useStore((s) => s.enrollments);
  const deleteContact = useStore((s) => s.deleteContact);
  const markReplied = useStore((s) => s.markReplied);

  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | ContactType>('all');
  const [form, setForm] = useState<{ contact?: Contact } | null>(null);
  const [compose, setCompose] = useState<string | null>(null);
  const [enroll, setEnroll] = useState<string | null>(null);

  const dealName = (id: string) => companies.find((c) => c.id === deals.find((d) => d.id === id)?.companyId)?.name;

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return contacts
      .filter((c) => type === 'all' || c.type === type)
      .filter((c) => !s || `${c.firstName} ${c.lastName} ${c.organization} ${c.email} ${c.title} ${c.city}`.toLowerCase().includes(s))
      .sort((a, b) => (b.lastContactedAt ?? '').localeCompare(a.lastContactedAt ?? ''));
  }, [contacts, q, type]);

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle="Owners, intermediaries, lenders, and advisors across your search"
        actions={
          <Button variant="primary" onClick={() => setForm({})}>
            <UserPlus size={15} /> New contact
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          {[{ id: 'all' as const, label: 'All' }, ...CONTACT_TYPES].map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`rounded-[4px] px-2.5 py-1 text-xs ${type === t.id ? 'bg-navy-900 text-paper' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {t.label}
              <span className="ml-1 opacity-60 num">{t.id === 'all' ? contacts.length : contacts.filter((c) => c.type === t.id).length}</span>
            </button>
          ))}
        </div>
      </div>

      <Card>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-left text-xs text-slate-500 [&>th]:font-normal">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Contact info</th>
                  <th className="px-4 py-2">Deals</th>
                  <th className="px-4 py-2">Last touch</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const active = enrollments.find((e) => e.contactId === c.id && e.status === 'active');
                  return (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <Avatar c={c} />
                          <div>
                            <div className="font-medium">
                              {c.firstName} {c.lastName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {c.title}
                              {c.title && c.organization && ' · '}
                              {c.organization}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge>{CONTACT_TYPES.find((t) => t.id === c.type)?.label}</Badge>
                        {active && <Badge className="ml-1 bg-gold-300/40 text-gold-600">In sequence</Badge>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">
                        <div>{c.email}</div>
                        <div className="text-slate-400">{c.phone}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {c.dealIds.map((id) => (
                            <Link key={id} to={`/app/deals/${id}`} className="rounded bg-navy-50 px-1.5 py-0.5 text-xs text-navy-700 hover:underline">
                              {dealName(id)}
                            </Link>
                          ))}
                          {!c.dealIds.length && <span className="text-xs text-slate-400">—</span>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">{c.lastContactedAt ? timeAgo(c.lastContactedAt) : 'Never'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <IconBtn title="Email" onClick={() => setCompose(c.id)}>
                            <Mail size={15} />
                          </IconBtn>
                          {active ? (
                            <IconBtn title="Mark replied (stops sequence)" onClick={() => markReplied(c.id)}>
                              <MessageSquareReply size={15} />
                            </IconBtn>
                          ) : (
                            <IconBtn title="Enroll in sequence" onClick={() => setEnroll(c.id)}>
                              <Send size={15} />
                            </IconBtn>
                          )}
                          <IconBtn title="Edit" onClick={() => setForm({ contact: c })}>
                            <Pencil size={15} />
                          </IconBtn>
                          <IconBtn
                            title="Delete"
                            danger
                            onClick={() => confirm(`Delete ${c.firstName} ${c.lastName}?`) && deleteContact(c.id)}
                          >
                            <Trash2 size={15} />
                          </IconBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Users size={20} />} title="No contacts found" />
        )}
      </Card>

      <ContactForm open={!!form} onClose={() => setForm(null)} contact={form?.contact} />
      <EmailComposer open={!!compose} onClose={() => setCompose(null)} contactId={compose ?? undefined} />
      <EnrollModal open={!!enroll} onClose={() => setEnroll(null)} contactId={enroll ?? undefined} />
    </>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`rounded p-1.5 text-slate-400 ${danger ? 'hover:bg-rose-50 hover:text-rose-600' : 'hover:bg-slate-100 hover:text-navy-700'}`}
    >
      {children}
    </button>
  );
}