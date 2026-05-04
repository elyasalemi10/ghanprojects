import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch, API_URL } from '@/lib/auth';

const aud = (n: number) => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
const today = () => new Date().toISOString().split('T')[0];
const monthsAgo = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().split('T')[0];
};

interface InvestorStatement {
  type: 'investor';
  period: { from: string; to: string };
  investor: { full_name: string; email: string; phone: string | null; address: string | null };
  totals: { interestPaid: number; principalPaid: number; profitDistributions: number; totalReceived: number; currentBalance: number };
  loans: Array<{
    loanId: string; reference: string; project: { name: string } | null; loanType: string;
    principal: number; currentBalance: number; interestRate: number;
    startDate: string; maturityDate: string; status: string;
    periodTotals: { interestPaid: number; principalPaid: number; profitDistributions: number; totalReceived: number };
    transactions: Array<{ date: string; type: string; amount: number; reference: string | null }>;
  }>;
  generatedAt: string;
}

export default function InvestorStatements() {
  const [from, setFrom] = useState(monthsAgo(3));
  const [to, setTo] = useState(today());
  const [statement, setStatement] = useState<InvestorStatement | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setStatement(null);
    try {
      const res = await authFetch(`/api/investor/statements?from=${from}&to=${to}`);
      if (res.ok) {
        setStatement(await res.json());
        toast.success('Statement generated');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to generate');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    window.open(`${API_URL}/api/investor/statements?from=${from}&to=${to}&format=csv`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 border shadow-xl">
        <h2 className="text-xl font-heading font-bold text-primary mb-2 flex items-center gap-2">
          <FileSpreadsheet size={20} /> Generate My Statement
        </h2>
        <p className="text-sm text-muted-foreground mb-6">Pick a date range to summarise your interest, principal and profit distributions for that period.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">From</label>
            <input
              type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">To</label>
            <input
              type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex items-end gap-3">
            <Button onClick={generate} disabled={loading} className="rounded-none bg-primary hover:bg-primary/90 text-white px-6 font-heading uppercase tracking-wider">
              {loading ? 'Generating…' : 'Preview'}
            </Button>
            <Button onClick={downloadCsv} variant="outline" className="gap-2"><Download size={16} /> CSV</Button>
          </div>
        </div>
      </div>

      {statement && (
        <div className="bg-white p-8 border shadow-xl space-y-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Period</p>
            <p className="font-medium">{statement.period.from} to {statement.period.to}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Mini label="Interest received" value={aud(statement.totals.interestPaid)} />
            <Mini label="Principal returned" value={aud(statement.totals.principalPaid)} />
            <Mini label="Profit distributions" value={aud(statement.totals.profitDistributions)} />
            <Mini label="Total received" value={aud(statement.totals.totalReceived)} highlight />
          </div>

          <div>
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2">Per Loan</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <Th>Reference</Th><Th>Project</Th><Th>Type</Th><Th>Balance</Th><Th>Interest</Th><Th>Principal</Th><Th>Profit</Th><Th>Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {statement.loans.map((l) => (
                    <tr key={l.loanId} className="border-b">
                      <td className="py-2 px-3 font-mono text-xs">{l.reference}</td>
                      <td className="py-2 px-3">{l.project?.name || 'General'}</td>
                      <td className="py-2 px-3 text-xs">{l.loanType.replace('_', ' ')}</td>
                      <td className="py-2 px-3">{aud(l.currentBalance)}</td>
                      <td className="py-2 px-3">{aud(l.periodTotals.interestPaid)}</td>
                      <td className="py-2 px-3">{aud(l.periodTotals.principalPaid)}</td>
                      <td className="py-2 px-3">{aud(l.periodTotals.profitDistributions)}</td>
                      <td className="py-2 px-3 font-medium">{aud(l.periodTotals.totalReceived)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
