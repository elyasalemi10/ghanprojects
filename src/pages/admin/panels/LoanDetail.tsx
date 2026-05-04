import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch, hasPermission } from '@/lib/auth';
import { useAdminUser } from '../AdminLayout';
import {
  Field, TextInput, TextArea, Select, NumericInput, DatePicker, LoadingBlock,
} from '@/components/admin/form-controls';

type TxType = 'INTEREST_PAYMENT' | 'PRINCIPAL_PAYMENT' | 'PROFIT_DISTRIBUTION' | 'DISBURSEMENT' | 'TOP_UP' | 'EARLY_REPAYMENT';

interface Transaction {
  id: string;
  type: TxType;
  amount: string;
  payment_date: string;
  reference: string | null;
  notes: string | null;
}

interface Loan {
  id: string;
  reference: string;
  loan_type: 'FIXED_MONTHLY' | 'FIXED_END' | 'PROFIT_SHARE';
  principal: string;
  current_balance: string;
  interest_rate: string;
  profit_share_percent: string | null;
  start_date: string;
  maturity_date: string;
  term_months: number;
  payment_amount: string | null;
  payment_day: number | null;
  status: string;
  notes: string | null;
  borrower: { id: string; full_name: string; email: string };
  project: { id: string; name: string; status: string } | null;
  transactions: Transaction[];
}

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

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-secondary text-muted-foreground',
  DEFAULTED: 'bg-red-100 text-red-800',
};

const aud = (n: string | number) => Number(n).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

const emptyTx = {
  type: 'INTEREST_PAYMENT' as TxType,
  amount: '',
  payment_date: new Date().toISOString().split('T')[0],
  reference: '',
  notes: '',
  interest_portion: '',
  principal_portion: '',
};

