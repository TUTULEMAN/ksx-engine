import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Field, PageHeader, Select } from '../components/ui';
import { ValuationModel } from '../components/ValuationModel';
import { useStore } from '../lib/store';
import { defaultValuation } from '../lib/valuation';
import type { ValuationInputs } from '../lib/types';

export default function Valuation() {
  const deals = useStore((s) => s.deals);
  const companies = useStore((s) => s.companies);
  const updateDeal = useStore((s) => s.updateDeal);
  const [dealId, setDealId] = useState('');
  const [scratch, setScratch] = useState<ValuationInputs>(defaultValuation(2e6));

  const deal = deals.find((d) => d.id === dealId);
  const company = companies.find((c) => c.id === deal?.companyId);

  return (
    <>
      <PageHeader
        title="Valuation & LBO"
        subtitle="Model purchase price, capital structure, debt coverage, and equity returns"
        actions={
          <Field label="Model for" className="w-72">
            <Select value={dealId} onChange={(e) => setDealId(e.target.value)}>
              <option value="">Scratch pad (not saved to a deal)</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {companies.find((c) => c.id === d.companyId)?.name}
                </option>
              ))}
            </Select>
          </Field>
        }
      />
      {deal && company && (
        <p className="-mt-3 mb-5 text-sm text-slate-500">
          Changes save to the{' '}
          <Link to={`/app/deals/${deal.id}`} className="text-navy-700 hover:underline">
            {company.name}
          </Link>{' '}
          deal.
        </p>
      )}
      {deal && company ? (
        <ValuationModel inputs={deal.valuation} onChange={(v) => updateDeal(deal.id, { valuation: v })} industry={company.industry} askingPrice={company.askingPrice} />
      ) : (
        <ValuationModel inputs={scratch} onChange={setScratch} />
      )}
    </>
  );
}
