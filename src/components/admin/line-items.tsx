import { useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { NumericInput, TextInput } from '@/components/admin/form-controls';

export interface LineItem {
  label: string;
  amount: string;
}

const aud = (n: number) => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

export const oneEmptyLineItem = (): LineItem[] => [{ label: '', amount: '' }];

export function LineItemsEditor({
  label, items, onChange,
}: {
  label: string;
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}) {
  const total = useMemo(
    () => items.reduce((s, it) => s + (Number(it.amount) || 0), 0),
    [items]
  );

  const setAt = (i: number, patch: Partial<LineItem>) => {
    onChange(items.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  };
  const removeAt = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { label: '', amount: '' }]);

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-widest font-bold text-primary">{label}</p>

      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2 items-stretch">
            <TextInput
              placeholder="e.g. Land acquisition"
              value={it.label}
              onChange={(e) => setAt(i, { label: e.target.value })}
              className="flex-1"
            />
            <div className="w-44 shrink-0">
              <NumericInput
                prefix="$" placeholder="0"
                value={it.amount}
                onChange={(v) => setAt(i, { amount: v })}
              />
            </div>
            <button
              type="button" onClick={() => removeAt(i)}
              disabled={items.length === 1}
              className="self-stretch w-12 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border shrink-0 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
              aria-label="Remove line item"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button" onClick={add}
          className="h-9 w-9 flex items-center justify-center border border-border bg-secondary/30 hover:bg-secondary text-primary"
          aria-label="Add line item"
        >
          <Plus size={16} />
        </button>
        <div className="text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-bold text-primary">{aud(total)}</span>
        </div>
      </div>
    </div>
  );
}

export function lineItemsToStorage(items: LineItem[]) {
  return items
    .filter((it) => it.label.trim() && it.amount !== '')
    .map((it) => ({ label: it.label.trim(), amount: Number(it.amount) }));
}
export function lineItemsFromStorage(stored: Array<{ label: string; amount: number }> | null | undefined): LineItem[] {
  if (!stored || !Array.isArray(stored) || stored.length === 0) return oneEmptyLineItem();
  return stored.map((it) => ({ label: it.label, amount: String(it.amount) }));
}
export function lineItemsTotal(items: LineItem[]) {
  return items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
}
