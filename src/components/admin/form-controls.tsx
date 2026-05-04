import { useState, useId } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
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
// LoadingValue — shows a spinner inline while loading, then the value.
// Use for things like "Blog posts (3)" → "Blog posts (⟳)" while fetching.
// ============================================================================
export function LoadingValue({ loading, value }: { loading: boolean; value: React.ReactNode }) {
  if (loading) return <Spinner className="inline-block size-3 align-middle" />;
  return <>{value}</>;
}

// ============================================================================
// LoadingBlock — centred spinner with optional label, for empty-while-loading
// list/table states.
// ============================================================================
export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <Spinner className="size-5" />
      <span>{label}</span>
    </div>
  );
}
