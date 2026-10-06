import { Download, RotateCcw, Trash2, Upload } from 'lucide-react';
import { useRef } from 'react';
import { Button, Card, CardHeader, Field, Input, NumberInput, PageHeader, Select, Textarea } from '../components/ui';
import { DEFAULT_BUY_BOX, INDUSTRY_NAMES } from '../lib/seed';
import { exportData, useStore } from '../lib/store';
import type { Settings as SettingsT } from '../lib/types';

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const { updateSettings, updateBuyBox, resetDemo, clearAll, importData } = useStore();
  const box = settings.buyBox;
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ksx-engine-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <>
      <PageHeader title="Settings & Buy Box" subtitle="Your profile, email preferences, and the acquisition criteria used to score every company" />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="KSX buy box" subtitle="Drives the A–D fit score in Sourcing, Pipeline, and Dashboard" action={<Button size="sm" variant="ghost" onClick={() => updateBuyBox(DEFAULT_BUY_BOX)}><RotateCcw size={13} /> KSX defaults</Button>} />
          <div className="grid grid-cols-2 gap-4 p-5">
            <Field label="Min revenue">
              <NumberInput value={box.minRevenue} onChange={(v) => updateBuyBox({ minRevenue: v })} prefix="$" suffix="M" scale={1e6} />
            </Field>
            <Field label="Max revenue">
              <NumberInput value={box.maxRevenue} onChange={(v) => updateBuyBox({ maxRevenue: v })} prefix="$" suffix="M" scale={1e6} />
            </Field>
            <Field label="Min EBITDA">
              <NumberInput value={box.minEbitda} onChange={(v) => updateBuyBox({ minEbitda: v })} prefix="$" suffix="M" scale={1e6} step={0.25} />
            </Field>
            <Field label="Max EBITDA">
              <NumberInput value={box.maxEbitda} onChange={(v) => updateBuyBox({ maxEbitda: v })} prefix="$" suffix="M" scale={1e6} step={0.25} />
            </Field>
            <Field label="Min EBITDA margin">
              <NumberInput value={box.minMargin} onChange={(v) => updateBuyBox({ minMargin: v })} suffix="%" scale={0.01} />
            </Field>
            <Field label="Min recurring revenue">
              <NumberInput value={box.minRecurring} onChange={(v) => updateBuyBox({ minRecurring: v })} suffix="%" scale={0.01} step={5} />
            </Field>
            <Field label="Max top-customer concentration">
              <NumberInput value={box.maxTopCustomer} onChange={(v) => updateBuyBox({ maxTopCustomer: v })} suffix="%" scale={0.01} />
            </Field>
            <Field label="Min years in business">
              <NumberInput value={box.minYears} onChange={(v) => updateBuyBox({ minYears: v })} suffix="yrs" />
            </Field>
            <div className="col-span-2">
              <div className="mb-2 text-xs font-medium text-slate-600">Focus industries</div>
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_NAMES.map((i) => {
                  const on = box.focusIndustries.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => updateBuyBox({ focusIndustries: on ? box.focusIndustries.filter((x) => x !== i) : [...box.focusIndustries, i] })}
                      className={`rounded-[4px] border px-2.5 py-1 text-xs ${on ? 'border-navy-900 bg-navy-900 text-paper' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`}
                    >
                      {i}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Profile & email" subtitle="Used in merge fields like {{my_name}} and {{signature}}" />
            <div className="grid grid-cols-2 gap-4 p-5">
              <Field label="Name">
                <Input value={settings.userName} onChange={(e) => updateSettings({ userName: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input value={settings.userEmail} onChange={(e) => updateSettings({ userEmail: e.target.value })} />
              </Field>
              <Field label="Title">
                <Input value={settings.userTitle} onChange={(e) => updateSettings({ userTitle: e.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={settings.userPhone} onChange={(e) => updateSettings({ userPhone: e.target.value })} />
              </Field>
              <Field label="Send emails with" className="col-span-2" hint="Send opens a pre-filled draft in this client, then logs it here.">
                <Select value={settings.emailClient} onChange={(e) => updateSettings({ emailClient: e.target.value as SettingsT['emailClient'] })}>
                  <option value="gmail">Gmail (web)</option>
                  <option value="outlook">Outlook (web)</option>
                  <option value="mailto">Default mail app (mailto)</option>
                </Select>
              </Field>
              <Field label="Signature" className="col-span-2">
                <Textarea value={settings.signature} onChange={(e) => updateSettings({ signature: e.target.value })} rows={4} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Data" subtitle="Everything is stored locally in this browser" />
            <div className="flex flex-wrap gap-2 p-5">
              <Button onClick={download}>
                <Download size={15} /> Export JSON
              </Button>
              <Button onClick={() => fileRef.current?.click()}>
                <Upload size={15} /> Import JSON
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    importData(JSON.parse(await f.text()));
                    alert('Import complete.');
                  } catch {
                    alert('That file is not a valid KSX Engine export.');
                  }
                  e.target.value = '';
                }}
              />
              <Button onClick={() => confirm('Replace all data with fresh demo data?') && resetDemo()}>
                <RotateCcw size={15} /> Reset demo data
              </Button>
              <Button variant="danger" onClick={() => confirm('Delete all companies, deals, contacts, emails, and tasks? Templates and settings are kept.') && clearAll()}>
                <Trash2 size={15} /> Start empty
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
