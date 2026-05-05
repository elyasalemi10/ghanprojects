import { useState, useId, useRef, useLayoutEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, HelpCircle, Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ============================================================================
// Help — small ? icon with a tooltip explanation. Place inline next to a label.
// ============================================================================
export function Help({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button" tabIndex={-1}
          className="inline-flex align-middle text-muted-foreground hover:text-primary transition-colors"
          aria-label="More info"
        >
          <HelpCircle size={13} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-xs text-xs leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// Field — label + control wrapper used across the admin/investor panels.
// Optional `help` prop renders a question-mark tooltip beside the label.
// ============================================================================
export function Field({
  label, required, help, children, className,
}: {
  label: string;
  required?: boolean;
  help?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-[10px] uppercase tracking-widest font-bold text-primary inline-flex items-center gap-1.5">
        <span>{label}{required ? ' *' : ''}</span>
        {help && <Help>{help}</Help>}
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
// NumericInput — text input that only accepts digits + single decimal + minus.
// Storage is a clean string (no commas). Display formats with commas when the
// field is NOT focused; when focused, the user sees raw digits so cursor
// position is stable while typing.
// ============================================================================
function sanitiseNumeric(raw: string, decimals: number): string {
  // Strip anything that isn't digit / decimal / minus
  let v = raw.replace(/[^\d.\-]/g, '');
  // Only one decimal
  const parts = v.split('.');
  if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
  // Cap decimals
  if (decimals === 0) v = v.replace(/\..*/, '');
  else if (parts[1] && parts[1].length > decimals) {
    v = parts[0] + '.' + parts[1].slice(0, decimals);
  }
  // Only leading minus
  if (v.indexOf('-') > 0) v = v.replace(/-/g, '');
  return v;
}
function formatWithCommas(v: string): string {
  if (!v) return '';
  const negative = v.startsWith('-');
  const body = negative ? v.slice(1) : v;
  const [intPart, decPart] = body.split('.');
  const intFmt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (negative ? '-' : '') + (decPart != null ? `${intFmt}.${decPart}` : intFmt);
}

export function NumericInput({
  value, onChange, placeholder, required, decimals = 2, prefix, formatCommas = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  decimals?: number;
  prefix?: string;
  formatCommas?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Stash the cursor's logical position (digit-index) across re-renders so the
  // caret stays put even as commas are added/removed during typing.
  const pendingCaret = useRef<number | null>(null);

  const display = formatCommas ? formatWithCommas(value) : value;

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursor = input.selectionStart ?? input.value.length;
    // Logical position = how many "value" characters precede the caret,
    // counting digits / decimal point / leading minus only.
    const before = input.value.slice(0, cursor);
    const logical = before.replace(/[^\d.\-]/g, '').length;

    const sanitised = sanitiseNumeric(input.value.replace(/,/g, ''), decimals);
    pendingCaret.current = logical;
    onChange(sanitised);
  };

  // After the new value is rendered, walk the formatted string and restore the
  // caret to the spot that matches the logical position recorded above.
  useLayoutEffect(() => {
    if (pendingCaret.current === null || !inputRef.current) return;
    const target = pendingCaret.current;
    const formatted = inputRef.current.value;
    let count = 0;
    let pos = formatted.length;
    for (let i = 0; i < formatted.length; i++) {
      if (count === target) { pos = i; break; }
      if (/[\d.\-]/.test(formatted[i])) count++;
    }
    inputRef.current.setSelectionRange(pos, pos);
    pendingCaret.current = null;
  });

  const inputProps = {
    ref: inputRef,
    type: 'text' as const,
    inputMode: 'decimal' as const,
    value: display,
    onChange: handle,
    placeholder, required,
  };

  if (prefix) {
    return (
      <div className="flex">
        <span className="bg-secondary border border-border border-r-0 px-4 flex items-center text-sm font-medium text-muted-foreground">
          {prefix}
        </span>
        <input
          {...inputProps}
          className="flex-1 bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
    );
  }
  return (
    <input
      {...inputProps}
      className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
    />
  );
}

// ============================================================================
// DatePicker — Popover + Calendar replacing native <input type=date>.
// Stores ISO date string (YYYY-MM-DD). Optional minISO / maxISO disable dates
// outside the allowed range so a "to" date can't precede a "from" date.
// ============================================================================
function isoFromDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dateFromIso(iso: string | undefined | null): Date | undefined {
  if (!iso) return undefined;
  return new Date(`${iso}T00:00:00`);
}

// Sensible default range for the calendar's year-dropdown so it doesn't
// scroll back 100 years. 5 years back, 30 years forward.
const DEFAULT_CAL_START = new Date(new Date().getFullYear() - 5, 0, 1);
const DEFAULT_CAL_END = new Date(new Date().getFullYear() + 30, 11, 31);

export function DatePicker({
  value, onChange, placeholder = 'Pick a date', required, minISO, maxISO,
}: {
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  required?: boolean;
  minISO?: string;
  maxISO?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const date = dateFromIso(value);
  const display = date ? date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : placeholder;
  const minDate = dateFromIso(minISO);
  const maxDate = dateFromIso(maxISO);

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
              if (d) { onChange(isoFromDate(d)); setOpen(false); }
              else onChange('');
            }}
            captionLayout="dropdown"
            disabled={(d) => {
              if (minDate && d < minDate) return true;
              if (maxDate && d > maxDate) return true;
              return false;
            }}
            startMonth={minDate ?? DEFAULT_CAL_START}
            endMonth={maxDate ?? DEFAULT_CAL_END}
          />
        </PopoverContent>
      </Popover>
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
// DateRangePicker — single popover that picks a from/to range.
// Returns ISO strings for both endpoints.
// ============================================================================
export function DateRangePicker({
  from, to, onChange, fromPlaceholder = 'Start', toPlaceholder = 'End', minISO, maxISO,
}: {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  minISO?: string;
  maxISO?: string;
}) {
  const [open, setOpen] = useState(false);
  const fromDate = dateFromIso(from);
  const toDate = dateFromIso(to);
  const minDate = dateFromIso(minISO);
  const maxDate = dateFromIso(maxISO);

  const fmt = (d: Date | undefined, fallback: string) =>
    d ? d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : fallback;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-full bg-secondary/30 border border-border p-4 text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-accent',
            !from && !to && 'text-muted-foreground'
          )}
        >
          <span className="truncate">
            {fmt(fromDate, fromPlaceholder)} <span className="text-muted-foreground">→</span> {fmt(toDate, toPlaceholder)}
          </span>
          <CalendarIcon size={16} className="shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{ from: fromDate, to: toDate }}
          onSelect={(range) => {
            onChange({
              from: range?.from ? isoFromDate(range.from) : '',
              to: range?.to ? isoFromDate(range.to) : '',
            });
            if (range?.from && range?.to) setOpen(false);
          }}
          captionLayout="dropdown"
          numberOfMonths={2}
          disabled={(d) => {
            if (minDate && d < minDate) return true;
            if (maxDate && d > maxDate) return true;
            return false;
          }}
          startMonth={minDate ?? DEFAULT_CAL_START}
          endMonth={maxDate ?? DEFAULT_CAL_END}
        />
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Stepper — numbered dots + labels for multi-step forms. Click a completed
// step to jump back to it; future steps are not clickable.
// ============================================================================
export function Stepper({
  steps, current, onJump,
}: {
  steps: string[];
  current: number; // 1-based
  onJump?: (step: number) => void;
}) {
  return (
    <ol className="flex items-center w-full gap-2 sm:gap-4">
      {steps.map((labelText, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        const clickable = done && onJump;
        return (
          <li key={labelText} className="flex items-center flex-1 min-w-0">
            <button
              type="button"
              onClick={clickable ? () => onJump(idx) : undefined}
              disabled={!clickable}
              className={cn(
                'flex items-center gap-3 min-w-0',
                clickable && 'cursor-pointer hover:opacity-80'
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0',
                  done && 'bg-accent text-white',
                  active && 'bg-primary text-white ring-4 ring-primary/15',
                  !done && !active && 'bg-secondary text-muted-foreground'
                )}
              >
                {done ? <Check size={14} /> : idx}
              </span>
              <span
                className={cn(
                  'text-xs uppercase tracking-widest font-bold truncate hidden sm:block',
                  active ? 'text-primary' : done ? 'text-accent' : 'text-muted-foreground'
                )}
              >
                {labelText}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span className={cn(
                'flex-1 h-px mx-2 sm:mx-3 bg-border',
                done && 'bg-accent/40'
              )} />
            )}
          </li>
        );
      })}
    </ol>
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
