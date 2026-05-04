import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Power, X, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth';

type Role = 'OWNER' | 'ADMIN' | 'LENDER';

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  active: boolean;
  borrower_id: string | null;
  permissions: Record<string, string[]> | null;
  last_login: string | null;
  created_at: string;
  borrower?: { id: string; full_name: string } | null;
}

interface BorrowerLite { id: string; full_name: string; email: string }

const RESOURCES = ['loans', 'borrowers', 'projects', 'transactions', 'statements'];
const ACTIONS = ['view', 'create', 'edit'];

const ROLE_COLORS: Record<Role, string> = {
  OWNER: 'bg-accent/20 text-accent',
  ADMIN: 'bg-blue-100 text-blue-800',
  LENDER: 'bg-emerald-100 text-emerald-800',
};

const empty = {
  email: '', name: '', password: '', role: 'ADMIN' as Role, phone: '',
  borrower_id: '',
  permissions: Object.fromEntries(RESOURCES.map((r) => [r, ['view']])) as Record<string, string[]>,
};

export default function Users() {
  const [list, setList] = useState<User[]>([]);
  const [borrowers, setBorrowers] = useState<BorrowerLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [u, b] = await Promise.all([
        authFetch('/api/admin/users'),
        authFetch('/api/admin/borrowers'),
      ]);
      if (u.ok) setList(await u.json());
      if (b.ok) setBorrowers(await b.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const open = (u?: User) => {
    if (u) {
      setEditing(u);
      setForm({
        email: u.email, name: u.name, password: '',
        role: u.role, phone: u.phone || '',
        borrower_id: u.borrower_id || '',
        permissions: u.permissions || Object.fromEntries(RESOURCES.map((r) => [r, []])) as Record<string, string[]>,
      });
    } else {
      setEditing(null); setForm(empty);
    }
    setCreating(true);
  };
  const close = () => { setCreating(false); setEditing(null); setForm(empty); };

  const togglePerm = (res: string, action: string) => {
    setForm((f) => {
      const cur = new Set(f.permissions[res] || []);
      if (cur.has(action)) cur.delete(action);
      else cur.add(action);
      return { ...f, permissions: { ...f.permissions, [res]: Array.from(cur) } };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.role === 'LENDER' && !form.borrower_id) { toast.error('Lender accounts must be linked to a borrower'); return; }
    if (!editing && !form.password) { toast.error('Password required'); return; }

    setSaving(true);
    try {
      const body: any = {
        email: form.email, name: form.name, role: form.role,
        phone: form.phone || null,
        borrower_id: form.role === 'LENDER' ? form.borrower_id : null,
        permissions: form.role === 'ADMIN' ? form.permissions : null,
      };
      if (form.password) body.password = form.password;

      const res = await authFetch(
        editing ? `/api/admin/users/${editing.id}` : '/api/admin/users',
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify(body) }
      );
      if (res.ok) { toast.success(editing ? 'User updated' : 'User created'); close(); load(); }
      else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    if (u.active && !confirm(`Deactivate ${u.name}? They will no longer be able to log in.`)) return;
    const res = await authFetch(`/api/admin/users/${u.id}`, {
      method: 'PUT', body: JSON.stringify({ active: !u.active }),
    });
    if (res.ok) { toast.success(u.active ? 'User deactivated' : 'User activated'); load(); }
    else toast.error('Failed');
  };

  if (creating) {
    return (
      <div className="bg-white p-10 border shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold text-primary">
            {editing ? `Edit User — ${editing.name}` : 'New User'}
          </h2>
          <Button variant="outline" onClick={close}><X size={16} /> Cancel</Button>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Email" type="email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Role *</label>
              <select
                value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="OWNER">Owner (full access)</option>
                <option value="ADMIN">Admin (granular permissions)</option>
                <option value="LENDER">Lender / Investor</option>
              </select>
            </div>
          </div>

          {form.role === 'LENDER' && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Linked Borrower *</label>
              <select
                value={form.borrower_id} onChange={(e) => setForm({ ...form, borrower_id: e.target.value })} required
                className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">— Select borrower —</option>
                {borrowers.map((b) => <option key={b.id} value={b.id}>{b.full_name} ({b.email})</option>)}
              </select>
              <p className="text-xs text-muted-foreground">The lender will only see loans tied to this borrower record.</p>
            </div>
          )}

          {form.role === 'ADMIN' && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Permissions</label>
              <div className="border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="text-left py-2 px-3 font-bold text-[10px] uppercase tracking-widest text-primary">Resource</th>
                      {ACTIONS.map((a) => (
                        <th key={a} className="text-center py-2 px-3 font-bold text-[10px] uppercase tracking-widest text-primary capitalize">{a}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RESOURCES.map((r) => (
                      <tr key={r} className="border-b">
                        <td className="py-2 px-3 capitalize">{r}</td>
                        {ACTIONS.map((a) => {
                          const checked = form.permissions[r]?.includes(a) || false;
                          return (
                            <td key={a} className="text-center py-2 px-3">
                              <input
                                type="checkbox" checked={checked} onChange={() => togglePerm(r, a)}
                                className="w-4 h-4 accent-accent"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Field
            label={editing ? 'New Password (leave blank to keep current)' : 'Password *'}
            type="password" value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            required={!editing}
          />

          <Button
            type="submit" disabled={saving}
            className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
          >
            {saving ? 'Saving...' : (editing ? 'Update User' : 'Create User')}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white p-10 border shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-bold text-primary flex items-center gap-2">
          <ShieldCheck size={20} /> Users ({list.length})
        </h2>
        <Button onClick={() => open()} className="gap-2"><Plus size={16} /> New User</Button>
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No users yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Linked</Th><Th>Last Login</Th><Th>Status</Th>
                <th className="text-right py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-b hover:bg-secondary/20">
                  <td className="py-3 px-4 font-medium">{u.name}</td>
                  <td className="py-3 px-4 text-sm">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 text-xs font-medium ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{u.borrower?.full_name || '—'}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {u.last_login ? new Date(u.last_login).toLocaleString('en-AU') : 'Never'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 text-xs font-medium ${u.active ? 'bg-green-100 text-green-800' : 'bg-secondary text-muted-foreground'}`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button onClick={() => open(u)} className="text-primary hover:text-accent inline-flex"><Edit size={16} /></button>
                    <button onClick={() => toggleActive(u)} className="text-destructive hover:text-destructive/80 inline-flex" title={u.active ? 'Deactivate' : 'Activate'}>
                      <Power size={16} />
                    </button>
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
function Field({
  label, value, onChange, required, type = 'text', placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
  type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">{label}{required ? ' *' : ''}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder}
        className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
