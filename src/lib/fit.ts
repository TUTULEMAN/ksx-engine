import type { BuyBox, Company } from './types';

export interface FitCheck {
  label: string;
  pass: boolean;
  weight: number;
  detail: string;
}

export interface FitResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  checks: FitCheck[];
}

export const margin = (c: Pick<Company, 'revenue' | 'ebitda'>) => (c.revenue > 0 ? c.ebitda / c.revenue : 0);

export const yearsInBusiness = (c: Pick<Company, 'founded'>) => new Date().getFullYear() - c.founded;

/** Scores a company 0-100 against the KSX buy box; partial credit for near-misses. */
export function scoreFit(c: Company, box: BuyBox): FitResult {
  const m = margin(c);
  const yrs = yearsInBusiness(c);
  const near = (v: number, lo: number, hi: number) => {
    if (v >= lo && v <= hi) return 1;
    const d = v < lo ? (lo - v) / lo : (v - hi) / hi;
    return Math.max(0, 1 - d * 2);
  };

  const parts: { check: FitCheck; credit: number }[] = [
    {
      credit: near(c.ebitda, box.minEbitda, box.maxEbitda),
      check: { label: 'EBITDA in range', weight: 25, pass: c.ebitda >= box.minEbitda && c.ebitda <= box.maxEbitda, detail: `$${(c.ebitda / 1e6).toFixed(1)}M vs $${box.minEbitda / 1e6}–${box.maxEbitda / 1e6}M` },
    },
    {
      credit: m >= box.minMargin ? 1 : Math.max(0, m / box.minMargin - 0.3),
      check: { label: 'EBITDA margin', weight: 20, pass: m >= box.minMargin, detail: `${(m * 100).toFixed(0)}% vs ≥${(box.minMargin * 100).toFixed(0)}%` },
    },
    {
      credit: near(c.revenue, box.minRevenue, box.maxRevenue),
      check: { label: 'Revenue in range', weight: 10, pass: c.revenue >= box.minRevenue && c.revenue <= box.maxRevenue, detail: `$${(c.revenue / 1e6).toFixed(1)}M vs $${box.minRevenue / 1e6}–${box.maxRevenue / 1e6}M` },
    },
    {
      credit: Math.min(1, c.recurringPct / Math.max(box.minRecurring, 0.01)),
      check: { label: 'Recurring revenue', weight: 15, pass: c.recurringPct >= box.minRecurring, detail: `${(c.recurringPct * 100).toFixed(0)}% vs ≥${(box.minRecurring * 100).toFixed(0)}%` },
    },
    {
      credit: c.topCustomerPct <= box.maxTopCustomer ? 1 : Math.max(0, 1 - (c.topCustomerPct - box.maxTopCustomer) * 4),
      check: { label: 'Customer concentration', weight: 10, pass: c.topCustomerPct <= box.maxTopCustomer, detail: `Top customer ${(c.topCustomerPct * 100).toFixed(0)}% vs ≤${(box.maxTopCustomer * 100).toFixed(0)}%` },
    },
    {
      credit: Math.min(1, yrs / box.minYears),
      check: { label: 'Operating history', weight: 10, pass: yrs >= box.minYears, detail: `${yrs} yrs vs ≥${box.minYears}` },
    },
    {
      credit: box.focusIndustries.length === 0 || box.focusIndustries.includes(c.industry) ? 1 : 0,
      check: { label: 'Focus industry', weight: 10, pass: box.focusIndustries.length === 0 || box.focusIndustries.includes(c.industry), detail: c.industry },
    },
  ];

  const score = Math.round(parts.reduce((s, p) => s + p.credit * p.check.weight, 0));
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D';
  return { score, grade, checks: parts.map((p) => p.check) };
}

export const gradeColor: Record<FitResult['grade'], string> = {
  A: 'text-emerald-700',
  B: 'text-navy-700',
  C: 'text-amber-700',
  D: 'text-slate-400',
};
