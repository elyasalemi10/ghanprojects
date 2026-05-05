import { useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NumericInput, TextInput } from '@/components/admin/form-controls';

export interface LineItem {
  label: string;
  amount: string; // raw digits string in state; coerced to number on submit
}

const aud = (n: number) => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

export function LineItemsEditor({
  label, items, onChange, addLabel = 'Add line item',
}: {
  label: string;
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  addLabel?: string;
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

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">No items yet — click "{addLabel}" below.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex gap-2 items-center">
              <TextInput
                placeholder="e.g. Land acquisition"
                value={it.label}
                onChange={(e) => setAt(i, { label: e.target.value })}
                className="flex-1 p-3"
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
                className="h-[50px] w-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border shrink-0"
                aria-label="Remove line item"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button type="button" onClick={add} variant="outline" size="sm" className="gap-2">
          <Plus size={14} /> {addLabel}
        </Button>
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
  if (!stored || !Array.isArray(stored)) return [];
  return stored.map((it) => ({ label: it.label, amount: String(it.amount) }));
}
export function lineItemsTotal(items: LineItem[]) {
  return items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
}
