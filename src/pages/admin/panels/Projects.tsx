import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch, hasPermission, type SessionUser } from '@/lib/auth';

interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  status: string;
  total_cost: string | null;
  total_revenue: string | null;
  total_profit: string | null;
  start_date: string | null;
  estimated_completion: string | null;
  actual_completion: string | null;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
}

const STATUSES = ['PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD'];

const empty = {
  name: '', description: '', address: '', status: 'PLANNING',
  total_cost: '', total_revenue: '', total_profit: '',
  start_date: '', estimated_completion: '', actual_completion: '',
  custom_fields_text: '',
};

export default function Projects({ user }: { user: SessionUser }) {
  const [list, setList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(empty);
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
      setForm({
        name: p.name, description: p.description || '', address: p.address || '',
        status: p.status,
        total_cost: p.total_cost || '', total_revenue: p.total_revenue || '', total_profit: p.total_profit || '',
        start_date: p.start_date || '', estimated_completion: p.estimated_completion || '',
        actual_completion: p.actual_completion || '',
        custom_fields_text: p.custom_fields ? JSON.stringify(p.custom_fields, null, 2) : '',
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
      let custom_fields: Record<string, unknown> | null = null;
      if (form.custom_fields_text.trim()) {
        try { custom_fields = JSON.parse(form.custom_fields_text); }
        catch { toast.error('Custom fields must be valid JSON'); setSaving(false); return; }
      }
      const num = (v: string) => v === '' ? null : Number(v);
      const date = (v: string) => v || null;
      const body = {
        name: form.name, description: form.description || null, address: form.address || null,
        status: form.status,
        total_cost: num(form.total_cost), total_revenue: num(form.total_revenue), total_profit: num(form.total_profit),
        start_date: date(form.start_date), estimated_completion: date(form.estimated_completion),
        actual_completion: date(form.actual_completion), custom_fields,
      };
      const res = await authFetch(
        editing ? `/api/admin/projects/${editing.id}` : '/api/admin/projects',
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify(body) }
      );
      if (res.ok) {
        toast.success(editing ? 'Project updated' : 'Project created');
        close(); load();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Project) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    const res = await authFetch(`/api/admin/projects/${p.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Project deleted'); load(); }
    else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || 'Delete failed');
    }
  };

  const filtered = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  if (creating) {
    return (
      <div className="bg-white p-10 border shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold text-primary">
            {editing ? 'Edit Project' : 'New Project'}
          </h2>
          <Button variant="outline" onClick={close}><X size={16} /> Cancel</Button>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <Field label="Description" textarea value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Total Cost (AUD)" type="number" value={form.total_cost} onChange={(v) => setForm({ ...form, total_cost: v })} />
            <Field label="Total Revenue (AUD)" type="number" value={form.total_revenue} onChange={(v) => setForm({ ...form, total_revenue: v })} />
            <Field label="Total Profit (AUD)" type="number" value={form.total_profit} onChange={(v) => setForm({ ...form, total_profit: v })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Start Date" type="date" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} />
            <Field label="Estimated Completion" type="date" value={form.estimated_completion} onChange={(v) => setForm({ ...form, estimated_completion: v })} />
            <Field label="Actual Completion" type="date" value={form.actual_completion} onChange={(v) => setForm({ ...form, actual_completion: v })} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Custom Fields (JSON)</label>
            <textarea
              value={form.custom_fields_text}
              onChange={(e) => setForm({ ...form, custom_fields_text: e.target.value })}
              placeholder={'{\n  "councilApproval": "VCAT 2026/01234"\n}'}
              rows={6}
              className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
          >
            {saving ? 'Saving...' : (editing ? 'Update Project' : 'Create Project')}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white p-10 border shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-bold text-primary">
          Projects ({filtered.length})
        </h2>
        {canCreate && (
          <Button onClick={() => open()} className="gap-2"><Plus size={16} /> New Project</Button>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
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
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-secondary text-primary">{p.status}</span>
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

function fmt(v: string | null) {
  if (v == null || v === '') return '—';
  return Number(v).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">{children}</th>;
}

function Field({
  label, value, onChange, required, type = 'text', placeholder, textarea,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
  type?: string; placeholder?: string; textarea?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">{label}{required ? ' *' : ''}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      )}
    </div>
  );
}
