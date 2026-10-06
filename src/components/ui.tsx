import clsx from 'clsx';
import { X } from 'lucide-react';
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { gradeColor, type FitResult } from '../lib/fit';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' }) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-[5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3.5 py-[7px] text-sm',
        variant === 'primary' && 'bg-navy-900 text-paper hover:bg-navy-800',
        variant === 'gold' && 'bg-gold-500 text-navy-950 hover:bg-gold-400',
        variant === 'secondary' && 'border border-slate-300 bg-white text-slate-800 hover:border-slate-400',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        variant === 'danger' && 'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50',
        className,
      )}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('rounded-md border border-slate-200 bg-white', className)}>{children}</div>;
}

export function CardHeader({ title, action, subtitle }: { title: ReactNode; action?: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 px-5 pb-3 pt-4">
      <div>
        <h3 className="font-display text-[15px] font-medium text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Unboxed section: a title over a hairline rule. Used where a card would just be decoration. */
export function Section({ title, subtitle, action, children, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="flex items-baseline justify-between gap-3 border-b border-slate-300 pb-2">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-medium text-slate-900">{title}</h2>
          {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-[3px] px-1.5 py-px text-[11px] font-medium', className ?? 'bg-slate-100 text-slate-600')}>
      {children}
    </span>
  );
}

export function FitBadge({ fit, showScore = true }: { fit: FitResult; showScore?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs num', gradeColor[fit.grade])} title={`KSX fit ${fit.score}/100`}>
      <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[3px] border border-current font-display text-[11px] font-semibold">{fit.grade}</span>
      {showScore && <span className="text-slate-500">{fit.score}</span>}
    </span>
  );
}

const baseField =
  'field-focus rounded-[5px] border border-slate-300 bg-white px-3 py-[7px] text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:outline-none';

/** Full width unless the caller sets its own width (w-*, flex-1, min-w-*). */
const fieldCls = (className?: string) => clsx(baseField, !/(^|\s)(w-|flex-1)/.test(className ?? '') && 'w-full', className);

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fieldCls(className)} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(fieldCls(className), 'min-h-[80px] leading-relaxed')} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={clsx(fieldCls(className), 'pr-8')}>
      {children}
    </select>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={clsx('block', className)}>
      <span className="mb-1 block text-xs text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/35 p-4 pt-[8vh]" onMouseDown={onClose}>
      <div
        className={clsx('w-full rounded-md border border-slate-200 bg-paper shadow-[0_24px_60px_-20px_rgba(14,24,41,0.45)]', wide ? 'max-w-3xl' : 'max-w-lg')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-lg font-medium">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-2 text-slate-300">{icon}</div>
      <p className="font-display text-[15px] text-slate-800">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** A row of figures separated by rules, read left to right like a ledger. */
export function StatStrip({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 border-y border-slate-300 lg:grid-cols-4 [&>*]:border-slate-200 [&>*:nth-child(even)]:border-l lg:[&>*:not(:first-child)]:border-l">
      {children}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="px-5 py-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-display text-[28px] leading-none text-slate-900 num">{value}</div>
      {sub && <div className="mt-1.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-5 overflow-x-auto border-b border-slate-300">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={clsx(
            '-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 pb-2 pt-1 text-sm transition-colors',
            value === t.id ? 'border-gold-500 font-medium text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800',
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="text-xs text-slate-400 num">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[32px] font-normal leading-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  step = 1,
  suffix,
  prefix,
  scale = 1,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
  prefix?: string;
  scale?: number;
  className?: string;
}) {
  return (
    <div className={clsx('field-focus flex items-center rounded-[5px] border border-slate-300 bg-white transition-shadow', className)}>
      {prefix && <span className="pl-3 text-sm text-slate-400">{prefix}</span>}
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? +(value / scale).toFixed(4) : ''}
        onChange={(e) => onChange((parseFloat(e.target.value) || 0) * scale)}
        className="w-full min-w-0 bg-transparent px-3 py-[7px] text-sm focus:outline-none num"
      />
      {suffix && <span className="pr-3 text-sm text-slate-400">{suffix}</span>}
    </div>
  );
}

export function LogoMark({ className, inverse }: { className?: string; inverse?: boolean }) {
  const ink = inverse ? '#f7f4ee' : '#15233b';
  const paper = inverse ? '#15233b' : '#f7f4ee';
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="4" fill={ink} />
      <path d="M11 8v16" stroke={paper} strokeWidth="3" />
      <path d="M12.5 16 21 8" stroke="#b8913f" strokeWidth="3" />
      <path d="M17.5 8H21v3.5" stroke="#b8913f" strokeWidth="2" fill="none" />
      <path d="M12.5 16 21 24" stroke={paper} strokeWidth="3" />
    </svg>
  );
}

export function Logo({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className="h-7 w-7 shrink-0" inverse={light} />
      <div className="leading-none">
        <div className={clsx('font-display text-[17px] font-medium', light ? 'text-paper' : 'text-navy-900')}>KSX Engine</div>
        <div className={clsx('mt-0.5 text-[11px]', light ? 'text-navy-300' : 'text-slate-500')}>Kingsway Search Xcelerator</div>
      </div>
    </div>
  );
}
