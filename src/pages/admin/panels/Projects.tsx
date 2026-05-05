import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch, hasPermission } from '@/lib/auth';
import { useAdminUser } from '../AdminLayout';
import { label, PROJECT_STATUS_LABELS } from '@/lib/format';
import {
  Field, TextInput, TextArea, Select, NumericInput, DatePicker, DateRangePicker,
  LoadingBlock, LoadingValue, Section, AdvancedSettings,
} from '@/components/admin/form-controls';
import { BankSelect, bankByKey } from '@/components/admin/bank-select';
import {
  LineItemsEditor, lineItemsToStorage, lineItemsFromStorage, lineItemsTotal,
  type LineItem,
} from '@/components/admin/line-items';

interface StoredLineItem { label: string; amount: number }

interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  total_cost: string | null;
  total_revenue: string | null;
  total_profit: string | null;
  cost_line_items: StoredLineItem[] | null;
  revenue_line_items: StoredLineItem[] | null;
  start_date: string | null;
  estimated_completion: string | null;
  actual_completion: string | null;
  created_at: string;
}

const STATUSES: Array<Project['status']> = ['PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD'];
const REPAYMENT_FREQUENCIES = ['MONTHLY', 'FORTNIGHTLY', 'WEEKLY', 'QUARTERLY', 'OTHER'];

const emptyProject = {
  name: '',
  description: '',
  address: '',
  status: 'PLANNING' as Project['status'],
  start_date: '',
  estimated_completion: '',
  actual_completion: '',
  cost_items: [] as LineItem[],
  revenue_items: [] as LineItem[],
  profit_override: '', // empty = use auto-calculated
};

const emptyBankLoan = {
  enabled: false,
  bank_key: '',
  loan_account_number: '',
  loan_type: 'CONSTRUCTION' as 'CONSTRUCTION' | 'OTHER',
  loan_type_other: '',
  secured: true,
  secured_to: '',
  facility_limit: '',
  amount_drawn: '',
  amount_available: '',
  interest_rate: '',
  interest_rate_type: 'FIXED' as 'FIXED' | 'VARIABLE',
  interest_rate_benchmark: 'BBSY',
  interest_rate_margin: '',
  interest_rate_date: '',
  settlement_date: '',
  maturity_date: '',
  io_start_date: '',
  io_end_date: '',
  pi_start_date: '',
  pi_end_date: '',
  repayment_frequency: 'MONTHLY',
  min_monthly_repayment: '',
  direct_debit_day: '',
  debit_bsb: '',
  debit_account_number: '',
  establishment_fee: '',
  ongoing_fees: '',
  early_repayment_terms: '',
  loan_agreement_url: '',
  mortgage_documents_url: '',
  valuation_report_url: '',
  covenants: '',
  notes: '',
};

const BENCHMARKS = [
  { key: 'BBSY', label: 'BBSY' },
  { key: 'BBSW', label: 'BBSW' },
  { key: 'RBA', label: 'RBA cash rate' },
  { key: 'OTHER', label: 'Other' },
];

