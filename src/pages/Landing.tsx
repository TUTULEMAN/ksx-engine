import { ArrowDown, ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FitBadge, Logo } from '../components/ui';
import { margin, scoreFit, yearsInBusiness, type FitResult } from '../lib/fit';
import type { Company } from '../lib/types';
import { money, mult, pct } from '../lib/format';
import { useStore } from '../lib/store';
import { defaultValuation, INDUSTRY_COMPS, runValuation } from '../lib/valuation';

const WORKSPACE = [
  {
    name: 'Pipeline',
    body: 'Each deal sits in exactly one stage, from first look to closed. Move one to LOI and the diligence list is already waiting: QoE kickoff, customer concentration, the employee roster, lender materials.',
  },
  {
    name: 'Owner outreach',
    body: 'Sequences that read like you wrote them, because you did. The owner’s name, company, and town fill themselves in, and the remaining steps stop the moment someone writes back.',
  },
  {
    name: 'Valuation',
    body: 'A search-fund LBO you can argue with on a call. Sources and uses, debt coverage year by year, and an IRR grid across entry and exit multiples, saved per deal.',
  },
  {
    name: 'Reminders',
    body: 'Say you’ll follow up Thursday and it appears on Thursday.',
  },
  {
    name: 'Deal room',
    body: 'NDAs, CIMs, monthly P&Ls and the QoE report, filed under the deal they belong to and sorted as they’re uploaded.',
  },
];

