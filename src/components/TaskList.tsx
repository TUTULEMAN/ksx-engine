import clsx from 'clsx';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TASK_TYPES } from '../lib/constants';
import { addDays, daysFromToday, relDay, toDateInput } from '../lib/format';
import { useStore } from '../lib/store';
import type { Task, TaskType } from '../lib/types';
import { Button, Input, Select } from './ui';

export function TaskRow({ task, showDeal = true }: { task: Task; showDeal?: boolean }) {
  const toggle = useStore((s) => s.toggleTask);
  const del = useStore((s) => s.deleteTask);
  const update = useStore((s) => s.updateTask);
  const deal = useStore((s) => s.deals.find((d) => d.id === task.dealId));
  const company = useStore((s) => s.companies.find((c) => c.id === deal?.companyId));
  const n = daysFromToday(task.dueDate);
  const overdue = !task.done && n < 0;
  const today = !task.done && n === 0;

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
      <button
        onClick={() => toggle(task.id)}
        className={clsx(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition',
          task.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 hover:border-navy-500',
        )}
        aria-label="Toggle task"
      >
        {task.done && <Check size={13} strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={clsx('truncate text-sm', task.done ? 'text-slate-400 line-through' : 'text-slate-800')}>{task.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="capitalize">{task.type.replace('-', ' ')}</span>
          {showDeal && company && (
            <Link to={`/app/deals/${deal!.id}`} className="truncate text-navy-700 hover:underline">
              {company.name}
            </Link>
          )}
        </div>
      </div>
      <label
        className={clsx(
          'relative cursor-pointer whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium num',
          overdue ? 'bg-rose-50 text-rose-700' : today ? 'bg-amber-50 text-amber-700' : 'text-slate-500',
        )}
      >
        {relDay(task.dueDate)}
        <input
          type="date"
          value={task.dueDate}
          onChange={(e) => e.target.value && update(task.id, { dueDate: e.target.value })}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <button onClick={() => del(task.id)} className="rounded p-1 text-slate-300 opacity-0 hover:text-rose-600 group-hover:opacity-100" aria-label="Delete task">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function AddTaskForm({ dealId, contactId, onDone }: { dealId?: string; contactId?: string; onDone?: () => void }) {
  const addTask = useStore((s) => s.addTask);
  const deals = useStore((s) => s.deals);
  const companies = useStore((s) => s.companies);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('follow-up');
  const [due, setDue] = useState(toDateInput(addDays(new Date(), 2)));
  const [deal, setDeal] = useState(dealId ?? '');

  const submit = () => {
    if (!title.trim()) return;
    addTask({ title: title.trim(), type, dueDate: due, dealId: deal || undefined, contactId });
    setTitle('');
    onDone?.();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3">
      <Input
        placeholder="Add a task or follow-up reminder…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="min-w-[200px] flex-1"
      />
      <Select value={type} onChange={(e) => setType(e.target.value as TaskType)} className="w-auto">
        {TASK_TYPES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </Select>
      {!dealId && (
        <Select value={deal} onChange={(e) => setDeal(e.target.value)} className="w-44">
          <option value="">No deal</option>
          {deals.map((d) => (
            <option key={d.id} value={d.id}>
              {companies.find((c) => c.id === d.companyId)?.name}
            </option>
          ))}
        </Select>
      )}
      <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-auto" />
      <Button variant="primary" onClick={submit} disabled={!title.trim()}>
        <Plus size={15} /> Add
      </Button>
    </div>
  );
}

export function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || a.dueDate.localeCompare(b.dueDate));
}