export default function Projects() {
  const user = useAdminUser();
  const [list, setList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [project, setProject] = useState(emptyProject);
  const [bankLoan, setBankLoan] = useState(emptyBankLoan);
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission(user, 'projects', 'create') || user.role === 'OWNER';
  const canEdit = hasPermission(user, 'projects', 'edit') || user.role === 'OWNER';
  const canDelete = user.role === 'OWNER';

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/projects');
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const open = (p?: Project) => {
    if (p) {
      setEditing(p);
      setProject({
        name: p.name,
        description: p.description || '',
        address: p.address || '',
        status: p.status,
        start_date: p.start_date || '',
        estimated_completion: p.estimated_completion || '',
        actual_completion: p.actual_completion || '',
        cost_items: lineItemsFromStorage(p.cost_line_items),
        revenue_items: lineItemsFromStorage(p.revenue_line_items),
        profit_override: p.total_profit || '',
      });
      setBankLoan(emptyBankLoan); // editing project doesn't change bank loan here
    } else {
      setEditing(null);
      setProject(emptyProject);
      setBankLoan(emptyBankLoan);
    }
    setCreating(true);
  };

  const close = () => {
    setCreating(false); setEditing(null);
    setProject(emptyProject); setBankLoan(emptyBankLoan);
  };

  const totalCost = useMemo(() => lineItemsTotal(project.cost_items), [project.cost_items]);
  const totalRevenue = useMemo(() => lineItemsTotal(project.revenue_items), [project.revenue_items]);
  const autoProfit = totalRevenue - totalCost;
  const finalProfit = project.profit_override === '' ? autoProfit : Number(project.profit_override);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (project.status === 'COMPLETED' && !project.actual_completion) {
      toast.error('Please pick the actual completion date');
      return;
    }
    if (bankLoan.enabled && !bankLoan.bank_key) {
      toast.error('Pick a bank or untick "Add bank facility"');
      return;
    }
    if (bankLoan.enabled && bankLoan.loan_type === 'OTHER' && !bankLoan.loan_type_other) {
      toast.error('Specify the loan type');
      return;
    }
    if (bankLoan.enabled && bankLoan.secured && !bankLoan.secured_to) {
      toast.error('What is this loan secured to?');
      return;
    }

    setSaving(true);
    try {
      const num = (v: string) => v === '' ? null : Number(v);
      const date = (v: string) => v || null;

      const projectPayload = {
        name: project.name,
        description: project.description || null,
        address: project.address || null,
        status: project.status,
        total_cost: totalCost > 0 ? totalCost : null,
        total_revenue: totalRevenue > 0 ? totalRevenue : null,
        total_profit: finalProfit !== 0 ? finalProfit : null,
        cost_line_items: project.cost_items.length > 0 ? lineItemsToStorage(project.cost_items) : null,
        revenue_line_items: project.revenue_items.length > 0 ? lineItemsToStorage(project.revenue_items) : null,
        start_date: date(project.start_date),
        estimated_completion: date(project.estimated_completion),
        actual_completion: project.status === 'COMPLETED' ? date(project.actual_completion) : null,
      };

      if (editing) {
        const res = await authFetch(`/api/admin/projects/${editing.id}`, {
          method: 'PUT', body: JSON.stringify(projectPayload),
        });
        if (res.ok) { toast.success('Project updated'); close(); load(); }
        else { const err = await res.json().catch(() => ({})); toast.error(err.error || 'Save failed'); }
      } else {
        // Create + optional bank loan in one call
        const bank = bankByKey(bankLoan.bank_key);
        const bankLoanPayload = bankLoan.enabled && bank ? {
          bank_key: bank.key,
          bank_name: bank.name,
          loan_account_number: bankLoan.loan_account_number || null,
          loan_type: bankLoan.loan_type,
          loan_type_other: bankLoan.loan_type === 'OTHER' ? bankLoan.loan_type_other : null,
          secured: bankLoan.secured,
          secured_to: bankLoan.secured ? bankLoan.secured_to : null,
          facility_limit: num(bankLoan.facility_limit),
          amount_drawn: num(bankLoan.amount_drawn),
          amount_available: num(bankLoan.amount_available),
          interest_rate: num(bankLoan.interest_rate),
          interest_rate_type: bankLoan.interest_rate_type,
          interest_rate_benchmark: bankLoan.interest_rate_type === 'VARIABLE' ? bankLoan.interest_rate_benchmark : null,
          interest_rate_margin: bankLoan.interest_rate_type === 'VARIABLE' ? num(bankLoan.interest_rate_margin) : null,
          interest_rate_date: date(bankLoan.interest_rate_date),
          settlement_date: date(bankLoan.settlement_date),
          maturity_date: date(bankLoan.maturity_date),
          io_start_date: date(bankLoan.io_start_date),
          io_end_date: date(bankLoan.io_end_date),
          pi_start_date: date(bankLoan.pi_start_date),
          pi_end_date: date(bankLoan.pi_end_date),
          repayment_frequency: bankLoan.repayment_frequency,
          min_monthly_repayment: num(bankLoan.min_monthly_repayment),
          direct_debit_day: num(bankLoan.direct_debit_day),
          debit_bsb: bankLoan.debit_bsb || null,
          debit_account_number: bankLoan.debit_account_number || null,
          establishment_fee: num(bankLoan.establishment_fee),
          ongoing_fees: bankLoan.ongoing_fees || null,
          early_repayment_terms: bankLoan.early_repayment_terms || null,
          loan_agreement_url: bankLoan.loan_agreement_url || null,
          mortgage_documents_url: bankLoan.mortgage_documents_url || null,
          valuation_report_url: bankLoan.valuation_report_url || null,
          covenants: bankLoan.covenants || null,
          notes: bankLoan.notes || null,
        } : null;

        const res = await authFetch('/api/admin/projects/with-bank-loan', {
          method: 'POST',
          body: JSON.stringify({ project: projectPayload, bankLoan: bankLoanPayload }),
        });
        if (res.ok) {
          toast.success(bankLoanPayload ? 'Project & bank facility created' : 'Project created');
          close(); load();
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || 'Save failed');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Project) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    const res = await authFetch(`/api/admin/projects/${p.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Project deleted'); load(); }
    else { const err = await res.json().catch(() => ({})); toast.error(err.error || 'Delete failed'); }
  };

  const filtered = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  // ============================================================================
  // CREATE / EDIT FORM
  // ============================================================================
  if (creating) {
    const isProfitOverridden = project.profit_override !== '';
    const showActualCompletion = project.status === 'COMPLETED';
    const showOtherLoanType = bankLoan.loan_type === 'OTHER';
    const showPeggedTo = bankLoan.interest_rate_type === 'VARIABLE';

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 border shadow-xl flex justify-between items-center">
          <h2 className="text-xl font-heading font-bold text-primary">
            {editing ? 'Edit Project' : 'New Project'}
          </h2>
          <Button variant="outline" onClick={close}><X size={16} /> Cancel</Button>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Section title="Basics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Name" required>
                <TextInput value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} required />
              </Field>
              <Field label="Status">
                <Select value={project.status} onChange={(e) => setProject({ ...project, status: e.target.value as Project['status'] })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{label(s, PROJECT_STATUS_LABELS)}</option>)}
                </Select>
              </Field>
              <Field label="Address">
                <TextInput value={project.address} onChange={(e) => setProject({ ...project, address: e.target.value })} />
              </Field>
              <Field label="Description">
                <TextArea rows={3} value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} />
              </Field>
            </div>
          </Section>

          <Section title="Financials" description="Break down the cost and revenue line by line. Profit auto-calculates from the difference, but you can override.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LineItemsEditor
                label="Estimated Cost"
                items={project.cost_items}
                onChange={(items) => setProject({ ...project, cost_items: items })}
                addLabel="Add cost item"
              />
              <LineItemsEditor
                label="Estimated Revenue"
                items={project.revenue_items}
                onChange={(items) => setProject({ ...project, revenue_items: items })}
                addLabel="Add revenue item"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-secondary/30 border-l-4 border-primary p-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Total Cost</p>
                <p className="text-lg font-heading font-bold text-primary mt-1">{aud(totalCost)}</p>
              </div>
              <div className="bg-secondary/30 border-l-4 border-primary p-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-heading font-bold text-primary mt-1">{aud(totalRevenue)}</p>
              </div>
              <div className="bg-accent/10 border-l-4 border-accent p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Estimated Profit {isProfitOverridden ? '(override)' : '(auto)'}</p>
                  {isProfitOverridden && (
                    <button type="button" onClick={() => setProject({ ...project, profit_override: '' })} className="text-[10px] text-accent hover:underline">use auto</button>
                  )}
                </div>
                <NumericInput
                  prefix="$"
                  value={isProfitOverridden ? project.profit_override : String(autoProfit)}
                  onChange={(v) => setProject({ ...project, profit_override: v })}
                />
              </div>
            </div>
          </Section>

          <Section title="Timeline">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="Start Date">
                <DatePicker
                  value={project.start_date}
                  onChange={(v) => setProject({ ...project, start_date: v })}
                  maxISO={project.estimated_completion || undefined}
                />
              </Field>
              <Field label="Estimated Completion">
                <DatePicker
                  value={project.estimated_completion}
                  onChange={(v) => setProject({ ...project, estimated_completion: v })}
                  minISO={project.start_date || undefined}
                />
              </Field>
              {showActualCompletion && (
                <Field label="Actual Completion" required>
                  <DatePicker
                    value={project.actual_completion}
                    onChange={(v) => setProject({ ...project, actual_completion: v })}
                    required
                    minISO={project.start_date || undefined}
                  />
                </Field>
              )}
            </div>
          </Section>

          {!editing && (
            <Section title="Bank Facility" description="Optional. Link this project to a bank loan. The lender is the bank, no investor account is created.">
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox" checked={bankLoan.enabled}
                  onChange={(e) => setBankLoan({ ...bankLoan, enabled: e.target.checked })}
                  className="w-4 h-4 accent-accent"
                />
                <span>Add a bank facility for this project</span>
              </label>

              {bankLoan.enabled && (
                <div className="space-y-6 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Bank" required>
                      <BankSelect value={bankLoan.bank_key} onChange={(v) => setBankLoan({ ...bankLoan, bank_key: v })} />
                    </Field>
                    <Field label="Loan Account Number">
                      <TextInput value={bankLoan.loan_account_number} onChange={(e) => setBankLoan({ ...bankLoan, loan_account_number: e.target.value })} />
                    </Field>
                    <Field label="Loan Type" required>
                      <Select value={bankLoan.loan_type} onChange={(e) => setBankLoan({ ...bankLoan, loan_type: e.target.value as 'CONSTRUCTION' | 'OTHER' })}>
                        <option value="CONSTRUCTION">Construction</option>
                        <option value="OTHER">Other (specify)</option>
                      </Select>
                    </Field>
                    {showOtherLoanType && (
                      <Field label="Specify Loan Type" required>
                        <TextInput value={bankLoan.loan_type_other} onChange={(e) => setBankLoan({ ...bankLoan, loan_type_other: e.target.value })} required placeholder="e.g. Bridging facility" />
                      </Field>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Field label="Facility Limit" help="The maximum total you're allowed to draw from this facility.">
                      <NumericInput prefix="$" value={bankLoan.facility_limit} onChange={(v) => setBankLoan({ ...bankLoan, facility_limit: v })} />
                    </Field>
                    <Field label="Amount Drawn" help="How much of the facility you've already used.">
                      <NumericInput prefix="$" value={bankLoan.amount_drawn} onChange={(v) => setBankLoan({ ...bankLoan, amount_drawn: v })} />
                    </Field>
                    <Field label="Amount Available" help="Facility limit minus amount drawn — what's still available to draw.">
                      <NumericInput prefix="$" value={bankLoan.amount_available} onChange={(v) => setBankLoan({ ...bankLoan, amount_available: v })} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Field label="Interest Rate (%)" help="Current applicable rate. For variable loans this is the all-in rate (benchmark + margin).">
                      <NumericInput decimals={3} value={bankLoan.interest_rate} onChange={(v) => setBankLoan({ ...bankLoan, interest_rate: v })} placeholder="7.250" formatCommas={false} />
                    </Field>
                    <Field label="Rate Type" help="Fixed never moves; variable tracks a benchmark plus a margin.">
                      <Select value={bankLoan.interest_rate_type} onChange={(e) => setBankLoan({ ...bankLoan, interest_rate_type: e.target.value as 'FIXED' | 'VARIABLE' })}>
                        <option value="FIXED">Fixed</option>
                        <option value="VARIABLE">Variable</option>
                      </Select>
                    </Field>
                    <Field label="Rate Set Date">
                      <DatePicker value={bankLoan.interest_rate_date} onChange={(v) => setBankLoan({ ...bankLoan, interest_rate_date: v })} />
                    </Field>
                  </div>
                  {showPeggedTo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field label="Benchmark" help="Reference rate the variable loan tracks. BBSY/BBSW are short-term bank bill rates; the RBA cash rate is the central bank's policy rate.">
                        <Select value={bankLoan.interest_rate_benchmark} onChange={(e) => setBankLoan({ ...bankLoan, interest_rate_benchmark: e.target.value })}>
                          {BENCHMARKS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
                        </Select>
                      </Field>
                      <Field label="Margin (% above benchmark)" help="The fixed margin the bank adds on top of the benchmark, e.g. 2.5 means + 2.5%.">
                        <NumericInput value={bankLoan.interest_rate_margin} onChange={(v) => setBankLoan({ ...bankLoan, interest_rate_margin: v })} placeholder="2.50" formatCommas={false} prefix="+" />
                      </Field>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Settlement Date" help="Date the loan funds settle / become available to draw.">
                      <DatePicker
                        value={bankLoan.settlement_date}
                        onChange={(v) => setBankLoan({ ...bankLoan, settlement_date: v })}
                        maxISO={bankLoan.maturity_date || undefined}
                      />
                    </Field>
                    <Field label="Maturity Date" help="Final date the facility must be fully repaid.">
                      <DatePicker
                        value={bankLoan.maturity_date}
                        onChange={(v) => setBankLoan({ ...bankLoan, maturity_date: v })}
                        minISO={bankLoan.settlement_date || undefined}
                      />
                    </Field>
                  </div>

                  <div className="border border-border bg-secondary/20 p-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox" checked={bankLoan.secured}
                        onChange={(e) => setBankLoan({ ...bankLoan, secured: e.target.checked })}
                        className="w-4 h-4 accent-accent"
                      />
                      <span>This loan is secured</span>
                    </label>
                    {bankLoan.secured && (
                      <div className="mt-3">
                        <Field label="Secured To" required help="What collateral backs the loan, e.g. the development site title or a personal guarantee.">
                          <TextInput value={bankLoan.secured_to} onChange={(e) => setBankLoan({ ...bankLoan, secured_to: e.target.value })} required placeholder="e.g. The development site at 123 Main St" />
                        </Field>
                      </div>
                    )}
                  </div>

                  <AdvancedSettings title="Repayment terms">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field label="Interest-only Period" help="Window where you only pay interest, not principal. Pick start and end dates.">
                        <DateRangePicker
                          from={bankLoan.io_start_date}
                          to={bankLoan.io_end_date}
                          onChange={({ from, to }) => setBankLoan({ ...bankLoan, io_start_date: from, io_end_date: to })}
                          minISO={bankLoan.settlement_date || undefined}
                          maxISO={bankLoan.maturity_date || undefined}
                        />
                      </Field>
                      <Field label="Principal & Interest Period" help="Window where each payment chips away at both interest and principal.">
                        <DateRangePicker
                          from={bankLoan.pi_start_date}
                          to={bankLoan.pi_end_date}
                          onChange={({ from, to }) => setBankLoan({ ...bankLoan, pi_start_date: from, pi_end_date: to })}
                          minISO={bankLoan.io_end_date || bankLoan.settlement_date || undefined}
                          maxISO={bankLoan.maturity_date || undefined}
                        />
                      </Field>
                      <Field label="Repayment Frequency">
                        <Select value={bankLoan.repayment_frequency} onChange={(e) => setBankLoan({ ...bankLoan, repayment_frequency: e.target.value })}>
                          {REPAYMENT_FREQUENCIES.map((f) => <option key={f} value={f}>{label(f)}</option>)}
                        </Select>
                      </Field>
                      <Field label="Minimum Monthly Repayment">
                        <NumericInput prefix="$" value={bankLoan.min_monthly_repayment} onChange={(v) => setBankLoan({ ...bankLoan, min_monthly_repayment: v })} />
                      </Field>
                      <Field label="Direct Debit Day of Month" help="Day each month the bank takes the payment from your account (1–28).">
                        <NumericInput decimals={0} value={bankLoan.direct_debit_day} onChange={(v) => setBankLoan({ ...bankLoan, direct_debit_day: v })} formatCommas={false} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field label="Debit BSB">
                        <TextInput value={bankLoan.debit_bsb} onChange={(e) => setBankLoan({ ...bankLoan, debit_bsb: e.target.value })} placeholder="123-456" />
                      </Field>
                      <Field label="Debit Account Number">
                        <TextInput value={bankLoan.debit_account_number} onChange={(e) => setBankLoan({ ...bankLoan, debit_account_number: e.target.value })} />
                      </Field>
                    </div>
                  </AdvancedSettings>

                  <AdvancedSettings title="Fees & penalties">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field label="Establishment Fee" help="One-off fee charged at setup to cover the bank's processing.">
                        <NumericInput prefix="$" value={bankLoan.establishment_fee} onChange={(v) => setBankLoan({ ...bankLoan, establishment_fee: v })} />
                      </Field>
                      <Field label="Ongoing / Service Fees" help="Recurring fees, e.g. annual line fees or monthly account-keeping fees.">
                        <TextInput value={bankLoan.ongoing_fees} onChange={(e) => setBankLoan({ ...bankLoan, ongoing_fees: e.target.value })} placeholder="$300/year line fee" />
                      </Field>
                    </div>
                    <Field label="Early Repayment Penalty Terms" help="Costs the bank charges if you pay the loan off before maturity.">
                      <TextArea rows={3} value={bankLoan.early_repayment_terms} onChange={(e) => setBankLoan({ ...bankLoan, early_repayment_terms: e.target.value })} />
                    </Field>
                  </AdvancedSettings>

                  <AdvancedSettings title="Documents (paste URLs)">
                    <Field label="Loan Agreement PDF (URL)">
                      <TextInput value={bankLoan.loan_agreement_url} onChange={(e) => setBankLoan({ ...bankLoan, loan_agreement_url: e.target.value })} placeholder="https://..." />
                    </Field>
                    <Field label="Mortgage Documents (URL)">
                      <TextInput value={bankLoan.mortgage_documents_url} onChange={(e) => setBankLoan({ ...bankLoan, mortgage_documents_url: e.target.value })} />
                    </Field>
                    <Field label="Valuation Report (URL)">
                      <TextInput value={bankLoan.valuation_report_url} onChange={(e) => setBankLoan({ ...bankLoan, valuation_report_url: e.target.value })} />
                    </Field>
                  </AdvancedSettings>

                  <AdvancedSettings title="Covenants & notes">
                    <Field label="Covenants" help="Conditions you must keep satisfying — e.g. loan-to-value ratio limits, minimum presales before drawdown, debt-service coverage ratios.">
                      <TextArea rows={3} value={bankLoan.covenants} onChange={(e) => setBankLoan({ ...bankLoan, covenants: e.target.value })} placeholder="LVR < 70%, presale of 4 of 8 apartments before drawdown, etc." />
                    </Field>
                    <Field label="Notes">
                      <TextArea rows={3} value={bankLoan.notes} onChange={(e) => setBankLoan({ ...bankLoan, notes: e.target.value })} />
                    </Field>
                  </AdvancedSettings>
                </div>
              )}
            </Section>
          )}

          <div className="bg-white p-6 border shadow-xl">
            <Button
              type="submit" disabled={saving}
              className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
            >
              {saving ? 'Saving...' : (editing ? 'Update Project' : (bankLoan.enabled ? 'Create Project & Bank Facility' : 'Create Project'))}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ============================================================================
  // LIST VIEW
  // ============================================================================
  return (
    <div className="bg-white p-10 border shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-bold text-primary">
          Projects (<LoadingValue loading={loading} value={filtered.length} />)
        </h2>
        {canCreate && (
          <Button onClick={() => open()} className="gap-2"><Plus size={16} /> New Project</Button>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text" placeholder="Search by name..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No projects yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <Th>Name</Th><Th>Status</Th><Th>Total Cost</Th><Th>Total Revenue</Th><Th>Profit</Th>
                <th className="text-right py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b hover:bg-secondary/20">
                  <td className="py-3 px-4 font-medium">{p.name}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-secondary text-primary">{label(p.status, PROJECT_STATUS_LABELS)}</span>
                  </td>
                  <td className="py-3 px-4 text-sm">{fmt(p.total_cost)}</td>
                  <td className="py-3 px-4 text-sm">{fmt(p.total_revenue)}</td>
                  <td className="py-3 px-4 text-sm">{fmt(p.total_profit)}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {canEdit && (
                      <button onClick={() => open(p)} className="text-primary hover:text-accent inline-flex">
                        <Edit size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => remove(p)} className="text-destructive hover:text-destructive/80 inline-flex">
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
  );
}

function aud(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
}

function fmt(v: string | null) {
  if (v == null || v === '') return '—';
  return aud(Number(v));
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">{children}</th>;
}
