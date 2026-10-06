import { ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { sortTasks, TaskRow } from '../components/TaskList';
import { FitBadge, PageHeader, Section, Stat, StatStrip } from '../components/ui';
import { ACTIVE_STAGES, stageMeta } from '../lib/constants';
import { scoreFit } from '../lib/fit';
import { daysFromToday, money, relDay, timeAgo } from '../lib/format';
import { useStore } from '../lib/store';

function More({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-navy-700">
      {children} <ArrowRight size={12} />
    </Link>
  );
}

export default function Dashboard() {
  const { deals, companies, tasks, emails, contacts, activities, settings } = useStore();
  const coById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);

  const active = deals.filter((d) => ACTIVE_STAGES.includes(d.stage));
  const lateStage = active.filter((d) => ['ioi', 'loi', 'diligence', 'closing'].includes(d.stage));
  const pipelineEbitda = active.reduce((s, d) => s + (coById.get(d.companyId)?.ebitda ?? 0), 0);
  const openTasks = sortTasks(tasks.filter((t) => !t.done && daysFromToday(t.dueDate) <= 3));
  const dueTasks = openTasks.filter((t) => daysFromToday(t.dueDate) <= 0);
  const overdue = tasks.filter((t) => !t.done && daysFromToday(t.dueDate) < 0).length;
  const dueEmails = emails.filter((e) => e.status === 'scheduled' && daysFromToday(e.scheduledFor) <= 0);
  const sentThisWeek = emails.filter((e) => e.status === 'sent' && e.sentAt && daysFromToday(e.sentAt) >= -7).length;

  const inPipeline = new Set(deals.map((d) => d.companyId));
  const recommended = companies
    .filter((c) => !inPipeline.has(c.id))
    .map((c) => ({ c, fit: scoreFit(c, settings.buyBox) }))
    .sort((a, b) => b.fit.score - a.fit.score)
    .slice(0, 6);

  const stageCounts = ACTIVE_STAGES.map((s) => ({ s, n: active.filter((d) => d.stage === s).length }));
  const maxCount = Math.max(1, ...stageCounts.map((x) => x.n));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const todo = dueTasks.length + dueEmails.length;
  const subtitle =
    todo === 0
      ? 'Nothing is due today. A good day to source.'
      : `${todo} ${todo === 1 ? 'thing needs' : 'things need'} you today: ${dueTasks.length} ${dueTasks.length === 1 ? 'task' : 'tasks'} and ${dueEmails.length} ${dueEmails.length === 1 ? 'email' : 'emails'} ready to go.`;

  return (
    <>
      <PageHeader title={`${greeting}, ${settings.userName.split(' ')[0]}.`} subtitle={subtitle} />

      <StatStrip>
        <Stat label="Live deals" value={active.length} sub={`${lateStage.length} at IOI or later`} />
        <Stat label="EBITDA in the pipeline" value={money(pipelineEbitda)} sub="Sum across live deals" />
        <Stat label="Due today" value={dueTasks.length} sub={overdue ? <span className="text-rose-700">{overdue} overdue</span> : 'Nothing overdue'} />
        <Stat label="Emails this week" value={sentThisWeek} sub={`${dueEmails.length} waiting to send`} />
      </StatStrip>

      <div className="mt-10 grid gap-x-12 gap-y-10 xl:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <Section title="Coming up" subtitle="Overdue through the next three days" action={<More to="/app/tasks">All tasks</More>}>
            <div className="-mx-4 divide-y divide-slate-200">
              {openTasks.length ? openTasks.slice(0, 7).map((t) => <TaskRow key={t.id} task={t} />) : <p className="px-4 py-6 text-sm text-slate-500">You’re caught up.</p>}
            </div>
          </Section>

          <Section title="Ready to send" subtitle="Sequence emails due today" action={<More to="/app/outreach">Outreach</More>}>
            {dueEmails.length ? (
              <ul className="divide-y divide-slate-200">
                {dueEmails.slice(0, 5).map((e) => {
                  const ct = contacts.find((c) => c.id === e.contactId);
                  return (
                    <li key={e.id}>
                      <Link to="/app/outreach" className="flex items-baseline gap-4 py-3 hover:text-navy-700">
                        <span className="min-w-0 flex-1 truncate text-sm">{e.subject}</span>
                        <span className="hidden truncate text-xs text-slate-500 sm:inline">
                          {ct?.firstName} {ct?.lastName}, {ct?.organization}
                        </span>
                        <span className={`text-xs num ${daysFromToday(e.scheduledFor) < 0 ? 'text-rose-700' : 'text-amber-700'}`}>{relDay(e.scheduledFor)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-6 text-sm text-slate-500">Nothing queued. Enroll an owner in a sequence to keep outreach moving.</p>
            )}
          </Section>

          <Section title="Pipeline" subtitle={`${active.length} live`} action={<More to="/app/pipeline">Open board</More>}>
            <div className="mt-3 space-y-1.5">
              {stageCounts.map(({ s, n }) => (
                <Link to="/app/pipeline" key={s} className="group grid grid-cols-[8.5rem_1fr_2rem] items-center gap-3 py-0.5">
                  <span className="text-[13px] text-slate-600 group-hover:text-slate-900">{stageMeta(s).label}</span>
                  <div className="h-[3px] bg-slate-200">
                    <div className={`h-full ${stageMeta(s).dot}`} style={{ width: `${(n / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-right text-sm num">{n || <span className="text-slate-300">0</span>}</span>
                </Link>
              ))}
            </div>
          </Section>
        </div>

        <aside className="space-y-10">
          <Section title="Worth a look" action={<More to="/app/sourcing">Sourcing</More>}>
            <p className="mt-2 text-xs text-slate-500">Best fit with your buy box, not yet in the pipeline.</p>
            <ul className="mt-2 divide-y divide-slate-200">
              {recommended.map(({ c, fit }) => (
                <li key={c.id}>
                  <Link to={`/app/companies/${c.id}`} className="flex items-center gap-3 py-2.5 hover:text-navy-700">
                    <FitBadge fit={fit} showScore={false} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{c.name}</div>
                      <div className="truncate text-xs text-slate-500">
                        {c.subIndustry}, {c.state}
                      </div>
                    </div>
                    <span className="text-sm num">{money(c.ebitda)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Lately">
            <ol className="mt-3 max-h-[440px] space-y-3 overflow-y-auto border-l border-slate-200 pl-4">
              {activities.slice(0, 14).map((a) => (
                <li key={a.id} className="text-sm leading-snug">
                  {a.dealId ? (
                    <Link to={`/app/deals/${a.dealId}`} className="text-slate-700 hover:text-navy-700">
                      {a.text}
                    </Link>
                  ) : (
                    <span className="text-slate-700">{a.text}</span>
                  )}
                  <div className="text-xs text-slate-400">{timeAgo(a.at)}</div>
                </li>
              ))}
              {!activities.length && <li className="text-sm text-slate-500">Nothing yet.</li>}
            </ol>
          </Section>
        </aside>
      </div>
    </>
  );
}
