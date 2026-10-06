import clsx from 'clsx';
import { RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
import { money, mult, pct } from '../lib/format';
import type { ValuationInputs } from '../lib/types';
import { defaultValuation, INDUSTRY_COMPS, runValuation } from '../lib/valuation';
import { Button, Card, CardHeader, Field, NumberInput } from './ui';

export function ValuationModel({
  inputs,
  onChange,
  industry,
  askingPrice,
}: {
  inputs: ValuationInputs;
  onChange: (v: ValuationInputs) => void;
  industry?: string;
  askingPrice?: number;
}) {
  const r = useMemo(() => runValuation(inputs), [inputs]);
  const set = <K extends keyof ValuationInputs>(k: K) => (v: number) => onChange({ ...inputs, [k]: v });
  const comps = industry ? INDUSTRY_COMPS[industry] : undefined;

  const entryAxis = [-1, -0.5, 0, 0.5, 1].map((d) => +(inputs.entryMultiple + d).toFixed(1)).filter((m) => m > 0);
  const exitAxis = [-1, -0.5, 0, 0.5, 1].map((d) => +(inputs.exitMultiple + d).toFixed(1)).filter((m) => m > 0);

  const dscrTone = (d: number) => (d >= 1.75 ? 'text-emerald-700' : d >= 1.25 ? 'text-amber-700' : 'text-rose-700');

  return (
    <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
      <Card className="h-fit">
        <CardHeader
          title="Assumptions"
          action={
            <Button size="sm" variant="ghost" onClick={() => onChange(defaultValuation(inputs.ebitda))}>
              <RotateCcw size={13} /> Reset
            </Button>
          }
        />
        <div className="space-y-5 p-5">
          <Section title="Entry">
            <Field label="Adj. EBITDA (TTM)">
              <NumberInput value={inputs.ebitda} onChange={set('ebitda')} prefix="$" suffix="M" scale={1e6} step={0.05} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Entry multiple">
                <NumberInput value={inputs.entryMultiple} onChange={set('entryMultiple')} suffix="x" step={0.25} />
              </Field>
              <Field label="Fees & expenses">
                <NumberInput value={inputs.feesPct} onChange={set('feesPct')} suffix="%" scale={0.01} step={0.5} />
              </Field>
            </div>
          </Section>
          <Section title="Capital structure (% of EV)">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Senior debt">
                <NumberInput value={inputs.seniorDebtPct} onChange={set('seniorDebtPct')} suffix="%" scale={0.01} step={5} />
              </Field>
              <Field label="Seller note">
                <NumberInput value={inputs.sellerNotePct} onChange={set('sellerNotePct')} suffix="%" scale={0.01} step={5} />
              </Field>
              <Field label="Senior rate">
                <NumberInput value={inputs.seniorRate} onChange={set('seniorRate')} suffix="%" scale={0.01} step={0.25} />
              </Field>
              <Field label="Senior term">
                <NumberInput value={inputs.seniorTermYears} onChange={set('seniorTermYears')} suffix="yrs" step={1} />
              </Field>
              <Field label="Seller note rate">
                <NumberInput value={inputs.sellerNoteRate} onChange={set('sellerNoteRate')} suffix="%" scale={0.01} step={0.25} />
              </Field>
            </div>
          </Section>
          <Section title="Operations & exit">
            <div className="grid grid-cols-2 gap-3">
              <Field label="EBITDA growth / yr">
                <NumberInput value={inputs.ebitdaGrowth} onChange={set('ebitdaGrowth')} suffix="%" scale={0.01} step={1} />
              </Field>
              <Field label="Capex (% EBITDA)">
                <NumberInput value={inputs.capexPct} onChange={set('capexPct')} suffix="%" scale={0.01} step={1} />
              </Field>
              <Field label="Tax rate">
                <NumberInput value={inputs.taxRate} onChange={set('taxRate')} suffix="%" scale={0.01} step={1} />
              </Field>
              <Field label="Hold period">
                <NumberInput value={inputs.holdYears} onChange={set('holdYears')} suffix="yrs" step={1} />
              </Field>
              <Field label="Exit multiple">
                <NumberInput value={inputs.exitMultiple} onChange={set('exitMultiple')} suffix="x" step={0.25} />
              </Field>
            </div>
          </Section>
        </div>
      </Card>

      <div className="min-w-0 space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="Enterprise value" value={money(r.enterpriseValue, 2)} sub={`${mult(inputs.entryMultiple)} EBITDA`} />
          <Metric label="Equity check" value={money(r.equity, 2)} sub={`${pct(r.equityPct)} of total uses`} />
          <Metric label={`Equity MOIC / IRR (${inputs.holdYears}y)`} value={`${r.moic.toFixed(1)}x`} sub={`${pct(r.irr, 1)} IRR`} tone={r.irr >= 0.25 ? 'good' : r.irr >= 0.15 ? 'ok' : 'bad'} />
          <Metric
            label="Yr-1 DSCR"
            value={Number.isFinite(r.year1Dscr) ? `${r.year1Dscr.toFixed(2)}x` : 'n/a'}
            sub={`${mult(r.leverage)} total leverage`}
            tone={r.year1Dscr >= 1.75 ? 'good' : r.year1Dscr >= 1.25 ? 'ok' : 'bad'}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Sources & uses" />
            <div className="grid grid-cols-2 gap-6 p-5 text-sm">
              <div>
                <div className="mb-1 border-b border-slate-200 pb-1 text-xs text-slate-500">Sources</div>
                <Line label="Senior debt" value={r.seniorDebt} total={r.totalUses} />
                <Line label="Seller note" value={r.sellerNote} total={r.totalUses} />
                <Line label="Kingsway equity" value={r.equity} total={r.totalUses} />
                <Line label="Total" value={r.totalUses} bold />
              </div>
              <div>
                <div className="mb-1 border-b border-slate-200 pb-1 text-xs text-slate-500">Uses</div>
                <Line label="Purchase price" value={r.enterpriseValue} total={r.totalUses} />
                <Line label="Fees & expenses" value={r.fees} total={r.totalUses} />
                <Line label="Total" value={r.totalUses} bold />
              </div>
            </div>
            <div className="mx-5 mb-5 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="bg-navy-700" style={{ width: `${(r.seniorDebt / r.totalUses) * 100}%` }} title="Senior debt" />
              <div className="bg-navy-300" style={{ width: `${(r.sellerNote / r.totalUses) * 100}%` }} title="Seller note" />
              <div className="bg-gold-500" style={{ width: `${(r.equity / r.totalUses) * 100}%` }} title="Equity" />
            </div>
          </Card>

          <Card>
            <CardHeader title="Market context" subtitle={industry ? `${industry} · illustrative private-market EV/EBITDA` : 'Illustrative private-market EV/EBITDA'} />
            <div className="space-y-4 p-5 text-sm">
              {comps ? (
                <div>
                  <div className="relative h-8">
                    <div className="absolute top-3.5 h-1.5 w-full rounded-full bg-slate-100" />
                    {(() => {
                      const lo = Math.min(comps.low, inputs.entryMultiple) - 0.5;
                      const hi = Math.max(comps.high, inputs.entryMultiple) + 0.5;
                      const pos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
                      return (
                        <>
                          <div className="absolute top-3.5 h-1.5 rounded-full bg-navy-200" style={{ left: pos(comps.low), width: `calc(${pos(comps.high)} - ${pos(comps.low)})` }} />
                          <div className="absolute top-2 h-4 w-0.5 bg-navy-500" style={{ left: pos(comps.median) }} />
                          <div className="absolute top-1 h-6 w-6 -translate-x-1/2 rounded-full border-2 border-white bg-gold-500 shadow" style={{ left: pos(inputs.entryMultiple) }} title="Your entry" />
                        </>
                      );
                    })()}
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-500 num">
                    <span>Low {mult(comps.low)}</span>
                    <span>Median {mult(comps.median)}</span>
                    <span>High {mult(comps.high)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">Select a company to see industry comps.</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Kv k="KSX target range" v="4.0x – 6.0x" />
                <Kv k="Your entry" v={mult(inputs.entryMultiple)} />
                {askingPrice && <Kv k="Asking price" v={`${money(askingPrice)} (${mult(askingPrice / inputs.ebitda)})`} />}
                <Kv k="Implied exit EV" v={money(r.exitEV)} />
                <Kv k="Min DSCR (hold)" v={Number.isFinite(r.minDscr) ? `${r.minDscr.toFixed(2)}x` : 'n/a'} />
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title="Projection & debt service" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm num">
              <thead>
                <tr className="border-b border-slate-100 text-right text-xs font-medium text-slate-500">
                  <th className="px-4 py-2 text-left">($)</th>
                  {r.rows.map((row) => (
                    <th key={row.year} className="px-4 py-2">
                      Year {row.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-right">
                <Row label="EBITDA" vals={r.rows.map((x) => x.ebitda)} bold />
                <Row label="(–) Capex" vals={r.rows.map((x) => -x.capex)} />
                <Row label="(–) Interest" vals={r.rows.map((x) => -x.interest)} />
                <Row label="(–) Taxes" vals={r.rows.map((x) => -x.taxes)} />
                <Row label="(–) Principal" vals={r.rows.map((x) => -x.principal)} />
                <Row label="Free cash flow to equity" vals={r.rows.map((x) => x.fcf)} bold />
                <tr className="border-t border-slate-100">
                  <td className="px-4 py-1.5 text-left text-slate-600">DSCR</td>
                  {r.rows.map((x) => (
                    <td key={x.year} className={clsx('px-4 py-1.5 font-medium', dscrTone(x.dscr))}>
                      {Number.isFinite(x.dscr) ? `${x.dscr.toFixed(2)}x` : '—'}
                    </td>
                  ))}
                </tr>
                <Row label="Senior debt balance" vals={r.rows.map((x) => x.seniorBalance)} muted />
                <Row label="Cumulative cash" vals={r.rows.map((x) => x.cash)} muted />
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 p-5 text-sm md:grid-cols-4">
            <Kv k="Exit EV" v={money(r.exitEV, 2)} />
            <Kv k="(–) Net debt at exit" v={money(r.exitNetDebt, 2)} />
            <Kv k="Exit equity value" v={money(r.exitEquity, 2)} />
            <Kv k="Value created" v={money(r.exitEquity - r.equity, 2)} />
          </div>
        </Card>

        <Card>
          <CardHeader title="IRR sensitivity" subtitle="Rows: entry multiple · Columns: exit multiple" />
          <div className="overflow-x-auto p-5">
            <table className="mx-auto text-sm num">
              <thead>
                <tr>
                  <th className="px-3 py-1.5" />
                  {exitAxis.map((x) => (
                    <th key={x} className="px-3 py-1.5 text-xs font-medium text-slate-500">
                      {mult(x)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entryAxis.map((en) => (
                  <tr key={en}>
                    <th className="px-3 py-1.5 text-right text-xs font-medium text-slate-500">{mult(en)}</th>
                    {exitAxis.map((ex) => {
                      const irr = runValuation({ ...inputs, entryMultiple: en, exitMultiple: ex }).irr;
                      const center = en === inputs.entryMultiple && ex === inputs.exitMultiple;
                      return (
                        <td
                          key={ex}
                          className={clsx(
                            'px-3 py-1.5 text-center font-medium',
                            irr >= 0.3 ? 'bg-emerald-100 text-emerald-900' : irr >= 0.2 ? 'bg-emerald-50 text-emerald-800' : irr >= 0.12 ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800',
                            center && 'ring-2 ring-navy-900 ring-inset',
                          )}
                        >
                          {pct(irr, 0)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="font-display text-sm italic text-slate-500">{title}</div>
      {children}
    </div>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'good' | 'ok' | 'bad' }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div
        className={clsx(
          'mt-1 text-xl font-semibold num',
          tone === 'good' ? 'text-emerald-700' : tone === 'ok' ? 'text-amber-700' : tone === 'bad' ? 'text-rose-700' : 'text-slate-900',
        )}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </Card>
  );
}

function Line({ label, value, total, bold }: { label: string; value: number; total?: number; bold?: boolean }) {
  return (
    <div className={clsx('flex justify-between py-1 num', bold && 'mt-1 border-t border-slate-100 pt-2 font-semibold')}>
      <span className="text-slate-600">{label}</span>
      <span>
        {money(value, 2)}
        {total !== undefined && <span className="ml-1.5 text-xs text-slate-400">{pct(value / total)}</span>}
      </span>
    </div>
  );
}

function Row({ label, vals, bold, muted }: { label: string; vals: number[]; bold?: boolean; muted?: boolean }) {
  return (
    <tr className={clsx(bold && 'font-semibold', muted && 'text-slate-400')}>
      <td className="px-4 py-1.5 text-left text-slate-600">{label}</td>
      {vals.map((v, i) => (
        <td key={i} className={clsx('px-4 py-1.5', v < 0 && !muted && 'text-slate-500')}>
          {money(v, 2)}
        </td>
      ))}
    </tr>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-slate-500">{k}</div>
      <div className="font-medium text-slate-900 num">{v}</div>
    </div>
  );
}
