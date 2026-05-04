import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

interface LoanLite {
  id: string; reference: string; current_balance: string;
  project: { name: string } | null;
}

interface Request {
  id: string;
  loan_id: string;
  status: Status;
  requested_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  completed_at: string | null;
  loan: { id: string; reference: string; current_balance: string; project: { name: string } | null };
  // repayment
  requested_amount?: string;
  is_partial?: boolean;
  reason?: string | null;
  // topup
  amount?: string;
  notes?: string | null;
}

const STATUS_COLORS: Record<Status, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-secondary text-muted-foreground',
  COMPLETED: 'bg-green-100 text-green-800',
};

const aud = (n: string | number) => Number(n).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

export default function InvestorRequests() {
  const [tab, setTab] = useState<'repayment' | 'topup'>('repayment');
  const [loans, setLoans] = useState<LoanLite[]>([]);
  const [repayments, setRepayments] = useState<Request[]>([]);
  const [topups, setTopups] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // form state shared across both kinds
  const [form, setForm] = useState({
    loan_id: '', amount: '', is_partial: true, reason: '', notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [l, r, t] = await Promise.all([
        authFetch('/api/investor/loans'),
        authFetch('/api/investor/repayment-requests'),
        authFetch('/api/investor/topup-requests'),
      ]);
      if (l.ok) setLoans(await l.json());
      if (r.ok) setRepayments(await r.json());
      if (t.ok) setTopups(await t.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.loan_id || !form.amount) { toast.error('Pick a loan and enter an amount'); return; }
    setSubmitting(true);
    try {
      const path = tab === 'repayment'
        ? '/api/investor/repayment-requests'
        : '/api/investor/topup-requests';
      const body = tab === 'repayment'
        ? { loan_id: form.loan_id, requested_amount: Number(form.amount), is_partial: form.is_partial, reason: form.reason || null }
        : { loan_id: form.loan_id, amount: Number(form.amount), notes: form.notes || null };
      const res = await authFetch(path, { method: 'POST', body: JSON.stringify(body) });
      if (res.ok) {
        toast.success('Request submitted');
        setCreating(false);
        setForm({ loan_id: '', amount: '', is_partial: true, reason: '', notes: '' });
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Submit failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (creating) {
    return (
      <div className="bg-white p-10 border shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold text-primary">
            New {tab === 'repayment' ? 'Early Repayment' : 'Top-Up'} Request
          </h2>
          <Button variant="outline" onClick={() => setCreating(false)}><X size={16} /> Cancel</Button>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Loan *</label>
            <select
              value={form.loan_id} onChange={(e) => setForm({ ...form, loan_id: e.target.value })} required
              className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">— Select one of your loans —</option>
              {loans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.reference} — {l.project?.name || 'General'} (balance {aud(l.current_balance)})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Amount (AUD) *</label>
            <input
              type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required
              className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {tab === 'repayment' ? (
            <>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox" checked={form.is_partial}
                  onChange={(e) => setForm({ ...form, is_partial: e.target.checked })}
                  className="w-4 h-4 accent-accent"
                />
                <span>This is a partial early repayment (uncheck if you want to pay the loan in full)</span>
              </label>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Reason (optional)</label>
                <textarea
                  value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3}
                  placeholder="Anything we should know about your request"
                  className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Notes (optional)</label>
              <textarea
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                placeholder="When are funds available, source of funds, etc."
                className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Submitting creates a pending request. The Ghan Projects team will review it and confirm before any transaction is posted.
          </p>

          <Button
            type="submit" disabled={submitting}
            className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </Button>
        </form>
      </div>
    );
  }

  const list = tab === 'repayment' ? repayments : topups;

  return (
    <div className="space-y-6">
      <div className="bg-white p-2 border shadow-md flex gap-1">
        <TabBtn active={tab === 'repayment'} onClick={() => setTab('repayment')}>
          Early Repayment ({repayments.filter((r) => r.status === 'PENDING').length})
        </TabBtn>
        <TabBtn active={tab === 'topup'} onClick={() => setTab('topup')}>
          Top-Up ({topups.filter((t) => t.status === 'PENDING').length})
        </TabBtn>
      </div>

      <div className="bg-white p-10 border shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold text-primary flex items-center gap-2">
            <Inbox size={20} /> {tab === 'repayment' ? 'My Early Repayment Requests' : 'My Top-Up Requests'}
          </h2>
          <Button onClick={() => setCreating(true)} className="gap-2"><Plus size={16} /> New Request</Button>
        </div>

        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No requests yet.</p>
        ) : (
          <div className="space-y-3">
            {list.map((r) => {
              const amount = tab === 'repayment' ? r.requested_amount : r.amount;
              const note = tab === 'repayment' ? r.reason : r.notes;
              return (
                <div key={r.id} className="border p-5">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{r.loan.reference}</p>
                      <h3 className="font-bold text-primary truncate">{r.loan.project?.name || 'General company loan'}</h3>
                      <p className="text-xs text-muted-foreground">Loan balance {aud(r.loan.current_balance)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-heading font-bold text-primary">{aud(amount || 0)}</p>
                      <span className={`inline-block mt-1 px-2 py-1 text-[10px] font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                    </div>
                  </div>
                  {note && (
                    <p className="text-sm bg-secondary/20 p-3 mb-3">{note}</p>
                  )}
                  {r.review_notes && (
                    <p className="text-sm bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                      <span className="font-medium">Review note: </span>{r.review_notes}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Submitted {new Date(r.requested_at).toLocaleString('en-AU')}</span>
                    {r.reviewed_at && <span>· Reviewed {new Date(r.reviewed_at).toLocaleString('en-AU')}</span>}
                    {r.completed_at && <span>· Completed {new Date(r.completed_at).toLocaleString('en-AU')}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-6 py-3 text-sm font-medium uppercase tracking-wider transition-colors ${
        active ? 'bg-primary text-white' : 'text-primary hover:bg-secondary/40'
      }`}
    >
      {children}
    </button>
  );
}
