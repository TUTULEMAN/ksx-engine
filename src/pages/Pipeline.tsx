import clsx from 'clsx';
import { Columns3, List, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, Field, FitBadge, Input, Modal, PageHeader } from '../components/ui';
import { PRIORITY_STYLE, STAGES, stageMeta } from '../lib/constants';
import { scoreFit } from '../lib/fit';
import { daysFromToday, money, timeAgo } from '../lib/format';
import { useStore } from '../lib/store';
import type { Deal, Stage } from '../lib/types';

export default function Pipeline() {
  const deals = useStore((s) => s.deals);
  const companies = useStore((s) => s.companies);
  const tasks = useStore((s) => s.tasks);
  const buyBox = useStore((s) => s.settings.buyBox);
  const moveDeal = useStore((s) => s.moveDeal);
  const navigate = useNavigate();

  const [view, setView] = useState<'board' | 'list'>('board');
  const [showPassed, setShowPassed] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [passing, setPassing] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const coById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);
  const stages = STAGES.filter((s) => showPassed || s.id !== 'passed');

  const drop = (stage: Stage) => {
    if (!dragId) return;
    if (stage === 'passed') {
      setPassing(dragId);
      setReason('');
    } else moveDeal(dragId, stage);
    setDragId(null);
    setOver(null);
  };

  const openTasks = (d: Deal) => tasks.filter((t) => t.dealId === d.id && !t.done);

  return (
    <>
      <PageHeader
        title="Pipeline"
        subtitle="Drag deals between stages. Moving to LOI creates a diligence checklist automatically."
        actions={
          <>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={showPassed} onChange={(e) => setShowPassed(e.target.checked)} className="h-4 w-4 accent-navy-900" />
              Show passed
            </label>
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
              <button onClick={() => setView('board')} className={clsx('rounded-md px-2.5 py-1.5', view === 'board' ? 'bg-navy-900 text-white' : 'text-slate-500')}>
                <Columns3 size={15} />
              </button>
              <button onClick={() => setView('list')} className={clsx('rounded-md px-2.5 py-1.5', view === 'list' ? 'bg-navy-900 text-white' : 'text-slate-500')}>
                <List size={15} />
              </button>
            </div>
            <Link to="/app/sourcing">
              <Button variant="primary">
                <Plus size={15} /> Source deals
              </Button>
            </Link>
          </>
        }
      />

      {view === 'board' ? (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
          {stages.map((s) => {
            const items = deals.filter((d) => d.stage === s.id);
            const ebitda = items.reduce((sum, d) => sum + (coById.get(d.companyId)?.ebitda ?? 0), 0);
            return (
              <div
                key={s.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(s.id);
                }}
                onDragLeave={() => setOver((o) => (o === s.id ? null : o))}
                onDrop={() => drop(s.id)}
                className={clsx('flex w-[17rem] shrink-0 flex-col transition-colors', over === s.id && 'bg-gold-300/20')}
              >
                <div className={`h-[3px] ${s.dot}`} />
                <div className="flex items-baseline justify-between px-1 pb-2.5 pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[15px] text-slate-900">{s.label}</span>
                    <span className="text-xs text-slate-400 num">{items.length}</span>
                  </div>
                  {ebitda > 0 && <span className="text-xs text-slate-400 num">{money(ebitda)} EBITDA</span>}
                </div>
                <div className="flex min-h-[120px] flex-1 flex-col gap-2 pb-2">
                  {items.map((d) => {
                    const c = coById.get(d.companyId);
                    if (!c) return null;
                    const fit = scoreFit(c, buyBox);
                    const t = openTasks(d);
                    const overdue = t.some((x) => daysFromToday(x.dueDate) < 0);
                    return (
                      <div
                        key={d.id}
                        draggable
                        onDragStart={() => setDragId(d.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => navigate(`/app/deals/${d.id}`)}
                        className={clsx(
                          'cursor-grab rounded-[5px] border border-slate-200 bg-white p-3 transition-colors hover:border-slate-400 active:cursor-grabbing',
                          dragId === d.id && 'opacity-40',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-900">{c.name}</div>
                            <div className="truncate text-xs text-slate-500">
                              {c.subIndustry} · {c.state}
                            </div>
                          </div>
                          <FitBadge fit={fit} showScore={false} />
                        </div>
                        <div className="mt-2 flex gap-3 text-xs text-slate-600 num">
                          <span>{money(c.revenue)} rev</span>
                          <span className="font-medium">{money(c.ebitda)} EBITDA</span>
                        </div>
                        {d.nextStep && <div className="mt-2 line-clamp-2 text-xs text-slate-500">→ {d.nextStep}</div>}
                        <div className="mt-2 flex items-center justify-between">
                          <Badge className={clsx('capitalize', PRIORITY_STYLE[d.priority])}>{d.priority}</Badge>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            {t.length > 0 && <span className={clsx(overdue && 'font-semibold text-rose-600')}>{t.length} tasks</span>}
                            <span>{timeAgo(d.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!items.length && <div className="flex flex-1 items-center justify-center rounded-[5px] border border-dashed border-slate-300 text-xs text-slate-400">Nothing here yet</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-left text-xs text-slate-500 [&>th]:font-normal">
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">Stage</th>
                  <th className="px-4 py-2">Fit</th>
                  <th className="px-4 py-2 text-right">EBITDA</th>
                  <th className="px-4 py-2">Priority</th>
                  <th className="px-4 py-2">Next step</th>
                  <th className="px-4 py-2">Open tasks</th>
                  <th className="px-4 py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {deals
                  .filter((d) => showPassed || d.stage !== 'passed')
                  .sort((a, b) => STAGES.findIndex((s) => s.id === b.stage) - STAGES.findIndex((s) => s.id === a.stage))
                  .map((d) => {
                    const c = coById.get(d.companyId);
                    if (!c) return null;
                    const m = stageMeta(d.stage);
                    return (
                      <tr key={d.id} className="cursor-pointer border-b border-slate-50 hover:bg-slate-50" onClick={() => navigate(`/app/deals/${d.id}`)}>
                        <td className="px-4 py-2.5">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-slate-500">{c.subIndustry}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge className={m.color}>{m.label}</Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <FitBadge fit={scoreFit(c, buyBox)} />
                        </td>
                        <td className="px-4 py-2.5 text-right num">{money(c.ebitda)}</td>
                        <td className="px-4 py-2.5">
                          <Badge className={clsx('capitalize', PRIORITY_STYLE[d.priority])}>{d.priority}</Badge>
                        </td>
                        <td className="max-w-xs truncate px-4 py-2.5 text-slate-600">{d.nextStep || '—'}</td>
                        <td className="px-4 py-2.5 num">{openTasks(d).length}</td>
                        <td className="px-4 py-2.5 text-slate-500">{timeAgo(d.updatedAt)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={!!passing}
        onClose={() => setPassing(null)}
        title="Pass on deal"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPassing(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (passing) moveDeal(passing, 'passed', reason || undefined);
                setPassing(null);
              }}
            >
              Mark as passed
            </Button>
          </>
        }
      >
        <Field label="Reason for passing" hint="Tracking pass reasons sharpens your buy box over time.">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Valuation gap, customer concentration…" autoFocus />
        </Field>
      </Modal>
    </>
  );
}