export default function LoanDetail() {
  const user = useAdminUser();
  const { id } = useParams({ strict: false }) as { id: string };
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [form, setForm] = useState(emptyTx);
  const [saving, setSaving] = useState(false);

  const canRecord = hasPermission(user, 'transactions', 'create') || user.role === 'OWNER';

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/admin/loans/${id}`);
      if (res.ok) setLoan(await res.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const num = (v: string) => v === '' ? null : Number(v);
      const body = {
        loan_id: id,
        type: form.type,
        amount: Number(form.amount),
        payment_date: form.payment_date,
        reference: form.reference || null,
        notes: form.notes || null,
        interest_portion: num(form.interest_portion),
        principal_portion: num(form.principal_portion),
      };
      const res = await authFetch('/api/admin/transactions', { method: 'POST', body: JSON.stringify(body) });
      if (res.ok) {
        toast.success('Transaction recorded');
        setRecording(false);
        setForm(emptyTx);
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock />;
  if (!loan) {
    return (
      <div className="bg-white p-12 border shadow-xl text-center">
        <p className="text-muted-foreground mb-4">Loan not found.</p>
        <Link to="/admin/loans"><Button variant="outline"><ArrowLeft size={16} /> Back to loans</Button></Link>
      </div>
    );
  }

  const txs = (loan.transactions || []).slice().sort((a, b) => b.payment_date.localeCompare(a.payment_date));
  const totalInterest = txs.filter((t) => t.type === 'INTEREST_PAYMENT').reduce((s, t) => s + Number(t.amount), 0);
  const totalPrincipal = txs.filter((t) => t.type === 'PRINCIPAL_PAYMENT' || t.type === 'EARLY_REPAYMENT').reduce((s, t) => s + Number(t.amount), 0);
  const totalProfit = txs.filter((t) => t.type === 'PROFIT_DISTRIBUTION').reduce((s, t) => s + Number(t.amount), 0);

  if (recording) {
    const isInterest = form.type === 'INTEREST_PAYMENT';
    return (
      <div className="bg-white p-10 border shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold text-primary">
            Record Transaction — {loan.reference}
          </h2>
          <Button variant="outline" onClick={() => { setRecording(false); setForm(emptyTx); }}>
            <X size={16} /> Cancel
          </Button>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Type" required>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TxType })}>
                {(Object.keys(TYPE_LABELS) as TxType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </Select>
            </Field>
            <Field label="Amount (AUD)" required>
              <NumericInput prefix="$" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} required placeholder="0" />
            </Field>
            <Field label="Payment Date" required>
              <DatePicker value={form.payment_date} onChange={(v) => setForm({ ...form, payment_date: v })} required />
            </Field>
            <Field label="Bank Reference">
              <TextInput value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            </Field>
            {isInterest && (
              <>
                <Field label="Interest Portion (optional)">
                  <NumericInput prefix="$" value={form.interest_portion} onChange={(v) => setForm({ ...form, interest_portion: v })} />
                </Field>
                <Field label="Principal Portion (optional)">
                  <NumericInput prefix="$" value={form.principal_portion} onChange={(v) => setForm({ ...form, principal_portion: v })} />
                </Field>
              </>
            )}
          </div>
          <Field label="Notes">
            <TextArea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <p className="text-xs text-muted-foreground">
            <b>Top-up</b> increases principal + balance. <b>Principal payment</b> and <b>early repayment</b> decrease balance. Other types don't change the balance.
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
      <Link to="/admin/loans" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent">
        <ArrowLeft size={14} /> Back to loans
      </Link>

      <div className="bg-white p-8 border shadow-xl">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{loan.reference}</p>
            <h2 className="text-2xl font-heading font-bold text-primary mt-1">
              {loan.borrower.full_name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {loan.project?.name || 'General company loan'} · {loan.loan_type.replace('_', ' ')} · {Number(loan.interest_rate).toFixed(2)}% p.a. · {loan.term_months} months
            </p>
          </div>
          <span className={`inline-block px-3 py-1 text-xs font-medium ${STATUS_COLORS[loan.status]}`}>{loan.status}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Mini label="Principal" value={aud(loan.principal)} />
          <Mini label="Current Balance" value={aud(loan.current_balance)} highlight />
          <Mini label="Start" value={new Date(loan.start_date).toLocaleDateString('en-AU')} />
          <Mini label="Maturity" value={new Date(loan.maturity_date).toLocaleDateString('en-AU')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Mini label="Interest paid (lifetime)" value={aud(totalInterest)} />
          <Mini label="Principal paid (lifetime)" value={aud(totalPrincipal)} />
          <Mini label="Profit distributed (lifetime)" value={aud(totalProfit)} />
        </div>

        {loan.loan_type === 'FIXED_MONTHLY' && loan.payment_amount && loan.payment_day && (
          <div className="bg-secondary/30 p-4 mb-6 text-sm">
            <p>
              Monthly payment of <b>{aud(loan.payment_amount)}</b> on day <b>{loan.payment_day}</b> of each month.
            </p>
          </div>
        )}

        {loan.loan_type === 'PROFIT_SHARE' && loan.profit_share_percent && (
          <div className="bg-secondary/30 p-4 mb-6 text-sm">
            <p>
              Base interest <b>{Number(loan.interest_rate).toFixed(2)}%</b> p.a. plus <b>{Number(loan.profit_share_percent).toFixed(2)}%</b> share of project profit at completion.
            </p>
          </div>
        )}

        {loan.notes && (
          <div className="bg-secondary/20 p-4 mb-6 text-sm">
            <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">Notes</p>
            <p>{loan.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white p-8 border shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-heading font-bold text-primary">Transactions ({txs.length})</h3>
          {canRecord && (
            <Button onClick={() => setRecording(true)} className="gap-2"><Plus size={16} /> Record Transaction</Button>
          )}
        </div>
        {txs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No transactions on this loan yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <Th>Date</Th><Th>Type</Th><Th>Amount</Th><Th>Reference</Th><Th>Notes</Th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id} className="border-b">
                    <td className="py-2 px-3 text-muted-foreground">{new Date(t.payment_date).toLocaleDateString('en-AU')}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium ${TYPE_COLORS[t.type]}`}>{TYPE_LABELS[t.type]}</span>
                    </td>
                    <td className="py-2 px-3 font-medium">{aud(t.amount)}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">{t.reference || '—'}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">{t.notes || '—'}</td>
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
  return <th className="text-left py-2 px-3 font-bold text-[10px] uppercase tracking-widest text-primary">{children}</th>;
}

function Mini({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-4 border-l-4 ${highlight ? 'border-accent bg-accent/5' : 'border-border bg-secondary/20'}`}>
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</p>
      <p className={`text-lg font-heading font-bold mt-1 ${highlight ? 'text-accent' : 'text-primary'}`}>{value}</p>
    </div>
  );
}
