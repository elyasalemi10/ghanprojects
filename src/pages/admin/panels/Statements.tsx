import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch, API_URL } from '@/lib/auth';

type StatementType = 'investor' | 'project' | 'combined';

interface BorrowerLite { id: string; full_name: string; email: string }
interface ProjectLite { id: string; name: string }

const aud = (n: number) => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
const today = () => new Date().toISOString().split('T')[0];
const monthsAgo = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().split('T')[0];
};

export default function Statements() {
  const [type, setType] = useState<StatementType>('combined');
  const [from, setFrom] = useState(monthsAgo(3));
  const [to, setTo] = useState(today());
  const [borrowerId, setBorrowerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [borrowers, setBorrowers] = useState<BorrowerLite[]>([]);
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      authFetch('/api/admin/borrowers'),
      authFetch('/api/admin/projects'),
    ]).then(async ([b, p]) => {
      if (b.ok) setBorrowers(await b.json());
      if (p.ok) setProjects(await p.json());
    });
  }, []);

  const generate = async () => {
    if (type === 'investor' && !borrowerId) { toast.error('Pick a borrower'); return; }
    if (type === 'project' && !projectId) { toast.error('Pick a project'); return; }
    setLoading(true);
    setStatement(null);
    try {
      const params = new URLSearchParams({ type, from, to });
      if (type === 'investor') params.set('borrowerId', borrowerId);
      if (type === 'project') params.set('projectId', projectId);
      const res = await authFetch(`/api/admin/statements?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStatement(data);
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
    const params = new URLSearchParams({ type, from, to, format: 'csv' });
    if (type === 'investor') params.set('borrowerId', borrowerId);
    if (type === 'project') params.set('projectId', projectId);
    // CSV endpoint sets Content-Disposition; we just open it. Cookies will be sent.
    window.open(`${API_URL}/api/admin/statements?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 border shadow-xl">
        <h2 className="text-xl font-heading font-bold text-primary mb-6 flex items-center gap-2">
          <FileSpreadsheet size={20} /> Generate Statement
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Type</label>
            <select
              value={type} onChange={(e) => setType(e.target.value as StatementType)}
              className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="combined">Combined (for accountant)</option>
              <option value="investor">Investor</option>
              <option value="project">Project</option>
            </select>
          </div>
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
          <div className="space-y-2">
            {type === 'investor' && (
              <>
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Investor</label>
                <select
                  value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)}
                  className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">— Select —</option>
                  {borrowers.map((b) => <option key={b.id} value={b.id}>{b.full_name}</option>)}
                </select>
              </>
            )}
            {type === 'project' && (
              <>
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Project</label>
                <select
                  value={projectId} onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">— Select —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={generate} disabled={loading} className="rounded-none bg-primary hover:bg-primary/90 text-white px-8 font-heading uppercase tracking-wider">
            {loading ? 'Generating...' : 'Generate Preview'}
          </Button>
          <Button onClick={downloadCsv} variant="outline" className="gap-2">
            <Download size={16} /> Download CSV
          </Button>
        </div>
      </div>

      {statement && (
        <div className="bg-white p-8 border shadow-xl">
          <h3 className="text-lg font-heading font-bold text-primary mb-6">Preview</h3>

          {statement.type === 'combined' && (
            <CombinedPreview statement={statement} />
          )}
          {statement.type === 'investor' && (
            <InvestorPreview statement={statement} />
          )}
          {statement.type === 'project' && (
            <ProjectPreview statement={statement} />
          )}
        </div>
      )}
    </div>
  );
}

function CombinedPreview({ statement }: { statement: any }) {
  const g = statement.grandTotals;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Mini label="Interest paid" value={aud(g.interestPaid)} />
        <Mini label="Principal paid" value={aud(g.principalPaid)} />
        <Mini label="Profit distributions" value={aud(g.profitDistributions)} />
        <Mini label="Top-ups received" value={aud(g.topUps)} />
      </div>

      <div>
        <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2">By Investor</h4>
        <Table headers={['Investor', 'Interest', 'Principal', 'Profit', 'Top-Ups', 'Total Out']}>
          {statement.byInvestor.map((v: any, i: number) => (
            <tr key={i} className="border-b">
              <td className="py-2 px-3">{v.borrower.full_name}</td>
              <td className="py-2 px-3">{aud(v.interestPaid)}</td>
              <td className="py-2 px-3">{aud(v.principalPaid)}</td>
              <td className="py-2 px-3">{aud(v.profitDistributions)}</td>
              <td className="py-2 px-3">{aud(v.topUps)}</td>
              <td className="py-2 px-3 font-medium">{aud(v.total)}</td>
            </tr>
          ))}
        </Table>
      </div>

      <div>
        <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2">By Project</h4>
        <Table headers={['Project', 'Interest', 'Principal', 'Profit', 'Total']}>
          {statement.byProject.map((v: any, i: number) => (
            <tr key={i} className="border-b">
              <td className="py-2 px-3">{v.project.name}</td>
              <td className="py-2 px-3">{aud(v.interestPaid)}</td>
              <td className="py-2 px-3">{aud(v.principalPaid)}</td>
              <td className="py-2 px-3">{aud(v.profitDistributions)}</td>
              <td className="py-2 px-3 font-medium">{aud(v.total)}</td>
            </tr>
          ))}
          {statement.generalCompanyLoans.count > 0 && (
            <tr className="border-b bg-secondary/30">
              <td className="py-2 px-3 italic">General company loans</td>
              <td className="py-2 px-3">{aud(statement.generalCompanyLoans.interestPaid)}</td>
              <td className="py-2 px-3">{aud(statement.generalCompanyLoans.principalPaid)}</td>
              <td className="py-2 px-3">{aud(statement.generalCompanyLoans.profitDistributions)}</td>
              <td className="py-2 px-3 font-medium">{aud(statement.generalCompanyLoans.total)}</td>
            </tr>
          )}
        </Table>
      </div>
    </div>
  );
}

