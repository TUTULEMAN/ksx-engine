import clsx from 'clsx';
import { Bell, BellOff, Bookmark, Check, ChevronDown, Plus, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Field, FitBadge, Input, Modal, NumberInput, PageHeader, Select, Textarea } from '../components/ui';
import { margin, scoreFit, yearsInBusiness } from '../lib/fit';
import { money, pct } from '../lib/format';
import { INDUSTRY_NAMES, STATES } from '../lib/seed';
import { useStore } from '../lib/store';
import type { Company, ListingType, SourcingFilters } from '../lib/types';

const EMPTY: SourcingFilters = { query: '', industries: [], states: [], listing: 'all', minEbitda: 0, maxEbitda: 0, minMargin: 0, minFit: 0 };

type SortKey = 'fit' | 'ebitda' | 'revenue' | 'margin' | 'recurring' | 'added';

export function applyFilters(companies: Company[], f: SourcingFilters, box: Parameters<typeof scoreFit>[1]) {
  const q = f.query.trim().toLowerCase();
  return companies
    .map((c) => ({ c, fit: scoreFit(c, box) }))
    .filter(({ c, fit }) => {
      if (q && !`${c.name} ${c.industry} ${c.subIndustry} ${c.city} ${c.state} ${c.description}`.toLowerCase().includes(q)) return false;
      if (f.industries.length && !f.industries.includes(c.industry)) return false;
      if (f.states.length && !f.states.includes(c.state)) return false;
      if (f.listing !== 'all' && c.listing !== f.listing) return false;
      if (f.minEbitda && c.ebitda < f.minEbitda) return false;
      if (f.maxEbitda && c.ebitda > f.maxEbitda) return false;
      if (f.minMargin && margin(c) < f.minMargin) return false;
      if (f.minFit && fit.score < f.minFit) return false;
      return true;
    });
}

