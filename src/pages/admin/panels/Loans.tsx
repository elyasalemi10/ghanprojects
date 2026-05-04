import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, X, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch, hasPermission } from '@/lib/auth';
import { useAdminUser } from '../AdminLayout';
import {
  Field, TextArea, Select, NumericInput, DatePicker, LoadingBlock, LoadingValue,
} from '@/components/admin/form-controls';
import { label, LOAN_TYPE_LABELS, LOAN_STATUS_LABELS } from '@/lib/format';

type LoanType = 'FIXED_MONTHLY' | 'FIXED_END' | 'PROFIT_SHARE';
type LoanStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DEFAULTED';

interface Loan {
  id: string;
  reference: string;
  borrower_id: string;
  project_id: string | null;
  loan_type: LoanType;
  principal: string;
  current_balance: string;
  interest_rate: string;
  profit_share_percent: string | null;
  start_date: string;
  maturity_date: string;
  term_months: number;
  payment_amount: string | null;
  payment_day: number | null;
  status: LoanStatus;
  notes: string | null;
  borrower?: { id: string; full_name: string; email: string };
  project?: { id: string; name: string; status: string } | null;
}

interface BorrowerLite { id: string; full_name: string; email: string }
interface ProjectLite { id: string; name: string; status: string }

const empty = {
  borrower_id: '', project_id: '',
  loan_type: 'FIXED_MONTHLY' as LoanType,
  principal: '', interest_rate: '', profit_share_percent: '',
  start_date: '', maturity_date: '', term_months: '',
  payment_amount: '', payment_day: '',
  status: 'PENDING' as LoanStatus,
  notes: '',
};

const STATUS_COLORS: Record<LoanStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-secondary text-muted-foreground',
  DEFAULTED: 'bg-red-100 text-red-800',
};

