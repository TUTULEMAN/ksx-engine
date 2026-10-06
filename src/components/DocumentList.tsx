import clsx from 'clsx';
import { Download, Eye, FileText, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteFile, openFile, saveFile } from '../lib/files';
import { fileSize, shortDate, uid } from '../lib/format';
import { useStore } from '../lib/store';
import { DOC_CATEGORIES, type DocCategory, type DocMeta } from '../lib/types';
import { EmptyState, Select } from './ui';

export function guessCategory(name: string): DocCategory {
  const n = name.toLowerCase();
  if (n.includes('nda') || n.includes('confidential')) return 'NDA';
  if (n.includes('cim') || n.includes('teaser') || n.includes('memorandum')) return 'CIM / Teaser';
  if (n.includes('loi') || n.includes('ioi') || n.includes('letter of intent')) return 'IOI / LOI';
  if (n.includes('qoe') || n.includes('quality of earnings')) return 'Quality of Earnings';
  if (n.includes('model') || n.includes('valuation') || n.includes('lbo')) return 'Valuation';
  if (/p&l|pnl|financial|balance|tax|return|\.xlsx?$/.test(n)) return 'Financials';
  if (n.includes('apa') || n.includes('agreement') || n.includes('contract')) return 'Legal';
  if (n.includes('term sheet') || n.includes('loan') || n.includes('credit')) return 'Financing';
  return 'Other';
}

export function DocumentUploader({ dealId, compact }: { dealId?: string; compact?: boolean }) {
  const addDoc = useStore((s) => s.addDoc);
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const handle = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    for (const f of Array.from(files)) {
      const id = uid();
      await saveFile(id, f);
      addDoc({ id, name: f.name, size: f.size, mime: f.type, category: guessCategory(f.name), dealId, uploadedAt: new Date().toISOString() });
    }
    setBusy(false);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files);
      }}
      onClick={() => input.current?.click()}
      className={clsx(
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition',
        compact ? 'px-4 py-4' : 'px-6 py-8',
        drag ? 'border-navy-500 bg-navy-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <Upload size={compact ? 18 : 22} className="text-slate-400" />
      <p className="mt-2 text-sm font-medium text-slate-700">{busy ? 'Uploading…' : 'Drop files or click to upload'}</p>
      {!compact && <p className="text-xs text-slate-500">NDAs, CIMs, P&Ls, LOIs, QoE reports. Auto-categorized by file name.</p>}
      <input ref={input} type="file" multiple hidden onChange={(e) => handle(e.target.files)} />
    </div>
  );
}

export function DocumentTable({ docs, showDeal = true }: { docs: DocMeta[]; showDeal?: boolean }) {
  const updateDoc = useStore((s) => s.updateDoc);
  const removeDoc = useStore((s) => s.removeDoc);
  const deals = useStore((s) => s.deals);
  const companies = useStore((s) => s.companies);

  if (!docs.length) return <EmptyState icon={<FileText size={20} />} title="No documents yet" body="Upload files above to build the deal room." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-300 text-left text-xs text-slate-500 [&>th]:font-normal">
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Category</th>
            {showDeal && <th className="px-4 py-2">Deal</th>}
            <th className="px-4 py-2">Size</th>
            <th className="px-4 py-2">Uploaded</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => {
            const deal = deals.find((x) => x.id === d.dealId);
            const co = companies.find((c) => c.id === deal?.companyId);
            return (
              <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <button onClick={() => openFile(d.id, d.name)} className="flex items-center gap-2 text-left font-medium text-slate-800 hover:text-navy-700">
                    <FileText size={15} className="shrink-0 text-slate-400" />
                    <span className="truncate">{d.name}</span>
                  </button>
                </td>
                <td className="px-4 py-2">
                  <Select value={d.category} onChange={(e) => updateDoc(d.id, { category: e.target.value as DocCategory })} className="w-40 py-1 text-xs">
                    {DOC_CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </td>
                {showDeal && (
                  <td className="px-4 py-2">
                    {co ? (
                      <Link to={`/app/deals/${deal!.id}`} className="text-navy-700 hover:underline">
                        {co.name}
                      </Link>
                    ) : (
                      <Select value="" onChange={(e) => updateDoc(d.id, { dealId: e.target.value || undefined })} className="w-40 py-1 text-xs">
                        <option value="">Unassigned</option>
                        {deals.map((dl) => (
                          <option key={dl.id} value={dl.id}>
                            {companies.find((c) => c.id === dl.companyId)?.name}
                          </option>
                        ))}
                      </Select>
                    )}
                  </td>
                )}
                <td className="px-4 py-2 text-slate-500 num">{fileSize(d.size)}</td>
                <td className="px-4 py-2 text-slate-500">{shortDate(d.uploadedAt)}</td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openFile(d.id, d.name)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Open">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => openFile(d.id, d.name, true)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Download">
                      <Download size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm(`Delete ${d.name}?`)) return;
                        deleteFile(d.id);
                        removeDoc(d.id);
                      }}
                      className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
