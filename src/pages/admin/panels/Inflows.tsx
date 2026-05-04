import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth';
import {
  Field, TextInput, TextArea, Select, NumericInput, DatePicker, LoadingBlock, LoadingValue,
} from '@/components/admin/form-controls';

interface Inflow {
  id: string;
  description: string;
  amount: string;
  expected_date: string;
  project_id: string | null;
  project: { id: string; name: string } | null;
  confidence: 'LIKELY' | 'POSSIBLE' | 'CONFIRMED';
  notes: string | null;
}

interface ProjectLite { id: string; name: string }

const empty = {
  description: '', amount: '', expected_date: '',
  project_id: '', confidence: 'LIKELY' as 'LIKELY' | 'POSSIBLE' | 'CONFIRMED',
  notes: '',
};

const CONF_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  LIKELY: 'bg-blue-100 text-blue-800',
  POSSIBLE: 'bg-yellow-100 text-yellow-800',
};

export default function Inflows() {
  const [list, setList] = useState<Inflow[]>([]);
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Inflow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [iRes, pRes] = await Promise.all([
        authFetch('/api/admin/inflows'),
        authFetch('/api/admin/projects'),
      ]);
      if (iRes.ok) setList(await iRes.json());
      if (pRes.ok) setProjects(await pRes.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const open = (inf?: Inflow) => {
    if (inf) {
      setEditing(inf);
      setForm({
        description: inf.description, amount: inf.amount,
        expected_date: inf.expected_date,
        project_id: inf.project_id || '',
        confidence: inf.confidence, notes: inf.notes || '',
      });
    } else {
      setEditing(null); setForm(empty);
    }
    setCreating(true);
  };
  const close = () => { setCreating(false); setEditing(null); setForm(empty); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        description: form.description, amount: Number(form.amount),
        expected_date: form.expected_date, project_id: form.project_id || null,
        confidence: form.confidence, notes: form.notes || null,
      };
      const res = await authFetch(
        editing ? `/api/admin/inflows/${editing.id}` : '/api/admin/inflows',
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify(body) }
      );
      if (res.ok) { toast.success(editing ? 'Inflow updated' : 'Inflow added'); close(); load(); }
      else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (inf: Inflow) => {
    if (!confirm(`Delete "${inf.description}"?`)) return;
    const res = await authFetch(`/api/admin/inflows/${inf.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Inflow deleted'); load(); }
    else toast.error('Delete failed');
  };

  if (creating) {
    return (
      <div className="bg-white p-10 border shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold text-primary">
            {editing ? 'Edit Inflow' : 'New Estimated Inflow'}
          </h2>
          <Button variant="outline" onClick={close}><X size={16} /> Cancel</Button>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <Field label="Description" required>
            <TextInput value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="e.g. Project A profit distribution" />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Amount (AUD)" required>
              <NumericInput prefix="$" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} required placeholder="0" />
            </Field>
            <Field label="Expected Date" required>
              <DatePicker value={form.expected_date} onChange={(v) => setForm({ ...form, expected_date: v })} required />
            </Field>
            <Field label="Confidence">
              <Select value={form.confidence} onChange={(e) => setForm({ ...form, confidence: e.target.value as 'LIKELY' | 'POSSIBLE' | 'CONFIRMED' })}>
                <option value="CONFIRMED">Confirmed</option>
                <option value="LIKELY">Likely</option>
                <option value="POSSIBLE">Possible</option>
              </Select>
            </Field>
          </div>
          <Field label="Project (optional)">
            <Select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">— None —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Notes">
            <TextArea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Button
            type="submit" disabled={saving}
            className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
          >
            {saving ? 'Saving...' : (editing ? 'Update Inflow' : 'Add Inflow')}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white p-10 border shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-bold text-primary">
          Estimated Inflows (<LoadingValue loading={loading} value={list.length} />)
        </h2>
        <Button onClick={() => open()} className="gap-2"><Plus size={16} /> New Inflow</Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        These manual entries drive the Dashboard cash-flow forecast.
      </p>

      {loading ? (
        <LoadingBlock />
      ) : list.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No inflows yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <Th>Date</Th><Th>Description</Th><Th>Project</Th><Th>Amount</Th><Th>Confidence</Th>
                <th className="text-right py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((inf) => (
                <tr key={inf.id} className="border-b hover:bg-secondary/20">
                  <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(inf.expected_date).toLocaleDateString('en-AU')}</td>
                  <td className="py-3 px-4 font-medium">{inf.description}</td>
                  <td className="py-3 px-4 text-sm">{inf.project?.name || <span className="text-muted-foreground">—</span>}</td>
                  <td className="py-3 px-4 text-sm font-medium">{Number(inf.amount).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 text-xs font-medium ${CONF_COLORS[inf.confidence]}`}>{inf.confidence}</span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button onClick={() => open(inf)} className="text-primary hover:text-accent inline-flex"><Edit size={16} /></button>
                    <button onClick={() => remove(inf)} className="text-destructive hover:text-destructive/80 inline-flex"><Trash2 size={16} /></button>
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">{children}</th>;
}
