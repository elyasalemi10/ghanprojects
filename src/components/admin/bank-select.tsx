import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface Bank {
  key: string;
  name: string;
  logo: string;
}

// 22 banks matching the files in /public/bank-logos.
// Display order follows rough Australian familiarity. "Other" handled by free text.
export const BANKS: Bank[] = [
  { key: 'cba',           name: 'Commonwealth Bank',         logo: '/bank-logos/cba.webp' },
  { key: 'westpac',       name: 'Westpac',                   logo: '/bank-logos/westpac.webp' },
  { key: 'nab',           name: 'National Australia Bank',   logo: '/bank-logos/nab.webp' },
  { key: 'anz',           name: 'ANZ',                       logo: '/bank-logos/anz.webp' },
  { key: 'macquarie',     name: 'Macquarie',                 logo: '/bank-logos/macquarie.webp' },
  { key: 'bankwest',      name: 'Bankwest',                  logo: '/bank-logos/bankwest.webp' },
  { key: 'stgeorge',      name: 'St.George',                 logo: '/bank-logos/stgeorge.webp' },
  { key: 'banksa',        name: 'BankSA',                    logo: '/bank-logos/banksa.svg' },
  { key: 'bankofmelb',    name: 'Bank of Melbourne',         logo: '/bank-logos/bankofmelb.webp' },
  { key: 'bankofqld',     name: 'Bank of Queensland',        logo: '/bank-logos/bankofqld.webp' },
  { key: 'bendigo',       name: 'Bendigo Bank',              logo: '/bank-logos/bendigo.webp' },
  { key: 'suncorp',       name: 'Suncorp Bank',              logo: '/bank-logos/suncorp.webp' },
  { key: 'ing',           name: 'ING',                       logo: '/bank-logos/ing.webp' },
  { key: 'hsbc',          name: 'HSBC',                      logo: '/bank-logos/hsbc.webp' },
  { key: 'amp',           name: 'AMP',                       logo: '/bank-logos/amp.webp' },
  { key: 'me',            name: 'ME Bank',                   logo: '/bank-logos/me.webp' },
  { key: 'ubank',         name: 'UBank',                     logo: '/bank-logos/ubank.svg' },
  { key: 'heritage',      name: 'Heritage Bank',             logo: '/bank-logos/heritage.webp' },
  { key: 'teachersmutual', name: 'Teachers Mutual',          logo: '/bank-logos/teachersmutual.webp' },
  { key: 'cuscal',        name: 'Cuscal',                    logo: '/bank-logos/cuscal.svg' },
];

// Preload all logos once on app mount so the dropdown opens instantly.
let preloaded = false;
export function preloadBankLogos() {
  if (preloaded || typeof window === 'undefined') return;
  preloaded = true;
  for (const b of BANKS) {
    const img = new Image();
    img.src = b.logo;
  }
}

export function bankByKey(key: string | null | undefined): Bank | undefined {
  if (!key) return undefined;
  return BANKS.find((b) => b.key === key);
}

export function BankSelect({
  value, onChange, placeholder = 'Select a bank…',
}: {
  value: string;
  onChange: (key: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => { preloadBankLogos(); }, []);

  const selected = bankByKey(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          className="w-full bg-secondary/30 border border-border p-4 text-left flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {selected ? (
            <span className="flex items-center gap-3 min-w-0">
              <img src={selected.logo} alt="" className="h-6 w-6 object-contain shrink-0" />
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown size={16} className="shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search banks…" />
          <CommandList>
            <CommandEmpty>No bank found.</CommandEmpty>
            <CommandGroup>
              {BANKS.map((b) => (
                <CommandItem
                  key={b.key} value={b.name}
                  onSelect={() => { onChange(b.key); setOpen(false); }}
                  className="flex items-center gap-3"
                >
                  <img src={b.logo} alt="" className="h-6 w-6 object-contain shrink-0" />
                  <span className="flex-1">{b.name}</span>
                  <Check className={cn('size-4', value === b.key ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
