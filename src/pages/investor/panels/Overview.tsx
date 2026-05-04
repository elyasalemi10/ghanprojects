import { useEffect, useState } from 'react';
import { Banknote, Calendar, TrendingUp, Receipt } from 'lucide-react';
import { authFetch } from '@/lib/auth';
import { LoadingBlock } from '@/components/admin/form-controls';

interface Me {
  borrower: { id: string; full_name: string; email: string };
  summary: {
    totalInvested: number;
    activeCount: number;
    totalLoans: number;
    nextPayment: { date: string; amount: number } | null;
  };
}
interface Tx {
  id: string;
  type: string;
  amount: string;
  payment_date: string;
  loan: { reference: string; project: { name: string } | null } | null;
}

const aud = (n: number | string) => Number(n).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

const TYPE_LABELS: Record<string, string> = {
  INTEREST_PAYMENT: 'Interest payment',
  PRINCIPAL_PAYMENT: 'Principal payment',
  PROFIT_DISTRIBUTION: 'Profit distribution',
  DISBURSEMENT: 'Disbursement',
  TOP_UP: 'Top-up',
  EARLY_REPAYMENT: 'Early repayment',
};

export default function Overview() {
  const [me, setMe] = useState<Me | null>(null);
  const [recent, setRecent] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch('/api/investor/me'),
      authFetch('/api/investor/transactions'),
    ]).then(async ([m, t]) => {
      if (m.ok) setMe(await m.json());
      if (t.ok) setRecent((await t.json()).slice(0, 8));
      setLoading(false);
    });
  }, []);

  if (loading || !me) {
    return <div className="bg-white p-12 border shadow-xl"><LoadingBlock /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 border shadow-xl">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Welcome back</p>
        <h2 className="text-3xl font-heading font-bold text-primary mt-1">{me.borrower.full_name}</h2>
        <p className="text-sm text-muted-foreground mt-2">Here's a snapshot of your portfolio with Ghan Projects.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi icon={<Banknote size={18} />} label="Total Invested" value={aud(me.summary.totalInvested)} />
        <Kpi icon={<TrendingUp size={18} />} label="Active Loans" value={String(me.summary.activeCount)} />
        <Kpi icon={<Receipt size={18} />} label="Total Loans" value={String(me.summary.totalLoans)} />
        <Kpi
          icon={<Calendar size={18} />}
          label="Next Payment"
          value={me.summary.nextPayment ? aud(me.summary.nextPayment.amount) : '—'}
          sub={me.summary.nextPayment ? new Date(me.summary.nextPayment.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : 'No scheduled payments'}
        />
      </div>

      <div className="bg-white p-8 border shadow-xl">
        <h3 className="text-lg font-heading font-bold text-primary mb-4">Recent Activity</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center p-3 border hover:bg-secondary/20">
                <div className="min-w-0">
                  <p className="font-medium truncate">{TYPE_LABELS[tx.type] || tx.type}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {tx.loan?.reference} {tx.loan?.project ? `· ${tx.loan.project.name}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium">{aud(tx.amount)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.payment_date).toLocaleDateString('en-AU')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white p-6 border-l-4 border-accent shadow-md">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <p className="text-[10px] uppercase tracking-widest font-bold">{label}</p>
      </div>
      <p className="text-2xl font-heading font-bold text-primary">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
