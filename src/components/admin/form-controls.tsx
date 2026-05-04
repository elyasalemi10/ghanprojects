import { useState, useId } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ============================================================================
// Field — label + control wrapper used across the admin/investor panels.
// ============================================================================
export function Field({
  label, required, children, className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">
        {label}{required ? ' *' : ''}
      </label>
      {children}
    </div>
  );
}

// ============================================================================
// TextInput — base styled input matching the existing pattern.
// ============================================================================
export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent',
        props.className
      )}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent',
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent',
        props.className
      )}
    />
  );
}

// ============================================================================
// NumericInput — a text input that only accepts digits and a single decimal.
// No native browser spinner arrows. Stores the raw string; emits numeric value
// via onChange. Optional decimals (default 2) and a leading $ prefix.
// ============================================================================
export function NumericInput({
  value, onChange, placeholder, required, decimals = 2, prefix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  decimals?: number;
  prefix?: string;
}) {
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    // Strip anything that isn't digit/decimal point/minus
    raw = raw.replace(/[^\d.-]/g, '');
    // Only one decimal
    const parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
    // Cap decimals
    if (decimals === 0) raw = raw.replace(/\..*/, '');
    else if (parts[1] && parts[1].length > decimals) {
      raw = parts[0] + '.' + parts[1].slice(0, decimals);
    }
    // Only one leading minus
    if (raw.indexOf('-') > 0) raw = raw.replace(/-/g, '');
    onChange(raw);
  };

  if (prefix) {
    return (
      <div className="flex">
        <span className="bg-secondary border border-border border-r-0 px-4 flex items-center text-sm font-medium text-muted-foreground">
          {prefix}
        </span>
        <input
          type="text" inputMode="decimal" value={value} onChange={handle}
          placeholder={placeholder} required={required}
          className="flex-1 bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
    );
  }
  return (
    <input
      type="text" inputMode="decimal" value={value} onChange={handle}
      placeholder={placeholder} required={required}
      className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
    />
  );
}

// ============================================================================
// DatePicker — Popover + Calendar replacing native <input type=date>.
// Stores ISO date string (YYYY-MM-DD) and only changes when the user picks.
// ============================================================================
export function DatePicker({
  value, onChange, placeholder = 'Pick a date', required,
}: {
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const date = value ? new Date(`${value}T00:00:00`) : undefined;
  const display = date ? date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : placeholder;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button" id={id}
            className={cn(
              'w-full bg-secondary/30 border border-border p-4 text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-accent',
              !value && 'text-muted-foreground'
            )}
          >
            <span className="truncate">{display}</span>
            <CalendarIcon size={16} className="shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) {
                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                onChange(iso);
                setOpen(false);
              } else {
                onChange('');
              }
            }}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
      {/* Hidden mirror so native HTML form `required` validation works */}
      {required && (
        <input
          type="text" tabIndex={-1} required value={value} onChange={() => { /* noop */ }}
          className="sr-only" aria-hidden="true"
        />
      )}
    </>
  );
}

// ============================================================================
// Section + AdvancedSettings — visual grouping for forms.
// ============================================================================
export function Section({
  title, description, children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border bg-white p-6 space-y-4">
      <div>
        <h3 className="text-base font-heading font-bold text-primary">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function AdvancedSettings({
  title = 'Advanced settings',
  defaultOpen = false,
  children,
}: {
  title?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border">
      <button
        type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-secondary/30 hover:bg-secondary/50 text-left"
      >
        <span className="text-sm font-medium text-primary">{title}</span>
        <ChevronDown size={16} className={cn('transition-transform text-muted-foreground', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="p-4 space-y-4 border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LoadingValue — shimmer bar while loading, then the value.
// Used for inline counts: "Blog posts (3)" with the 3 swapped for a small bar.
// ============================================================================
export function LoadingValue({ loading, value }: { loading: boolean; value: React.ReactNode }) {
  if (loading) return <Skeleton className="inline-block h-4 w-8 align-middle" />;
  return <>{value}</>;
}

// ============================================================================
// LoadingBlock — shimmer rows for list/table empty-while-loading states.
// Renders as a stack of decreasing-width pulsing bars rather than a spinner.
// ============================================================================
export function LoadingBlock({ rows = 4 }: { rows?: number; label?: string }) {
  const widths = ['w-full', 'w-11/12', 'w-10/12', 'w-9/12', 'w-11/12', 'w-full'];
  return (
    <div className="space-y-3 py-4" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn('h-10', widths[i % widths.length])} />
      ))}
    </div>
  );
}

// ============================================================================
// LoadingTable — shimmer rows shaped like a table, for richer skeleton.
// ============================================================================
export function LoadingTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2 py-2" aria-busy="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={cn('h-4', c === 0 ? 'w-3/4' : c === columns - 1 ? 'w-1/2' : 'w-full')} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// LoadingKpi — large shimmer block for a KPI card while loading.
// ============================================================================
export function LoadingKpi() {
  return <Skeleton className="h-7 w-24 mt-2" />;
}