export default function Landing() {
  const companies = useStore((s) => s.companies);
  const buyBox = useStore((s) => s.settings.buyBox);
  const navigate = useNavigate();

  const ranked = useMemo(
    () =>
      companies
        .map((c) => ({ c, fit: scoreFit(c, buyBox) }))
        .sort((a, b) => b.fit.score - a.fit.score || b.c.recurringPct - a.c.recurringPct),
    [companies, buyBox],
  );
  const memo = ranked.find(({ c }) => c.ownerAge >= 60) ?? ranked[0];
  const shortlist = ranked.filter((r) => r !== memo).slice(0, 8);
  const today = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-full bg-paper text-slate-900">
      <header className="border-b border-slate-300">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
            <a href="#memo" className="hover:text-slate-900">Today’s memo</a>
            <a href="#shortlist" className="hover:text-slate-900">Shortlist</a>
            <a href="#workspace" className="hover:text-slate-900">Workspace</a>
            <a href="#criteria" className="hover:text-slate-900">Criteria</a>
          </nav>
          <Link to="/app" className="rounded-[5px] bg-navy-900 px-3.5 py-[7px] text-sm font-medium text-paper hover:bg-navy-800">
            Open the desk
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-14 lg:grid-cols-12 lg:gap-14 lg:pt-20">
        <div className="lg:col-span-5 lg:pt-6">
          <p className="flex items-center gap-3 text-sm text-slate-500">
            <span className="h-px w-8 bg-gold-500" /> For Operators-in-Residence at Kingsway
          </p>
          <h1 className="mt-6 text-[44px] font-normal leading-[1.05] text-navy-950 md:text-[56px]">
            Most businesses for sale aren’t worth a call. <em className="font-normal text-gold-600">A few are worth a career.</em>
          </h1>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-slate-600">
            KSX Engine screens lower-middle-market services companies against the Kingsway buy box, writes up the ones that clear it, and holds everything that
            happens after the first owner email.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link to="/app" className="inline-flex items-center gap-2 rounded-[5px] bg-navy-900 px-5 py-3 text-sm font-medium text-paper hover:bg-navy-800">
              Open the deal desk <ArrowRight size={15} />
            </Link>
            <a href="#memo" className="inline-flex items-center gap-1.5 text-sm text-slate-700 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700">
              Read today’s memo <ArrowDown size={14} />
            </a>
          </div>
        </div>

        {memo && <Memo id="memo" company={memo.c} fit={memo.fit} date={today} onOpen={() => navigate(`/app/companies/${memo.c.id}`)} />}
      </section>

      <section id="shortlist" className="border-t border-slate-300 bg-white/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="text-3xl font-normal text-navy-950">The shortlist</h2>
            <p className="text-sm text-slate-500">Ranked by fit against the buy box · {companies.length} companies screened</p>
          </div>
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-900 text-left text-xs text-slate-500">
                <th className="py-2 pr-3 font-normal">#</th>
                <th className="py-2 pr-3 font-normal">Business</th>
                <th className="hidden py-2 pr-3 font-normal md:table-cell">Source</th>
                <th className="py-2 pr-3 text-right font-normal">Revenue</th>
                <th className="py-2 pr-3 text-right font-normal">EBITDA</th>
                <th className="hidden py-2 pr-3 text-right font-normal sm:table-cell">Margin</th>
                <th className="hidden py-2 pr-3 text-right font-normal sm:table-cell">Recurring</th>
                <th className="py-2 text-right font-normal">Fit</th>
              </tr>
            </thead>
            <tbody>
              {shortlist.map(({ c, fit }, i) => (
                <tr key={c.id} onClick={() => navigate(`/app/companies/${c.id}`)} className="cursor-pointer border-b border-slate-200 hover:bg-paper">
                  <td className="py-3 pr-3 text-slate-400 num">{String(i + 1).padStart(2, '0')}</td>
                  <td className="py-3 pr-3">
                    <span className="font-display text-[15px] text-slate-900">{c.subIndustry}</span>
                    <span className="text-slate-500">
                      {' '}
                      · {c.city}, {c.state} · {yearsInBusiness(c)} yrs
                    </span>
                  </td>
                  <td className="hidden py-3 pr-3 text-slate-500 md:table-cell">{c.listing === 'off-market' ? 'Off-market' : 'Broker'}</td>
                  <td className="py-3 pr-3 text-right num">{money(c.revenue)}</td>
                  <td className="py-3 pr-3 text-right font-medium num">{money(c.ebitda)}</td>
                  <td className="hidden py-3 pr-3 text-right text-slate-600 num sm:table-cell">{pct(margin(c))}</td>
                  <td className="hidden py-3 pr-3 text-right text-slate-600 num sm:table-cell">{pct(c.recurringPct)}</td>
                  <td className="py-3 text-right">
                    <FitBadge fit={fit} showScore={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/app/sourcing" className="mt-6 inline-flex items-center gap-1.5 text-sm text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-700">
            Search all {companies.length} <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section id="workspace" className="mx-auto grid max-w-6xl gap-10 border-t border-slate-300 px-6 py-20 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-10">
            <h2 className="text-3xl font-normal leading-tight text-navy-950">After the first reply, the real work starts.</h2>
            <p className="mt-4 text-slate-600">
              Searchers lose deals in the gaps between a spreadsheet, an inbox, and a shared drive. This is one place for all of it, built around how a KSX search actually runs.
            </p>
          </div>
        </div>
        <dl className="lg:col-span-7 lg:col-start-6">
          {WORKSPACE.map((w, i) => (
            <div key={w.name} className="grid grid-cols-[2.5rem_1fr] border-t border-slate-200 py-6 first:border-t-0 first:pt-0">
              <span className="pt-1 text-xs text-slate-400 num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <dt className="font-display text-xl text-slate-900">{w.name}</dt>
                <dd className="mt-1.5 leading-relaxed text-slate-600">{w.body}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section id="criteria" className="bg-navy-950 text-paper">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <p className="font-display text-[34px] leading-snug">
              “We’re looking for the kind of company its customers would be upset to lose.”
            </p>
            <p className="mt-6 max-w-md text-navy-200">
              The fit score is built on the Search Xcelerator’s published criteria. If your thesis is narrower, say a single niche or a region, change the buy box and every score updates.
            </p>
            <Link to="/app/settings" className="mt-8 inline-flex items-center gap-2 text-sm text-gold-400 underline decoration-gold-600 underline-offset-4 hover:text-gold-300">
              Adjust the buy box <ArrowRight size={14} />
            </Link>
          </div>
          <dl className="self-end text-sm">
            {[
              ['Revenue', '$5M to $30M'],
              ['EBITDA', '$1M to $5M, with margins of at least 15%'],
              ['Revenue quality', 'Repeat or contracted, steady growth, low churn'],
              ['Location', 'United States'],
              ['Deal type', 'Buyout or majority recapitalization'],
              ['Typical entry', '4–6x EBITDA, roughly half equity and half debt'],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 border-b border-white/15 py-3">
                <dt className="text-navy-300">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-slate-500">
        <Logo />
        <p className="max-w-md text-right">A concept prototype, not affiliated with or endorsed by Kingsway Financial Services Inc. Every company and person in it is fictional.</p>
      </footer>
    </div>
  );
}

function Memo({
  id,
  company: c,
  fit,
  date,
  onOpen,
}: {
  id: string;
  company: Company;
  fit: FitResult;
  date: string;
  onOpen: () => void;
}) {
  const multiple = INDUSTRY_COMPS[c.industry]?.median ?? 5;
  const v = runValuation({ ...defaultValuation(c.ebitda), entryMultiple: Math.min(multiple, 6) });
  const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

  return (
    <article id={id} className="scroll-mt-8 border border-slate-300 bg-white px-7 py-7 shadow-[0_1px_0_#ddd6c9,0_18px_40px_-28px_rgba(27,29,34,0.35)] lg:col-span-7 md:px-9">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs text-slate-500">
        <span>Deal memo · {date}</span>
        <FitBadge fit={fit} />
      </div>

      <h2 className="mt-5 text-[28px] font-normal leading-tight text-navy-950">
        A {yearsInBusiness(c)}-year-old {c.subIndustry.toLowerCase()} business in {c.city},{' '}
        {c.ownerAge >= 60 ? 'with a founder starting to think about succession' : 'with an owner looking for a partner to grow it'}
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        {c.industry} · {c.employees} employees · {c.listing === 'off-market' ? 'Off-market' : `Listed through ${c.source.replace('Broker: ', '')}`}
      </p>

      <dl className="mt-6 grid grid-cols-3 border-y border-slate-200 text-sm">
        {[
          ['Revenue', money(c.revenue)],
          ['Adj. EBITDA', money(c.ebitda)],
          ['Margin', pct(margin(c))],
          ['Recurring', pct(c.recurringPct)],
          ['Top customer', pct(c.topCustomerPct)],
          ['Owner age', String(c.ownerAge)],
        ].map(([k, val], i) => (
          <div key={k} className={`px-3 py-2.5 ${i % 3 ? 'border-l border-slate-200' : 'pl-0'} ${i > 2 ? 'border-t border-slate-200' : ''}`}>
            <dt className="text-xs text-slate-500">{k}</dt>
            <dd className="mt-0.5 font-medium num">{val}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-slate-700">
        <p>
          <span className="font-display italic text-slate-900">Why it’s interesting. </span>
          {c.highlights.length ? `${c.highlights.slice(0, 2).map((h, i) => (i ? lower(h) : h)).join('; ')}. ` : ''}
          About {pct(c.recurringPct)} of revenue repeats, which is the part a lender cares about most.
        </p>
        {c.risks[0] && (
          <p>
            <span className="font-display italic text-slate-900">What we’d push on. </span>
            {c.risks.slice(0, 2).map((r, i) => (i ? lower(r) : r)).join('; ')}.
          </p>
        )}
        <p>
          <span className="font-display italic text-slate-900">Rough math. </span>
          At {mult(Math.min(multiple, 6))} that’s about {money(v.enterpriseValue)} of enterprise value and a {money(v.equity)} equity check on a standard KSX structure,
          for a five-year IRR near {pct(v.irr)}.
        </p>
      </div>

      <button onClick={onOpen} className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-navy-800 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-800">
        Open the full profile <ArrowRight size={14} />
      </button>
    </article>
  );
}