export default function Sourcing() {
  const companies = useStore((s) => s.companies);
  const deals = useStore((s) => s.deals);
  const buyBox = useStore((s) => s.settings.buyBox);
  const savedSearches = useStore((s) => s.savedSearches);
  const addDealFromCompany = useStore((s) => s.addDealFromCompany);
  const saveSearch = useStore((s) => s.saveSearch);
  const touchSearch = useStore((s) => s.touchSearch);
  const deleteSearch = useStore((s) => s.deleteSearch);
  const navigate = useNavigate();

  const [f, setF] = useState<SourcingFilters>(EMPTY);
  const [sort, setSort] = useState<SortKey>('fit');
  const [saveOpen, setSaveOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [alert, setAlert] = useState(true);
  const set = <K extends keyof SourcingFilters>(k: K, v: SourcingFilters[K]) => setF((x) => ({ ...x, [k]: v }));

  const dealByCompany = useMemo(() => new Map(deals.map((d) => [d.companyId, d])), [deals]);

  const rows = useMemo(() => {
    const r = applyFilters(companies, f, buyBox);
    const key: Record<SortKey, (x: (typeof r)[number]) => number> = {
      fit: (x) => x.fit.score,
      ebitda: (x) => x.c.ebitda,
      revenue: (x) => x.c.revenue,
      margin: (x) => margin(x.c),
      recurring: (x) => x.c.recurringPct,
      added: (x) => new Date(x.c.addedAt).getTime(),
    };
    return r.sort((a, b) => key[sort](b) - key[sort](a));
  }, [companies, f, buyBox, sort]);

  const active = JSON.stringify(f) !== JSON.stringify(EMPTY);

  return (
    <>
      <PageHeader
        title="Sourcing"
        subtitle={`${companies.length} lower-middle-market companies · scored against your KSX buy box`}
        actions={
          <>
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={15} /> Add company
            </Button>
            <Button variant="primary" onClick={() => setSaveOpen(true)} disabled={!active}>
              <Bookmark size={15} /> Save search
            </Button>
          </>
        }
      />

      {savedSearches.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {savedSearches.map((s) => {
            const matches = applyFilters(companies, s.filters, buyBox);
            const fresh = matches.filter(({ c }) => new Date(c.addedAt) > new Date(s.lastSeenAt)).length;
            return (
              <div key={s.id} className="group flex items-center gap-1 rounded-[4px] border border-slate-300 bg-white py-1 pl-2.5 pr-1 text-sm">
                <button
                  onClick={() => {
                    setF(s.filters);
                    touchSearch(s.id);
                  }}
                  className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-navy-700"
                >
                  {s.alert ? <Bell size={13} className="text-gold-600" /> : <BellOff size={13} className="text-slate-400" />}
                  {s.name}
                  <span className="text-xs text-slate-400 num">{matches.length}</span>
                  {s.alert && fresh > 0 && <Badge className="bg-gold-500 text-navy-950">{fresh} new</Badge>}
                </button>
                <button onClick={() => deleteSearch(s.id)} className="rounded-full p-1 text-slate-300 hover:bg-slate-100 hover:text-rose-600">
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-6 border-y border-slate-300 py-3">
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="relative min-w-[240px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={f.query} onChange={(e) => set('query', e.target.value)} placeholder="Search by name, niche, city, keyword…" className="pl-9" />
          </div>
          <MultiSelect label="Industry" options={INDUSTRY_NAMES} value={f.industries} onChange={(v) => set('industries', v)} />
          <MultiSelect label="State" options={STATES} value={f.states} onChange={(v) => set('states', v)} />
          <Select value={f.listing} onChange={(e) => set('listing', e.target.value as 'all' | ListingType)} className="w-40">
            <option value="all">All listings</option>
            <option value="off-market">Off-market</option>
            <option value="intermediated">Intermediated</option>
          </Select>
          <div className="w-28">
            <NumberInput value={f.minEbitda} onChange={(v) => set('minEbitda', v)} prefix="≥$" suffix="M" scale={1e6} step={0.5} />
          </div>
          <div className="w-28">
            <NumberInput value={f.minMargin} onChange={(v) => set('minMargin', v)} prefix="≥" suffix="%" scale={0.01} step={5} />
          </div>
          <Select value={f.minFit} onChange={(e) => set('minFit', Number(e.target.value))} className="w-36">
            <option value={0}>Any fit</option>
            <option value={85}>A only (85+)</option>
            <option value={70}>B or better (70+)</option>
            <option value={55}>C or better (55+)</option>
          </Select>
          {active && (
            <Button variant="ghost" onClick={() => setF(EMPTY)}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between pb-2 text-sm">
          <span className="text-slate-600">
            <span className="font-display text-lg text-slate-900 num">{rows.length}</span> {rows.length === 1 ? 'company' : 'companies'}
            {active ? ' match' : ''}
          </span>
          <div className="flex items-center gap-2 whitespace-nowrap text-xs text-slate-500">
            Sort by
            <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="w-36 py-1 text-xs">
              <option value="fit">KSX fit score</option>
              <option value="ebitda">EBITDA</option>
              <option value="revenue">Revenue</option>
              <option value="margin">Margin</option>
              <option value="recurring">Recurring %</option>
              <option value="added">Recently added</option>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left text-xs text-slate-500 [&>th]:font-normal">
                <th className="px-3 py-2">Fit</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2 text-right">Revenue</th>
                <th className="px-3 py-2 text-right">EBITDA</th>
                <th className="px-3 py-2 text-right">Margin</th>
                <th className="px-3 py-2 text-right">Recurring</th>
                <th className="px-3 py-2 text-right">Yrs</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, fit }) => {
                const deal = dealByCompany.get(c.id);
                return (
                  <tr key={c.id} className="cursor-pointer border-b border-slate-200/80 text-[13.5px] hover:bg-white" onClick={() => navigate(`/app/companies/${c.id}`)}>
                    <td className="px-3 py-[7px]">
                      <FitBadge fit={fit} />
                    </td>
                    <td className="px-3 py-[7px]">
                      <div className="text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.subIndustry}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-[7px] text-slate-600">
                      {c.city}, {c.state}
                    </td>
                    <td className="px-3 py-[7px] text-right num">{money(c.revenue)}</td>
                    <td className="px-3 py-[7px] text-right font-medium num">{money(c.ebitda)}</td>
                    <td className={clsx('px-3 py-[7px] text-right num', margin(c) >= buyBox.minMargin ? 'text-emerald-700' : 'text-slate-500')}>{pct(margin(c))}</td>
                    <td className="px-3 py-[7px] text-right num">{pct(c.recurringPct)}</td>
                    <td className="px-3 py-[7px] text-right num">{yearsInBusiness(c)}</td>
                    <td className="px-3 py-[7px]">
                      <span className="whitespace-nowrap text-xs text-slate-500">{c.listing === 'off-market' ? 'Off-market' : 'Broker'}</span>
                    </td>
                    <td className="px-3 py-[7px] text-right" onClick={(e) => e.stopPropagation()}>
                      {deal ? (
                        <Link to={`/app/deals/${deal.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline">
                          <Check size={13} /> In pipeline
                        </Link>
                      ) : (
                        <Button size="sm" onClick={() => addDealFromCompany(c.id)}>
                          <Plus size={13} /> Pipeline
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length && <p className="px-4 py-10 text-center text-sm text-slate-500">Nothing matches. Loosen a filter or two.</p>}
        </div>
      </div>

      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save search"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!searchName.trim()}
              onClick={() => {
                saveSearch({ name: searchName.trim(), filters: f, alert });
                setSearchName('');
                setSaveOpen(false);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <Input value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="e.g. Southeast fire & life safety" autoFocus />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={alert} onChange={(e) => setAlert(e.target.checked)} className="h-4 w-4 accent-navy-900" />
            Alert me when new companies match
          </label>
          <p className="text-xs text-slate-500">{rows.length} companies currently match.</p>
        </div>
      </Modal>

      <AddCompanyModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(id) => navigate(`/app/companies/${id}`)}
      />
    </>
  );
}

function MultiSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm',
          value.length ? 'border-navy-300 bg-navy-50 text-navy-800' : 'border-slate-200 bg-white text-slate-700',
        )}
      >
        {label}
        {value.length > 0 && <span className="rounded-full bg-navy-900 px-1.5 text-xs text-white">{value.length}</span>}
        <ChevronDown size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 max-h-72 w-60 overflow-y-auto rounded-[5px] border border-slate-300 bg-white p-1 shadow-[0_12px_30px_-16px_rgba(27,29,34,0.35)]">
            {options.map((o) => (
              <label key={o} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-navy-900"
                  checked={value.includes(o)}
                  onChange={(e) => onChange(e.target.checked ? [...value, o] : value.filter((x) => x !== o))}
                />
                {o}
              </label>
            ))}
            {value.length > 0 && (
              <button onClick={() => onChange([])} className="mt-1 flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AddCompanyModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const addCompany = useStore((s) => s.addCompany);
  const blank = {
    name: '',
    industry: INDUSTRY_NAMES[0],
    subIndustry: '',
    city: '',
    state: '',
    founded: 2000,
    employees: 25,
    revenue: 8e6,
    ebitda: 1.6e6,
    revenueGrowth: 0.05,
    recurringPct: 0.5,
    topCustomerPct: 0.1,
    ownerAge: 60,
    listing: 'off-market' as ListingType,
    source: 'Manual entry',
    description: '',
  };
  const [d, setD] = useState(blank);
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setD((x) => ({ ...x, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Add a company"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!d.name.trim()}
            onClick={() => {
              const id = addCompany({ ...d, subIndustry: d.subIndustry || d.industry, highlights: [], risks: [] });
              setD(blank);
              onClose();
              onCreated(id);
            }}
          >
            Add company
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Field label="Company name" className="col-span-2 md:col-span-3">
          <Input value={d.name} onChange={(e) => set('name', e.target.value)} autoFocus />
        </Field>
        <Field label="Industry">
          <Select value={d.industry} onChange={(e) => set('industry', e.target.value)}>
            {INDUSTRY_NAMES.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </Select>
        </Field>
        <Field label="Niche">
          <Input value={d.subIndustry} onChange={(e) => set('subIndustry', e.target.value)} placeholder="e.g. Backflow testing" />
        </Field>
        <Field label="Listing">
          <Select value={d.listing} onChange={(e) => set('listing', e.target.value as ListingType)}>
            <option value="off-market">Off-market</option>
            <option value="intermediated">Intermediated</option>
          </Select>
        </Field>
        <Field label="City">
          <Input value={d.city} onChange={(e) => set('city', e.target.value)} />
        </Field>
        <Field label="State">
          <Input value={d.state} onChange={(e) => set('state', e.target.value.toUpperCase().slice(0, 2))} placeholder="TX" />
        </Field>
        <Field label="Founded">
          <NumberInput value={d.founded} onChange={(v) => set('founded', v)} />
        </Field>
        <Field label="Revenue">
          <NumberInput value={d.revenue} onChange={(v) => set('revenue', v)} prefix="$" suffix="M" scale={1e6} step={0.5} />
        </Field>
        <Field label="Adj. EBITDA">
          <NumberInput value={d.ebitda} onChange={(v) => set('ebitda', v)} prefix="$" suffix="M" scale={1e6} step={0.1} />
        </Field>
        <Field label="Recurring revenue">
          <NumberInput value={d.recurringPct} onChange={(v) => set('recurringPct', v)} suffix="%" scale={0.01} step={5} />
        </Field>
        <Field label="Top customer %">
          <NumberInput value={d.topCustomerPct} onChange={(v) => set('topCustomerPct', v)} suffix="%" scale={0.01} step={1} />
        </Field>
        <Field label="Employees">
          <NumberInput value={d.employees} onChange={(v) => set('employees', v)} />
        </Field>
        <Field label="Owner age">
          <NumberInput value={d.ownerAge} onChange={(v) => set('ownerAge', v)} />
        </Field>
        <Field label="Source" className="col-span-2 md:col-span-3">
          <Input value={d.source} onChange={(e) => set('source', e.target.value)} />
        </Field>
        <Field label="Description" className="col-span-2 md:col-span-3">
          <Textarea value={d.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
