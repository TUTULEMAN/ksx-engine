import { Search } from 'lucide-react';
import { useState } from 'react';
import { DocumentTable, DocumentUploader } from '../components/DocumentList';
import { Card, Input, PageHeader, Select } from '../components/ui';
import { fileSize } from '../lib/format';
import { useStore } from '../lib/store';
import { DOC_CATEGORIES } from '../lib/types';

export default function Documents() {
  const docs = useStore((s) => s.docs);
  const deals = useStore((s) => s.deals);
  const companies = useStore((s) => s.companies);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [deal, setDeal] = useState('all');

  const rows = docs.filter(
    (d) =>
      (cat === 'all' || d.category === cat) &&
      (deal === 'all' || (deal === 'none' ? !d.dealId : d.dealId === deal)) &&
      (!q.trim() || d.name.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle={`${docs.length} files · ${fileSize(docs.reduce((s, d) => s + d.size, 0))} stored securely in this browser`}
      />

      <div className="mb-6">
        <DocumentUploader dealId={deal !== 'all' && deal !== 'none' ? deal : undefined} />
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" className="pl-9" />
        </div>
        <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-48">
          <option value="all">All categories</option>
          {DOC_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select value={deal} onChange={(e) => setDeal(e.target.value)} className="w-56">
          <option value="all">All deals</option>
          <option value="none">Unassigned</option>
          {deals.map((d) => (
            <option key={d.id} value={d.id}>
              {companies.find((c) => c.id === d.companyId)?.name}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <DocumentTable docs={rows} />
      </Card>
    </>
  );
}
