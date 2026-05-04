import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  Bar, Line,
} from 'recharts';
import { authFetch } from '@/lib/auth';

interface DashboardData {
  summary: {
    totalOutstanding: number;
    activeLoanCount: number;
    loansByType: Record<string, number>;
    forecastWindow: { from: string; to: string; months: number };
    totalExpectedInflows: number;
    totalScheduledOutflows: number;
    netForecast: number;
  };
  months: Array<{
    label: string;
    expectedInflows: number;
    scheduledOutflows: number;
    net: number;
    inflows: Array<{ description: string; amount: number; expectedDate: string; confidence: string; project: { name: string } | null }>;
    outflowDetail: Array<{ borrower: string; amount: number; date: string; note?: string }>;
  }>;
  projection: Array<{ label: string; runningPosition: number }>;
  activeLoans: Array<{
    id: string; reference: string; borrower: { full_name: string }; project: { name: string } | null;
    loanType: string; currentBalance: number; interestRate: number; maturityDate: string;
  }>;
}

const aud = (n: number) => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [months, setMonths] = useState(12);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/admin/dashboard?months=${months}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [months]);

  if (loading || !data) {
    return <div className="bg-white p-12 border shadow-xl text-center text-muted-foreground">Loading dashboard…</div>;
  }

  const chartData = data.months.map((m, i) => ({
    label: m.label,
    Inflows: Math.round(m.expectedInflows),
    Outflows: Math.round(m.scheduledOutflows),
    Position: Math.round(data.projection[i].runningPosition),
  }));

  const detailMonths = data.months.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi label="Total Outstanding" value={aud(data.summary.totalOutstanding)} />
        <Kpi label="Active Loans" value={String(data.summary.activeLoanCount)} />
        <Kpi label={`Inflows (${months}mo)`} value={aud(data.summary.totalExpectedInflows)} />
        <Kpi
          label={`Net Forecast (${months}mo)`}
          value={aud(data.summary.netForecast)}
          tone={data.summary.netForecast >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="bg-white p-8 border shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-heading font-bold text-primary">Cash Flow Forecast</h2>
            <p className="text-sm text-muted-foreground mt-1">Inflows vs scheduled outflows, with running position.</p>
          </div>
          <select
            value={months} onChange={(e) => setMonths(Number(e.target.value))}
            className="px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
            <option value={18}>18 months</option>
            <option value={24}>24 months</option>
          </select>
        </div>
        <div className="h-80">
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => aud(value)}
                contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Inflows" fill="hsl(40 47% 56%)" />
              <Bar dataKey="Outflows" fill="hsl(204 100% 14%)" />
              <Line type="monotone" dataKey="Position" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-8 border shadow-xl">
        <h2 className="text-xl font-heading font-bold text-primary mb-6">Next 4 Months — Detail</h2>
        <div className="space-y-2">
          {detailMonths.map((m, i) => {
            const expanded = expandedMonth === i;
            return (
              <div key={i} className="border">
                <button
                  onClick={() => setExpandedMonth(expanded ? null : i)}
                  className="w-full flex items-center justify-between p-4 hover:bg-secondary/20"
                >
                  <span className="font-medium">{m.label}</span>
                  <div className="flex gap-6 text-sm">
                    <span className="text-emerald-700">+ {aud(m.expectedInflows)}</span>
                    <span className="text-primary">- {aud(m.scheduledOutflows)}</span>
                    <span className={`font-bold ${m.net >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                      net {aud(m.net)}
                    </span>
                  </div>
                </button>
                {expanded && (
                  <div className="border-t bg-secondary/10 p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2">Inflows</p>
                      {m.inflows.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None.</p>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {m.inflows.map((inf, j) => (
                            <li key={j} className="flex justify-between gap-3">
                              <span className="truncate">
                                {inf.description}
                                {inf.project && <span className="text-muted-foreground"> ({inf.project.name})</span>}
                              </span>
                              <span className="text-emerald-700 font-medium">{aud(inf.amount)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2">Scheduled Outflows</p>
                      {m.outflowDetail.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None.</p>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {m.outflowDetail.map((o, j) => (
                            <li key={j} className="flex justify-between gap-3">
                              <span className="truncate">
                                {o.borrower}
                                {o.note && <span className="text-muted-foreground"> — {o.note}</span>}
                              </span>
                              <span className="text-primary font-medium">{aud(o.amount)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-8 border shadow-xl">
        <h2 className="text-xl font-heading font-bold text-primary mb-6">
          Active Loans ({data.activeLoans.length})
        </h2>
        {data.activeLoans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active loans yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <Th>Reference</Th><Th>Borrower</Th><Th>Project</Th><Th>Type</Th>
                  <Th>Balance</Th><Th>Rate</Th><Th>Maturity</Th>
                </tr>
              </thead>
              <tbody>
                {data.activeLoans.map((l) => (
                  <tr key={l.id} className="border-b hover:bg-secondary/20">
                    <td className="py-3 px-4 font-mono text-xs">{l.reference}</td>
                    <td className="py-3 px-4 text-sm">{l.borrower?.full_name}</td>
                    <td className="py-3 px-4 text-sm">{l.project?.name || <span className="text-muted-foreground">General</span>}</td>
                    <td className="py-3 px-4 text-xs">{l.loanType.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-sm font-medium">{aud(l.currentBalance)}</td>
                    <td className="py-3 px-4 text-sm">{l.interestRate.toFixed(2)}%</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(l.maturityDate).toLocaleDateString('en-AU')}
                    </td>
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

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  const color = tone === 'positive' ? 'text-emerald-700' : tone === 'negative' ? 'text-destructive' : 'text-primary';
  return (
    <div className="bg-white p-6 border-l-4 border-accent shadow-md">
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</p>
      <p className={`text-2xl font-heading font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}
