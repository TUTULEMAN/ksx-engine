import clsx from 'clsx';
import { ArrowLeft, Building2, Calendar, Check, Globe, MapPin, Plus, Users, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, CardHeader, EmptyState, FitBadge } from '../components/ui';
import { margin, scoreFit, yearsInBusiness } from '../lib/fit';
import { money, mult, pct, shortDate } from '../lib/format';
import { useStore } from '../lib/store';
import { INDUSTRY_COMPS, runValuation, defaultValuation } from '../lib/valuation';

export default function CompanyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const company = useStore((s) => s.companies.find((c) => c.id === id));
  const deal = useStore((s) => s.deals.find((d) => d.companyId === id));
  const buyBox = useStore((s) => s.settings.buyBox);
  const addDealFromCompany = useStore((s) => s.addDealFromCompany);

  if (!company) return <EmptyState icon={<Building2 size={20} />} title="Company not found" action={<Link to="/app/sourcing">Back to sourcing</Link>} />;

  const fit = scoreFit(company, buyBox);
  const comps = INDUSTRY_COMPS[company.industry];
  const quick = runValuation({ ...defaultValuation(company.ebitda), entryMultiple: comps?.median ?? 5 });

  return (
    <>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Back
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[32px] font-normal leading-tight">{company.name}</h1>
            <FitBadge fit={fit} />
            <Badge className={company.listing === 'off-market' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}>
              {company.listing === 'off-market' ? 'Off-market' : 'Intermediated'}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Building2 size={14} /> {company.industry} · {company.subIndustry}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {company.city}, {company.state}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} /> Founded {company.founded}
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} /> ~{company.employees} employees
            </span>
            {company.website && (
              <span className="flex items-center gap-1">
                <Globe size={14} /> {company.website}
              </span>
            )}
          </div>
        </div>
        {deal ? (
          <Link to={`/app/deals/${deal.id}`}>
            <Button variant="primary">Open deal workspace</Button>
          </Link>
        ) : (
          <Button variant="gold" onClick={() => navigate(`/app/deals/${addDealFromCompany(company.id)}`)}>
            <Plus size={15} /> Add to pipeline
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          ['Revenue', money(company.revenue)],
          ['Adj. EBITDA', money(company.ebitda)],
          ['EBITDA margin', pct(margin(company))],
          ['Revenue growth', pct(company.revenueGrowth)],
          ['Recurring revenue', pct(company.recurringPct)],
          ['Top customer', pct(company.topCustomerPct)],
        ].map(([k, v]) => (
          <Card key={k} className="p-4">
            <div className="text-xs text-slate-500">{k}</div>
            <div className="mt-1 text-lg font-semibold num">{v}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Overview" subtitle={`Source: ${company.source} · Added ${shortDate(company.addedAt)}`} />
            <div className="p-5">
              <p className="text-sm leading-relaxed text-slate-700">{company.description || 'No description yet.'}</p>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <div className="mb-2 font-display text-[15px] italic text-emerald-700">What we like</div>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {company.highlights.map((h) => (
                      <li key={h} className="flex gap-2">
                        <Check size={15} className="mt-0.5 shrink-0 text-emerald-600" /> {h}
                      </li>
                    ))}
                    {!company.highlights.length && <li className="text-slate-400">None recorded</li>}
                  </ul>
                </div>
                <div>
                  <div className="mb-2 font-display text-[15px] italic text-rose-700">What we’d push on</div>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {company.risks.map((h) => (
                      <li key={h} className="flex gap-2">
                        <X size={15} className="mt-0.5 shrink-0 text-rose-500" /> {h}
                      </li>
                    ))}
                    {!company.risks.length && <li className="text-slate-400">None recorded</li>}
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Quick valuation" subtitle={`At ${comps ? `${company.industry} median` : 'a default'} ${mult(comps?.median ?? 5)} with a standard KSX structure`} />
            <div className="grid grid-cols-2 gap-4 p-5 text-sm md:grid-cols-4">
              <div>
                <div className="text-xs text-slate-500">Enterprise value</div>
                <div className="font-semibold num">{money(quick.enterpriseValue, 2)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Equity check</div>
                <div className="font-semibold num">{money(quick.equity, 2)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">5-yr IRR / MOIC</div>
                <div className="font-semibold num">
                  {pct(quick.irr, 1)} / {quick.moic.toFixed(1)}x
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Asking price</div>
                <div className="font-semibold num">{company.askingPrice ? `${money(company.askingPrice)} (${mult(company.askingPrice / company.ebitda)})` : 'Off-market'}</div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="KSX buy-box fit" action={<FitBadge fit={fit} />} />
          <div className="divide-y divide-slate-50">
            {fit.checks.map((c) => (
              <div key={c.label} className="flex items-start gap-3 px-5 py-2.5">
                <div className={clsx('mt-0.5 rounded-full p-0.5', c.pass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600')}>
                  {c.pass ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{c.label}</div>
                  <div className="text-xs text-slate-500">{c.detail}</div>
                </div>
                <span className="text-xs text-slate-400 num">{c.weight}pt</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            {yearsInBusiness(company)} years in business · owner age {company.ownerAge}
          </div>
        </Card>
      </div>
    </>
  );
}
