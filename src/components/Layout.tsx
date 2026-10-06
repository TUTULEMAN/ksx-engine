import clsx from 'clsx';
import {
  Calculator,
  CheckSquare,
  FolderOpen,
  Kanban,
  LayoutDashboard,
  Mail,
  Menu,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { daysFromToday } from '../lib/format';
import { useStore } from '../lib/store';
import { Logo } from './ui';

export function Layout() {
  const [open, setOpen] = useState(false);
  const tasks = useStore((s) => s.tasks);
  const emails = useStore((s) => s.emails);
  const settings = useStore((s) => s.settings);
  const loc = useLocation();

  const dueTasks = tasks.filter((t) => !t.done && daysFromToday(t.dueDate) <= 0).length;
  const dueEmails = emails.filter((e) => e.status === 'scheduled' && daysFromToday(e.scheduledFor) <= 0).length;

  const groups = [
    {
      label: null,
      items: [{ to: '/app', label: 'Today', icon: LayoutDashboard, end: true }],
    },
    {
      label: 'Finding deals',
      items: [
        { to: '/app/sourcing', label: 'Sourcing', icon: Search },
        { to: '/app/outreach', label: 'Outreach', icon: Mail, badge: dueEmails },
        { to: '/app/contacts', label: 'Contacts', icon: Users },
      ],
    },
    {
      label: 'Working deals',
      items: [
        { to: '/app/pipeline', label: 'Pipeline', icon: Kanban },
        { to: '/app/tasks', label: 'Tasks', icon: CheckSquare, badge: dueTasks },
        { to: '/app/valuation', label: 'Valuation', icon: Calculator },
        { to: '/app/documents', label: 'Documents', icon: FolderOpen },
      ],
    },
  ];

  const link = (isActive: boolean) =>
    clsx(
      'relative flex items-center gap-2.5 rounded-[4px] px-2.5 py-[7px] text-[13.5px] transition-colors',
      isActive
        ? 'bg-white font-medium text-slate-900 before:absolute before:-left-3 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-full before:bg-gold-500'
        : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
    );

  const sidebar = (
    <div className="flex h-full flex-col border-r border-slate-200 bg-paper-deep">
      <div className="px-5 pb-6 pt-5">
        <NavLink to="/">
          <Logo />
        </NavLink>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3">
        {groups.map((g, i) => (
          <div key={i}>
            {g.label && <div className="mb-1 px-2.5 text-xs text-slate-400">{g.label}</div>}
            <div className="space-y-px">
              {g.items.map((n) => (
                <NavLink key={n.to} to={n.to} end={'end' in n ? n.end : undefined} onClick={() => setOpen(false)} className={({ isActive }) => link(isActive)}>
                  <n.icon size={16} strokeWidth={1.75} className="text-slate-500" />
                  <span className="flex-1">{n.label}</span>
                  {'badge' in n && !!n.badge && <span className="text-xs font-medium text-gold-600 num">{n.badge}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-200 px-3 py-3">
        <NavLink to="/app/settings" onClick={() => setOpen(false)} className={({ isActive }) => link(isActive)}>
          <Settings size={16} strokeWidth={1.75} className="text-slate-500" /> Buy box & settings
        </NavLink>
        <div className="mt-3 flex items-center gap-2.5 px-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 font-display text-[11px] text-paper">
            {settings.userName.split(' ').map((p) => p[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0 text-xs leading-tight">
            <div className="truncate font-medium text-slate-800">{settings.userName}</div>
            <div className="truncate text-slate-500">Operator-in-Residence</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      <aside className="hidden w-56 shrink-0 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-navy-950/30" />
          <aside className="absolute inset-y-0 left-0 w-64" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-paper px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded p-1.5 hover:bg-slate-100" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <Logo />
        </header>
        <main key={loc.pathname} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1320px] px-5 py-7 sm:px-10 sm:py-9">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
