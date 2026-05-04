import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch, hasPermission, type SessionUser } from '@/lib/auth';

type TxType = 'INTEREST_PAYMENT' | 'PRINCIPAL_PAYMENT' | 'PROFIT_DISTRIBUTION' | 'DISBURSEMENT' | 'TOP_UP' | 'EARLY_REPAYMENT';

interface Transaction {
  id: string;
  loan_id: string;
  type: TxType;
  amount: string;
  payment_date: string;
  reference: string | null;
  notes: string | null;
  interest_portion: string | null;
  principal_portion: string | null;
  created_at: string;
  loan?: {
    id: string;
    reference: string;
    borrower?: { id: string; full_name: string };
    project?: { id: string; name: string } | null;
  };
}

interface LoanLite { id: string; reference: string; borrower?: { full_name: string }; current_balance: string }

const TYPE_LABELS: Record<TxType, string> = {
  INTEREST_PAYMENT: 'Interest payment',
  PRINCIPAL_PAYMENT: 'Principal payment',
  PROFIT_DISTRIBUTION: 'Profit distribution',
  DISBURSEMENT: 'Disbursement (paid out)',
  TOP_UP: 'Top-up (received in)',
  EARLY_REPAYMENT: 'Early repayment',
};

const TYPE_COLORS: Record<TxType, string> = {
  INTEREST_PAYMENT: 'bg-blue-100 text-blue-800',
  PRINCIPAL_PAYMENT: 'bg-purple-100 text-purple-800',
  PROFIT_DISTRIBUTION: 'bg-green-100 text-green-800',
  DISBURSEMENT: 'bg-orange-100 text-orange-800',
  TOP_UP: 'bg-emerald-100 text-emerald-800',
  EARLY_REPAYMENT: 'bg-pink-100 text-pink-800',
};

const empty = {
  loan_id: '', type: 'INTEREST_PAYMENT' as TxType, amount: '',
  payment_date: new Date().toISOString().split('T')[0],
  reference: '', notes: '', interest_portion: '', principal_portion: '',
};

export default function Transactions({ user }: { user: SessionUser }) {
  const [list, setList] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<LoanLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [loanFilter, setLoanFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission(user, 'transactions', 'create') || user.role === 'OWNER';

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (loanFilter) params.set('loanId', loanFilter);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const qs = params.toString();
      const [txRes, loansRes] = await Promise.all([
        authFetch(`/api/admin/transactions${qs ? `?${qs}` : ''}`),
        authFetch('/api/admin/loans'),
      ]);
      if (txRes.ok) setList(await txRes.json());
      if (loansRes.ok) setLoans(await loansRes.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [loanFilter, from, to]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const num = (v: string) => v === '' ? null : Number(v);
      const body = {
        loan_id: form.loan_id, type: form.type,
        amount: Number(form.amount), payment_date: form.payment_date,
        reference: form.reference || null, notes: form.notes || null,
        interest_portion: num(form.interest_portion),
        principal_portion: num(form.principal_portion),
      };
      const res = await authFetch('/api/admin/transactions', { method: 'POST', body: JSON.stringify(body) });
      if (res.ok) {
        toast.success('Transaction recorded');
        setCreating(false); setForm(empty); load();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const totals = useMemo(() => {
    const t = { in: 0, out: 0, count: list.length };
    for (const tx of list) {
      const amt = Number(tx.amount);
      if (tx.type === 'TOP_UP') t.in += amt;
      else if (['INTEREST_PAYMENT', 'PRINCIPAL_PAYMENT', 'PROFIT_DISTRIBUTION', 'DISBURSEMENT', 'EARLY_REPAYMENT'].includes(tx.type)) t.out += amt;
    }
    return t;
  }, [list]);

  if (creating) {
    const isInterest = form.type === 'INTEREST_PAYMENT';
    return (
      <div className="bg-white p-10 border shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold text-primary">Record Transaction</h2>
          <Button variant="outline" onClick={() => { setCreating(false); setForm(empty); }}>
            <X size={16} /> Cancel
          </Button>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Loan *</label>
              <select
                value={form.loan_id} onChange={(e) => setForm({ ...form, loan_id: e.target.value })} required
                className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">— Select loan —</option>
                {loans.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.reference} — {l.borrower?.full_name || ''} (bal {Number(l.current_balance).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Type *</label>
              <select
                value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TxType })}
                className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {(Object.keys(TYPE_LABELS) as TxType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <Field label="Amount (AUD)" required type="number" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
            <Field label="Payment Date" required type="date" value={form.payment_date} onChange={(v) => setForm({ ...form, payment_date: v })} />
            <Field label="Bank Reference" value={form.reference} onChange={(v) => setForm({ ...form, reference: v })} />
            {isInterest && (
              <>
                <Field label="Interest Portion (optional)" type="number" value={form.interest_portion} onChange={(v) => setForm({ ...form, interest_portion: v })} />
                <Field label="Principal Portion (optional)" type="number" value={form.principal_portion} onChange={(v) => setForm({ ...form, principal_portion: v })} />
              </>
            )}
          </div>
          <Field label="Notes" textarea value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          <p className="text-xs text-muted-foreground">
            Recording a <b>top-up</b> increases the loan principal + balance. <b>Principal payment</b> and <b>early repayment</b> decrease the balance. Other types do not adjust the balance.
          </p>
          <Button
            type="submit" disabled={saving}
            className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
          >
            {saving ? 'Saving...' : 'Record Transaction'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi label="Period Inflows" value={totals.in.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })} />
        <Kpi label="Period Outflows" value={totals.out.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })} />
        <Kpi label="Transactions" value={String(totals.count)} />
      </div>

      <div className="bg-white p-10 border shadow-xl">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h2 className="text-xl font-heading font-bold text-primary">Transactions ({list.length})</h2>
          {canCreate && (
            <Button onClick={() => setCreating(true)} className="gap-2"><Plus size={16} /> Record Transaction</Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Loan</label>
            <select
              value={loanFilter} onChange={(e) => setLoanFilter(e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All loans</option>
              {loans.map((l) => <option key={l.id} value={l.id}>{l.reference} — {l.borrower?.full_name || ''}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">From</label>
            <input
              type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">To</label>
            <input
              type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : list.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No transactions in this range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <Th>Date</Th><Th>Type</Th><Th>Loan</Th><Th>Borrower</Th><Th>Amount</Th><Th>Reference</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-secondary/20">
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(tx.payment_date).toLocaleDateString('en-AU')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium ${TYPE_COLORS[tx.type]}`}>
                        {TYPE_LABELS[tx.type]}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{tx.loan?.reference || '—'}</td>
                    <td className="py-3 px-4 text-sm">{tx.loan?.borrower?.full_name || '—'}</td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {Number(tx.amount).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{tx.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">{children}</th>;
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-6 border-l-4 border-accent shadow-md">
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</p>
      <p className="text-2xl font-heading font-bold text-primary mt-2">{value}</p>
    </div>
  );
}

function Field({
  label, value, onChange, required, type = 'text', placeholder, textarea,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
  type?: string; placeholder?: string; textarea?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">{label}{required ? ' *' : ''}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      )}
    </div>
  );
}
