import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, CheckCircle2, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth';
import { LoadingBlock, LoadingValue } from '@/components/admin/form-controls';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

interface RepaymentRequest {
  id: string;
  loan_id: string;
  requested_amount: string;
  is_partial: boolean;
  reason: string | null;
  status: Status;
  requested_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  completed_at: string | null;
  loan: { id: string; reference: string; current_balance: string; borrower: { id: string; full_name: string } | null };
}
interface TopUpRequest {
  id: string;
  loan_id: string;
  amount: string;
  notes: string | null;
  status: Status;
  requested_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  completed_at: string | null;
  loan: { id: string; reference: string; current_balance: string; borrower: { id: string; full_name: string } | null };
}

const STATUS_COLORS: Record<Status, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-secondary text-muted-foreground',
  COMPLETED: 'bg-green-100 text-green-800',
};

const aud = (n: string | number) => Number(n).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

export default function Requests() {
  const [tab, setTab] = useState<'repayment' | 'topup'>('repayment');
  const [repayment, setRepayment] = useState<RepaymentRequest[]>([]);
  const [topup, setTopup] = useState<TopUpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'' | Status>('PENDING');

  const load = async () => {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([
        authFetch('/api/admin/repayment-requests'),
        authFetch('/api/admin/topup-requests'),
      ]);
      if (r.ok) setRepayment(await r.json());
      if (t.ok) setTopup(await t.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (kind: 'repayment' | 'topup', id: string, status: Status) => {
    let notes: string | null = null;
    if (status === 'REJECTED' || status === 'APPROVED') {
      notes = window.prompt(`Notes for ${status.toLowerCase()} (optional)?`) || null;
    } else if (status === 'COMPLETED') {
      if (!confirm('Mark as completed? This will create a transaction and adjust the loan balance.')) return;
    }
    const path = kind === 'repayment'
      ? `/api/admin/repayment-requests/${id}`
      : `/api/admin/topup-requests/${id}`;
    const res = await authFetch(path, { method: 'PUT', body: JSON.stringify({ status, review_notes: notes }) });
    if (res.ok) {
      toast.success(`Marked ${status.toLowerCase()}`);
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || 'Update failed');
    }
  };

  const filteredR = repayment.filter((r) => !statusFilter || r.status === statusFilter);
  const filteredT = topup.filter((t) => !statusFilter || t.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="bg-white p-2 border shadow-md flex gap-1">
        <TabBtn active={tab === 'repayment'} onClick={() => setTab('repayment')}>
          Early Repayment (<LoadingValue loading={loading} value={repayment.filter((r) => r.status === 'PENDING').length} />)
        </TabBtn>
        <TabBtn active={tab === 'topup'} onClick={() => setTab('topup')}>
          Top-Up (<LoadingValue loading={loading} value={topup.filter((t) => t.status === 'PENDING').length} />)
        </TabBtn>
      </div>

      <div className="bg-white p-10 border shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold text-primary flex items-center gap-2">
            <Inbox size={20} /> {tab === 'repayment' ? 'Early Repayment Requests' : 'Top-Up Requests'}
          </h2>
          <select
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as '' | Status)}
            className="px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {loading ? (
          <LoadingBlock />
        ) : tab === 'repayment' ? (
          filteredR.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No matching requests.</p>
          ) : (
            <div className="space-y-4">
              {filteredR.map((r) => (
                <RequestCard
                  key={r.id} status={r.status}
                  title={`${r.loan.borrower?.full_name || '—'} — ${r.loan.reference}`}
                  amount={aud(r.requested_amount)}
                  meta={`${r.is_partial ? 'Partial' : 'Full'} early repayment · loan balance ${aud(r.loan.current_balance)}`}
                  reason={r.reason}
                  reviewNotes={r.review_notes}
                  requestedAt={r.requested_at}
                  reviewedAt={r.reviewed_at}
                  completedAt={r.completed_at}
                  onApprove={() => updateStatus('repayment', r.id, 'APPROVED')}
                  onReject={() => updateStatus('repayment', r.id, 'REJECTED')}
                  onComplete={() => updateStatus('repayment', r.id, 'COMPLETED')}
                />
              ))}
            </div>
          )
        ) : (
          filteredT.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No matching requests.</p>
          ) : (
            <div className="space-y-4">
              {filteredT.map((t) => (
                <RequestCard
                  key={t.id} status={t.status}
                  title={`${t.loan.borrower?.full_name || '—'} — ${t.loan.reference}`}
                  amount={aud(t.amount)}
                  meta={`Top-up · loan balance ${aud(t.loan.current_balance)}`}
                  reason={t.notes}
                  reviewNotes={t.review_notes}
                  requestedAt={t.requested_at}
                  reviewedAt={t.reviewed_at}
                  completedAt={t.completed_at}
                  onApprove={() => updateStatus('topup', t.id, 'APPROVED')}
                  onReject={() => updateStatus('topup', t.id, 'REJECTED')}
                  onComplete={() => updateStatus('topup', t.id, 'COMPLETED')}
                />
              ))}
            </div>
          )
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

function RequestCard({
  status, title, amount, meta, reason, reviewNotes, requestedAt, reviewedAt, completedAt,
  onApprove, onReject, onComplete,
}: {
  status: Status; title: string; amount: string; meta: string;
  reason: string | null; reviewNotes: string | null;
  requestedAt: string; reviewedAt: string | null; completedAt: string | null;
  onApprove: () => void; onReject: () => void; onComplete: () => void;
}) {
  return (
    <div className="border p-5 hover:bg-secondary/10">
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-primary truncate">{title}</h3>
          <p className="text-sm text-muted-foreground">{meta}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-heading font-bold text-primary">{amount}</p>
          <span className={`inline-block mt-1 px-2 py-1 text-[10px] font-medium ${STATUS_COLORS[status]}`}>{status}</span>
        </div>
      </div>
      {reason && (
        <p className="text-sm bg-secondary/20 p-3 mb-3"><span className="font-medium">Reason:</span> {reason}</p>
      )}
      {reviewNotes && (
        <p className="text-sm bg-secondary/20 p-3 mb-3"><span className="font-medium">Review notes:</span> {reviewNotes}</p>
      )}
      <div className="flex flex-wrap gap-3 items-center text-xs text-muted-foreground mb-4">
        <span>Requested {new Date(requestedAt).toLocaleString('en-AU')}</span>
        {reviewedAt && <span>· Reviewed {new Date(reviewedAt).toLocaleString('en-AU')}</span>}
        {completedAt && <span>· Completed {new Date(completedAt).toLocaleString('en-AU')}</span>}
      </div>
      {status === 'PENDING' && (
        <div className="flex gap-2">
          <Button onClick={onApprove} variant="outline" size="sm" className="gap-1"><Check size={14} /> Approve</Button>
          <Button onClick={onReject} variant="outline" size="sm" className="gap-1 text-destructive"><X size={14} /> Reject</Button>
          <Button onClick={onComplete} size="sm" className="gap-1 bg-accent hover:bg-accent/90"><CheckCircle2 size={14} /> Complete + Post Transaction</Button>
        </div>
      )}
      {status === 'APPROVED' && (
        <div className="flex gap-2">
          <Button onClick={onComplete} size="sm" className="gap-1 bg-accent hover:bg-accent/90"><CheckCircle2 size={14} /> Mark Complete + Post Transaction</Button>
        </div>
      )}
    </div>
  );
}