function InvestorPreview({ statement }: { statement: any }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Investor</p>
        <p className="font-bold">{statement.investor.full_name} <span className="text-muted-foreground">({statement.investor.email})</span></p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Mini label="Interest paid" value={aud(statement.totals.interestPaid)} />
        <Mini label="Principal paid" value={aud(statement.totals.principalPaid)} />
        <Mini label="Profit distributions" value={aud(statement.totals.profitDistributions)} />
        <Mini label="Total received" value={aud(statement.totals.totalReceived)} />
      </div>
      <Table headers={['Reference', 'Project', 'Type', 'Principal', 'Balance', 'Interest', 'Principal Paid', 'Profit']}>
        {statement.loans.map((l: any) => (
          <tr key={l.loanId} className="border-b">
            <td className="py-2 px-3 font-mono text-xs">{l.reference}</td>
            <td className="py-2 px-3">{l.project?.name || 'General'}</td>
            <td className="py-2 px-3 text-xs">{l.loanType.replace('_', ' ')}</td>
            <td className="py-2 px-3">{aud(l.principal)}</td>
            <td className="py-2 px-3">{aud(l.currentBalance)}</td>
            <td className="py-2 px-3">{aud(l.periodTotals.interestPaid)}</td>
            <td className="py-2 px-3">{aud(l.periodTotals.principalPaid)}</td>
            <td className="py-2 px-3">{aud(l.periodTotals.profitDistributions)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function ProjectPreview({ statement }: { statement: any }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Project</p>
        <p className="font-bold">{statement.project.name} — {statement.project.status}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Mini label="Capital deployed" value={aud(statement.totals.totalCapital)} />
        <Mini label="Interest distributed" value={aud(statement.totals.interestPaid)} />
        <Mini label="Profit distributed" value={aud(statement.totals.profitDistributions)} />
        <Mini label="Investors" value={String(statement.investorCount)} />
      </div>
      <Table headers={['Investor', 'Reference', 'Principal', 'Balance', 'Interest', 'Principal Paid', 'Profit']}>
        {statement.investors.map((inv: any, i: number) => (
          <tr key={i} className="border-b">
            <td className="py-2 px-3">{inv.borrower.full_name}</td>
            <td className="py-2 px-3 font-mono text-xs">{inv.loanRef}</td>
            <td className="py-2 px-3">{aud(inv.principal)}</td>
            <td className="py-2 px-3">{aud(inv.currentBalance)}</td>
            <td className="py-2 px-3">{aud(inv.periodTotals.interestPaid)}</td>
            <td className="py-2 px-3">{aud(inv.periodTotals.principalPaid)}</td>
            <td className="py-2 px-3">{aud(inv.periodTotals.profitDist)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {headers.map((h) => (
              <th key={h} className="text-left py-2 px-3 font-bold text-[10px] uppercase tracking-widest text-primary">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/30 border-l-4 border-accent p-4">
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</p>
      <p className="text-lg font-heading font-bold text-primary mt-1">{value}</p>
    </div>
  );
}
