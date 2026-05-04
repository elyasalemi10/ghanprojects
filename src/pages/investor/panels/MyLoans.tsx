import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, X } from 'lucide-react';
import { authFetch } from '@/lib/auth';
import { LoadingBlock, LoadingValue } from '@/components/admin/form-controls';

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
  project: { id: string; name: string; status: string } | null;
  transactions?: Array<{
    id: string; type: string; amount: string; payment_date: string; reference: string | null;
  }>;
}

const aud = (n: string | number) => Number(n).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-secondary text-muted-foreground',
  DEFAULTED: 'bg-red-100 text-red-800',
};

const TYPE_LABELS: Record<string, string> = {
  INTEREST_PAYMENT: 'Interest payment',
  PRINCIPAL_PAYMENT: 'Principal payment',
  PROFIT_DISTRIBUTION: 'Profit distribution',
  DISBURSEMENT: 'Disbursement',
  TOP_UP: 'Top-up',
  EARLY_REPAYMENT: 'Early repayment',
};

export default function MyLoans() {
  const [list, setList] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Loan | null>(null);

  useEffect(() => {
    authFetch('/api/investor/loans').then(async (res) => {
      if (res.ok) setList(await res.json());
      setLoading(false);
    });
  }, []);

  const openDetail = async (loan: Loan) => {
    const res = await authFetch(`/api/investor/loans/${loan.id}`);
    if (res.ok) setSelected(await res.json());
  };

  if (selected) {
    const totalInterest = (selected.transactions || []).filter((t) => t.type === 'INTEREST_PAYMENT').reduce((s, t) => s + Number(t.amount), 0);
    const totalPrincipal = (selected.transactions || []).filter((t) => t.type === 'PRINCIPAL_PAYMENT' || t.type === 'EARLY_REPAYMENT').reduce((s, t) => s + Number(t.amount), 0);
    const totalProfit = (selected.transactions || []).filter((t) => t.type === 'PROFIT_DISTRIBUTION').reduce((s, t) => s + Number(t.amount), 0);

    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setSelected(null)}><X size={16} /> Back to loans</Button>

        <div className="bg-white p-8 border shadow-xl">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <p className="font-mono text-xs text-muted-foreground">{selected.reference}</p>
              <h2 className="text-2xl font-heading font-bold text-primary mt-1">
                {selected.project?.name || 'General company loan'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {selected.loan_type.replace('_', ' ')} · {Number(selected.interest_rate).toFixed(2)}% p.a. · {selected.term_months} months
              </p>
            </div>
            <span className={`inline-block px-3 py-1 text-xs font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Mini label="Principal" value={aud(selected.principal)} />
            <Mini label="Current Balance" value={aud(selected.current_balance)} highlight />
            <Mini label="Start" value={new Date(selected.start_date).toLocaleDateString('en-AU')} />
            <Mini label="Maturity" value={new Date(selected.maturity_date).toLocaleDateString('en-AU')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Mini label="Interest received (lifetime)" value={aud(totalInterest)} />
            <Mini label="Principal received (lifetime)" value={aud(totalPrincipal)} />
            <Mini label="Profit distributed (lifetime)" value={aud(totalProfit)} />
          </div>

          {selected.loan_type === 'FIXED_MONTHLY' && selected.payment_amount && selected.payment_day && (
            <div className="bg-secondary/30 p-4 mb-6 text-sm">
              <p>
                Monthly payment of <b>{aud(selected.payment_amount)}</b> on day <b>{selected.payment_day}</b> of each month.
              </p>
            </div>
          )}

          {selected.loan_type === 'PROFIT_SHARE' && selected.profit_share_percent && (
            <div className="bg-secondary/30 p-4 mb-6 text-sm">
              <p>
                Base interest <b>{Number(selected.interest_rate).toFixed(2)}%</b> p.a. plus <b>{Number(selected.profit_share_percent).toFixed(2)}%</b> share of project profit at completion.
              </p>
            </div>
          )}

          {selected.notes && (
            <div className="bg-secondary/20 p-4 mb-6 text-sm">
              <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">Notes</p>
              <p>{selected.notes}</p>
            </div>
          )}

          <h3 className="text-lg font-heading font-bold text-primary mb-4">Transaction History</h3>
          {(!selected.transactions || selected.transactions.length === 0) ? (
            <p className="text-sm text-muted-foreground">No transactions yet on this loan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <Th>Date</Th><Th>Type</Th><Th>Amount</Th><Th>Reference</Th>
                  </tr>
                </thead>
                <tbody>
                  {selected.transactions
                    .slice()
                    .sort((a, b) => b.payment_date.localeCompare(a.payment_date))
                    .map((t) => (
                      <tr key={t.id} className="border-b">
                        <td className="py-2 px-3 text-muted-foreground">{new Date(t.payment_date).toLocaleDateString('en-AU')}</td>
                        <td className="py-2 px-3">{TYPE_LABELS[t.type] || t.type}</td>
                        <td className="py-2 px-3 font-medium">{aud(t.amount)}</td>
                        <td className="py-2 px-3 text-xs text-muted-foreground">{t.reference || '—'}</td>
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

  return (
    <div className="bg-white p-10 border shadow-xl">
      <h2 className="text-xl font-heading font-bold text-primary mb-6">
        My Loans (<LoadingValue loading={loading} value={list.length} />)
      </h2>

      {loading ? (
        <LoadingBlock />
      ) : list.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">You have no loans on record yet.</p>
      ) : (
        <div className="space-y-3">
          {list.map((l) => (
            <button
              key={l.id} onClick={() => openDetail(l)}
              className="w-full text-left flex items-center justify-between gap-4 p-5 border hover:bg-secondary/20 hover:border-accent transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{l.reference}</span>
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                  <span className="text-xs text-muted-foreground">{l.loan_type.replace('_', ' ')}</span>
                </div>
                <p className="font-bold text-primary truncate">{l.project?.name || 'General company loan'}</p>
                <p className="text-sm text-muted-foreground">
                  {Number(l.interest_rate).toFixed(2)}% p.a. · matures {new Date(l.maturity_date).toLocaleDateString('en-AU')}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-heading font-bold text-primary">{aud(l.current_balance)}</p>
                <p className="text-xs text-muted-foreground">current balance</p>
              </div>
              <ChevronRight size={20} className="text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}
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