export default function Loans() {
  const user = useAdminUser();
  const [list, setList] = useState<Loan[]>([]);
  const [borrowers, setBorrowers] = useState<BorrowerLite[]>([]);
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | LoanStatus>('');
  const [editing, setEditing] = useState<Loan | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission(user, 'loans', 'create') || user.role === 'OWNER';
  const canEdit = hasPermission(user, 'loans', 'edit') || user.role === 'OWNER';
  const canDelete = user.role === 'OWNER';

  const load = async () => {
    setLoading(true);
    try {
      const [loansRes, brRes, prRes] = await Promise.all([
        authFetch(`/api/admin/loans${statusFilter ? `?status=${statusFilter}` : ''}`),
        authFetch('/api/admin/borrowers'),
        authFetch('/api/admin/projects'),
      ]);
      if (loansRes.ok) setList(await loansRes.json());
      if (brRes.ok) setBorrowers(await brRes.json());
      if (prRes.ok) setProjects(await prRes.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [statusFilter]);

  const open = (l?: Loan) => {
    if (l) {
      setEditing(l);
      setForm({
        borrower_id: l.borrower_id, project_id: l.project_id || '',
        loan_type: l.loan_type,
        principal: l.principal, interest_rate: l.interest_rate,
        profit_share_percent: l.profit_share_percent || '',
        start_date: l.start_date, maturity_date: l.maturity_date,
        term_months: String(l.term_months),
        payment_amount: l.payment_amount || '',
        payment_day: l.payment_day != null ? String(l.payment_day) : '',
        status: l.status, notes: l.notes || '',
      });
    } else {
      setEditing(null); setForm(empty);
    }
    setCreating(true);
  };

  const close = () => { setCreating(false); setEditing(null); setForm(empty); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.loan_type === 'PROFIT_SHARE' && !form.project_id) {
      toast.error('PROFIT_SHARE loans must be linked to a project');
      return;
    }
    setSaving(true);
    try {
      const num = (v: string) => v === '' ? null : Number(v);
      const body = {
        borrower_id: form.borrower_id,
        project_id: form.project_id || null,
        loan_type: form.loan_type,
        principal: Number(form.principal),
        interest_rate: Number(form.interest_rate),
        profit_share_percent: num(form.profit_share_percent),
        start_date: form.start_date,
        maturity_date: form.maturity_date,
        term_months: Number(form.term_months),
        payment_amount: num(form.payment_amount),
        payment_day: num(form.payment_day),
        status: form.status,
        notes: form.notes || null,
      };
      const res = await authFetch(
        editing ? `/api/admin/loans/${editing.id}` : '/api/admin/loans',
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify(body) }
      );
      if (res.ok) {
        toast.success(editing ? 'Loan updated' : 'Loan created');
        close(); load();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (l: Loan) => {
    if (!confirm(`Delete loan ${l.reference}? Only allowed if no transactions exist.`)) return;
    const res = await authFetch(`/api/admin/loans/${l.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Loan deleted'); load(); }
    else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || 'Delete failed');
    }
  };

  const filtered = useMemo(() => list.filter((l) => {
    const t = search.toLowerCase();
    return l.reference.toLowerCase().includes(t)
      || l.borrower?.full_name.toLowerCase().includes(t)
      || l.project?.name?.toLowerCase().includes(t);
  }), [list, search]);

  const totalOutstanding = useMemo(
    () => list.filter((l) => l.status === 'ACTIVE' || l.status === 'PENDING')
      .reduce((sum, l) => sum + Number(l.current_balance), 0),
    [list]
  );

  if (creating) {
    const isProfitShare = form.loan_type === 'PROFIT_SHARE';
    const isMonthly = form.loan_type === 'FIXED_MONTHLY';
    return (
      <div className="bg-white p-10 border shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold text-primary">
            {editing ? `Edit Loan ${editing.reference}` : 'New Loan'}
          </h2>
          <Button variant="outline" onClick={close}><X size={16} /> Cancel</Button>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Borrower" required>
              <Select value={form.borrower_id} onChange={(e) => setForm({ ...form, borrower_id: e.target.value })} required>
                <option value="">— Select borrower —</option>
                {borrowers.map((b) => <option key={b.id} value={b.id}>{b.full_name} ({b.email})</option>)}
              </Select>
            </Field>
            <Field label={isProfitShare ? 'Project *' : 'Project (optional)'}>
              <Select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} required={isProfitShare}>
                <option value="">— None / general loan —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Loan Type" required>
              <Select value={form.loan_type} onChange={(e) => setForm({ ...form, loan_type: e.target.value as LoanType })}>
                <option value="FIXED_MONTHLY">Fixed monthly interest</option>
                <option value="FIXED_END">Fixed lump sum at end</option>
                <option value="PROFIT_SHARE">Profit share</option>
              </Select>
            </Field>
            <Field label="Status" required>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LoanStatus })}>
                {(['PENDING','ACTIVE','COMPLETED','CANCELLED','DEFAULTED'] as LoanStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Principal (AUD)" required>
              <NumericInput prefix="$" value={form.principal} onChange={(v) => setForm({ ...form, principal: v })} required placeholder="0" />
            </Field>
            <Field label="Annual Interest Rate (%)" required>
              <NumericInput value={form.interest_rate} onChange={(v) => setForm({ ...form, interest_rate: v })} required placeholder="9.00" />
            </Field>
            <Field label="Term (months)" required>
              <NumericInput value={form.term_months} onChange={(v) => setForm({ ...form, term_months: v })} required decimals={0} placeholder="12" />
            </Field>
          </div>

          {isProfitShare && (
            <Field label="Profit Share %">
              <NumericInput value={form.profit_share_percent} onChange={(v) => setForm({ ...form, profit_share_percent: v })} placeholder="20.00" />
            </Field>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Start Date" required>
              <DatePicker value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} required />
            </Field>
            <Field label="Maturity Date" required>
              <DatePicker value={form.maturity_date} onChange={(v) => setForm({ ...form, maturity_date: v })} required />
            </Field>
          </div>

          {isMonthly && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Monthly Payment Amount">
                <NumericInput prefix="$" value={form.payment_amount} onChange={(v) => setForm({ ...form, payment_amount: v })} placeholder="0" />
              </Field>
              <Field label="Payment Day of Month (1-28)">
                <NumericInput value={form.payment_day} onChange={(v) => setForm({ ...form, payment_day: v })} decimals={0} placeholder="15" />
              </Field>
            </div>
          )}

          <Field label="Notes">
            <TextArea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>

          <Button
            type="submit" disabled={saving}
            className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
          >
            {saving ? 'Saving...' : (editing ? 'Update Loan' : 'Create Loan')}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi label="Total Outstanding" value={loading ? '—' : totalOutstanding.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })} loading={loading} />
        <Kpi label="Total Loans" value={loading ? '—' : String(list.length)} loading={loading} />
        <Kpi label="Active" value={loading ? '—' : String(list.filter((l) => l.status === 'ACTIVE').length)} loading={loading} />
      </div>

      <div className="bg-white p-10 border shadow-xl">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h2 className="text-xl font-heading font-bold text-primary">
            Loans (<LoadingValue loading={loading} value={filtered.length} />)
          </h2>
          {canCreate && (
            <Button onClick={() => open()} className="gap-2"><Plus size={16} /> New Loan</Button>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text" placeholder="Search by reference, borrower, project..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <select
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as '' | LoanStatus)}
            className="px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All statuses</option>
            {(['PENDING','ACTIVE','COMPLETED','CANCELLED','DEFAULTED'] as LoanStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <LoadingBlock />
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No loans yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <Th>Reference</Th><Th>Borrower</Th><Th>Project</Th><Th>Type</Th>
                  <Th>Principal</Th><Th>Balance</Th><Th>Rate</Th><Th>Maturity</Th><Th>Status</Th>
                  <th className="text-right py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b hover:bg-secondary/20">
                    <td className="py-3 px-4 font-mono text-xs">
                      <Link to="/admin/loans/$id" params={{ id: l.id }} className="hover:text-accent inline-flex items-center gap-1">
                        {l.reference} <ChevronRight size={12} />
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm">{l.borrower?.full_name || '—'}</td>
                    <td className="py-3 px-4 text-sm">{l.project?.name || <span className="text-muted-foreground">General</span>}</td>
                    <td className="py-3 px-4 text-xs">{label(l.loan_type, LOAN_TYPE_LABELS)}</td>
                    <td className="py-3 px-4 text-sm">{money(l.principal)}</td>
                    <td className="py-3 px-4 text-sm font-medium">{money(l.current_balance)}</td>
                    <td className="py-3 px-4 text-sm">{Number(l.interest_rate).toFixed(2)}%</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(l.maturity_date).toLocaleDateString('en-AU')}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium ${STATUS_COLORS[l.status]}`}>{label(l.status, LOAN_STATUS_LABELS)}</span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {canEdit && (
                        <button onClick={() => open(l)} className="text-primary hover:text-accent inline-flex">
                          <Edit size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => remove(l)} className="text-destructive hover:text-destructive/80 inline-flex">
                          <Trash2 size={16} />
                        </button>
                      )}
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

function money(v: string | null) {
  if (v == null) return '—';
  return Number(v).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">{children}</th>;
}

function Kpi({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="bg-white p-6 border-l-4 border-accent shadow-md">
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</p>
      <p className="text-2xl font-heading font-bold text-primary mt-2">
        <LoadingValue loading={loading} value={value} />
      </p>
    </div>
  );
}
