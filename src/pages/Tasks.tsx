import { CheckSquare } from 'lucide-react';
import { useState } from 'react';
import { AddTaskForm, sortTasks, TaskRow } from '../components/TaskList';
import { Card, CardHeader, EmptyState, PageHeader, Select, Stat, StatStrip, Tabs } from '../components/ui';
import { TASK_TYPES } from '../lib/constants';
import { daysFromToday } from '../lib/format';
import { useStore } from '../lib/store';
import type { Task, TaskType } from '../lib/types';

type View = 'open' | 'done' | 'all';

export default function Tasks() {
  const tasks = useStore((s) => s.tasks);
  const [view, setView] = useState<View>('open');
  const [type, setType] = useState<'all' | TaskType>('all');

  const filtered = sortTasks(
    tasks
      .filter((t) => (view === 'open' ? !t.done : view === 'done' ? t.done : true))
      .filter((t) => type === 'all' || t.type === type),
  );
  const open = tasks.filter((t) => !t.done);

  const groups: { label: string; items: Task[]; tone?: string }[] =
    view === 'open'
      ? [
          { label: 'Overdue', items: filtered.filter((t) => daysFromToday(t.dueDate) < 0), tone: 'text-rose-700' },
          { label: 'Today', items: filtered.filter((t) => daysFromToday(t.dueDate) === 0), tone: 'text-amber-700' },
          { label: 'Next 7 days', items: filtered.filter((t) => daysFromToday(t.dueDate) > 0 && daysFromToday(t.dueDate) <= 7) },
          { label: 'Later', items: filtered.filter((t) => daysFromToday(t.dueDate) > 7) },
        ]
      : [{ label: view === 'done' ? 'Completed' : 'All tasks', items: filtered }];

  return (
    <>
      <PageHeader title="Tasks & Reminders" subtitle="Follow-ups, calls, and diligence items across every deal" />

      <div className="mb-8">
        <StatStrip>
          <Stat label="Overdue" value={open.filter((t) => daysFromToday(t.dueDate) < 0).length} />
          <Stat label="Due today" value={open.filter((t) => daysFromToday(t.dueDate) === 0).length} />
          <Stat label="Open follow-ups" value={open.filter((t) => t.type === 'follow-up').length} />
          <Stat label="Done this week" value={tasks.filter((t) => t.done && t.completedAt && daysFromToday(t.completedAt) >= -7).length} />
        </StatStrip>
      </div>

      <Card className="mb-6">
        <AddTaskForm />
      </Card>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <Tabs<View>
          value={view}
          onChange={setView}
          tabs={[
            { id: 'open', label: 'Open', count: open.length },
            { id: 'done', label: 'Completed', count: tasks.length - open.length },
            { id: 'all', label: 'All' },
          ]}
        />
        <Select value={type} onChange={(e) => setType(e.target.value as 'all' | TaskType)} className="w-40">
          <option value="all">All types</option>
          {TASK_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length ? (
        <div className="space-y-5">
          {groups
            .filter((g) => g.items.length)
            .map((g) => (
              <Card key={g.label}>
                <CardHeader title={<span className={g.tone}>{g.label}</span>} subtitle={`${g.items.length} tasks`} />
                <div className="divide-y divide-slate-50">
                  {g.items.map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </div>
              </Card>
            ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={<CheckSquare size={20} />} title="No tasks here" />
        </Card>
      )}
    </>
  );
}
