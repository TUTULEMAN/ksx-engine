import type { ValuationInputs } from './types';

export const defaultValuation = (ebitda: number): ValuationInputs => ({
  ebitda,
  entryMultiple: 5,
  feesPct: 0.03,
  seniorDebtPct: 0.4,
  sellerNotePct: 0.1,
  seniorRate: 0.095,
  seniorTermYears: 7,
  sellerNoteRate: 0.06,
  ebitdaGrowth: 0.08,
  capexPct: 0.1,
  taxRate: 0.25,
  exitMultiple: 6,
  holdYears: 5,
});

export interface YearRow {
  year: number;
  ebitda: number;
  capex: number;
  interest: number;
  taxes: number;
  principal: number;
  fcf: number;
  dscr: number;
  seniorBalance: number;
  sellerBalance: number;
  cash: number;
}

export interface ValuationResult {
  enterpriseValue: number;
  fees: number;
  totalUses: number;
  seniorDebt: number;
  sellerNote: number;
  equity: number;
  equityPct: number;
  leverage: number;
  rows: YearRow[];
  exitEV: number;
  exitNetDebt: number;
  exitEquity: number;
  moic: number;
  irr: number;
  minDscr: number;
  year1Dscr: number;
}

/**
 * Simple search-fund LBO: senior term loan amortizes straight-line, seller note is
 * interest-only with a balloon at exit, excess free cash accumulates on the balance sheet.
 * Taxes approximate D&A as equal to capex.
 */
export function runValuation(v: ValuationInputs): ValuationResult {
  const ev = v.ebitda * v.entryMultiple;
  const fees = ev * v.feesPct;
  const totalUses = ev + fees;
  const seniorDebt = ev * v.seniorDebtPct;
  const sellerNote = ev * v.sellerNotePct;
  const equity = Math.max(0, totalUses - seniorDebt - sellerNote);
  const years = Math.max(1, Math.round(v.holdYears));
  const term = Math.max(1, v.seniorTermYears);
  const annualPrincipal = seniorDebt / term;

  let senior = seniorDebt;
  const seller = sellerNote;
  let cash = 0;
  const rows: YearRow[] = [];
  for (let y = 1; y <= years; y++) {
    const ebitda = v.ebitda * Math.pow(1 + v.ebitdaGrowth, y);
    const capex = ebitda * v.capexPct;
    const interest = senior * v.seniorRate + seller * v.sellerNoteRate;
    const taxes = Math.max(0, (ebitda - capex - interest) * v.taxRate);
    const principal = Math.min(senior, annualPrincipal);
    const debtService = interest + principal;
    const dscr = debtService > 0 ? (ebitda - capex - taxes) / debtService : Infinity;
    const fcf = ebitda - capex - interest - taxes - principal;
    senior -= principal;
    cash += fcf;
    rows.push({ year: y, ebitda, capex, interest, taxes, principal, fcf, dscr, seniorBalance: senior, sellerBalance: seller, cash });
  }

  const last = rows[rows.length - 1];
  const exitEV = last.ebitda * v.exitMultiple;
  const exitNetDebt = last.seniorBalance + last.sellerBalance - last.cash;
  const exitEquity = Math.max(0, exitEV - exitNetDebt);
  const moic = equity > 0 ? exitEquity / equity : 0;
  const irr = moic > 0 ? Math.pow(moic, 1 / years) - 1 : -1;
  const dscrs = rows.map((r) => r.dscr).filter((d) => Number.isFinite(d));

  return {
    enterpriseValue: ev,
    fees,
    totalUses,
    seniorDebt,
    sellerNote,
    equity,
    equityPct: totalUses > 0 ? equity / totalUses : 0,
    leverage: v.ebitda > 0 ? (seniorDebt + sellerNote) / v.ebitda : 0,
    rows,
    exitEV,
    exitNetDebt,
    exitEquity,
    moic,
    irr,
    minDscr: dscrs.length ? Math.min(...dscrs) : Infinity,
    year1Dscr: rows[0].dscr,
  };
}

/** Illustrative LMM private-market multiple ranges (EV / EBITDA) for comps context. */
export const INDUSTRY_COMPS: Record<string, { low: number; median: number; high: number }> = {
  'Skilled Trades': { low: 4.0, median: 5.5, high: 7.5 },
  'IT Managed Services': { low: 5.0, median: 6.5, high: 9.0 },
  'Healthcare Services': { low: 5.0, median: 7.0, high: 10.0 },
  'Business Services': { low: 4.5, median: 6.0, high: 8.0 },
  'Vertical SaaS': { low: 6.0, median: 9.0, high: 14.0 },
  'Insurance Services': { low: 6.0, median: 8.0, high: 11.0 },
  'Testing & Inspection': { low: 5.5, median: 7.5, high: 10.0 },
  'Facility Services': { low: 4.0, median: 5.5, high: 7.0 },
  'Fire & Life Safety': { low: 5.5, median: 7.5, high: 10.5 },
  'Environmental Services': { low: 4.5, median: 6.0, high: 8.5 },
  'Staffing': { low: 4.0, median: 5.5, high: 7.5 },
  'Financial Services': { low: 5.0, median: 7.0, high: 10.0 },
};
