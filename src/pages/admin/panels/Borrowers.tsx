import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch, hasPermission } from '@/lib/auth';
import { useAdminUser } from '../AdminLayout';
import { LoadingBlock, LoadingValue, AdvancedSettings } from '@/components/admin/form-controls';

interface Borrower {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  id_number: string | null;
  id_type: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown> | null;
  active: boolean;
  created_at: string;
}

const empty = {
  full_name: '', email: '', phone: '', address: '',
  id_number: '', id_type: '', notes: '',
  // curated optional fields
  preferred_contact: '',     // 'email' | 'phone' | 'mail'
  referred_by: '',
  occupation: '',
  date_of_birth: '',
  emergency_contact: '',
  tfn: '',
  bank_bsb: '',
  bank_account: '',
};

export default function Borrowers() {
  const user = useAdminUser();
  const [list, setList] = useState<Borrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Borrower | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission(user, 'borrowers', 'create') || user.role === 'OWNER';
  const canEdit = hasPermission(user, 'borrowers', 'edit') || user.role === 'OWNER';
  const canDelete = user.role === 'OWNER';

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/borrowers');
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const open = (b?: Borrower) => {
    if (b) {
      setEditing(b);
      const cf = (b.custom_fields || {}) as Record<string, string>;
      setForm({
        full_name: b.full_name, email: b.email, phone: b.phone || '',
        address: b.address || '', id_number: b.id_number || '', id_type: b.id_type || '',
        notes: b.notes || '',
        preferred_contact: cf.preferred_contact || '',
        referred_by: cf.referred_by || '',
        occupation: cf.occupation || '',
        date_of_birth: cf.date_of_birth || '',
        emergency_contact: cf.emergency_contact || '',
        tfn: cf.tfn || '',
        bank_bsb: cf.bank_bsb || '',
        bank_account: cf.bank_account || '',
      });
    } else {
      setEditing(null);
      setForm(empty);
    }
    setCreating(true);
  };

  const close = () => { setCreating(false); setEditing(null); setForm(empty); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Build custom_fields from the curated optional inputs
      const cfEntries: [string, string][] = [
        ['preferred_contact', form.preferred_contact],
        ['referred_by', form.referred_by],
        ['occupation', form.occupation],
        ['date_of_birth', form.date_of_birth],
        ['emergency_contact', form.emergency_contact],
        ['tfn', form.tfn],
        ['bank_bsb', form.bank_bsb],
        ['bank_account', form.bank_account],
      ];
      const populated = cfEntries.filter(([, v]) => v && v.trim());
      const custom_fields: Record<string, unknown> | null = populated.length > 0
        ? Object.fromEntries(populated)
        : null;

      const body = {
        full_name: form.full_name, email: form.email, phone: form.phone || null,
        address: form.address || null, id_number: form.id_number || null,
        id_type: form.id_type || null, notes: form.notes || null, custom_fields,
      };
      const res = await authFetch(
        editing ? `/api/admin/borrowers/${editing.id}` : '/api/admin/borrowers',
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify(body) }
      );
      if (res.ok) {
        toast.success(editing ? 'Borrower updated' : 'Borrower created');
        close(); load();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (b: Borrower) => {
    if (!confirm(`Delete ${b.full_name}? This cannot be undone.`)) return;
    const res = await authFetch(`/api/admin/borrowers/${b.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Borrower deleted'); load(); }
    else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || 'Delete failed');
    }
  };

  const filtered = list.filter((b) =>
    b.full_name.toLowerCase().includes(search.toLowerCase()) ||
    b.email.toLowerCase().includes(search.toLowerCase())
  );

  if (creating) {
    return (
      <div className="bg-white p-10 border shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold text-primary">
            {editing ? 'Edit Borrower' : 'New Borrower'}
          </h2>
          <Button variant="outline" onClick={close}><X size={16} /> Cancel</Button>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Full Name" required value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
            <Field label="Email" type="email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="ID Type" placeholder="passport / license / abn" value={form.id_type} onChange={(v) => setForm({ ...form, id_type: v })} />
            <Field label="ID Number" value={form.id_number} onChange={(v) => setForm({ ...form, id_number: v })} />
            <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          </div>
          <Field label="Notes" textarea value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />

          <AdvancedSettings title="Additional details (optional)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Preferred Contact</label>
                <select
                  value={form.preferred_contact}
                  onChange={(e) => setForm({ ...form, preferred_contact: e.target.value })}
                  className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">—</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="mail">Postal mail</option>
                </select>
              </div>
              <Field label="Referred By" value={form.referred_by} onChange={(v) => setForm({ ...form, referred_by: v })} placeholder="Name or source" />
              <Field label="Occupation" value={form.occupation} onChange={(v) => setForm({ ...form, occupation: v })} />
              <Field label="Date of Birth" type="date" value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} />
              <Field label="Emergency Contact" value={form.emergency_contact} onChange={(v) => setForm({ ...form, emergency_contact: v })} placeholder="Name + phone" />
              <Field label="TFN" value={form.tfn} onChange={(v) => setForm({ ...form, tfn: v })} placeholder="Tax File Number" />
              <Field label="Bank BSB" value={form.bank_bsb} onChange={(v) => setForm({ ...form, bank_bsb: v })} placeholder="123-456" />
              <Field label="Bank Account Number" value={form.bank_account} onChange={(v) => setForm({ ...form, bank_account: v })} />
            </div>
          </AdvancedSettings>
          <Button
            type="submit"
            disabled={saving}
            className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
          >
            {saving ? 'Saving...' : (editing ? 'Update Borrower' : 'Create Borrower')}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white p-10 border shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-bold text-primary">
          Borrowers (<LoadingValue loading={loading} value={filtered.length} />)
        </h2>
        {canCreate && (
          <Button onClick={() => open()} className="gap-2"><Plus size={16} /> New Borrower</Button>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No borrowers yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Status</Th>
                <th className="text-right py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b hover:bg-secondary/20">
                  <td className="py-3 px-4 font-medium">{b.full_name}</td>
                  <td className="py-3 px-4 text-sm">{b.email}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{b.phone || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 text-xs font-medium ${b.active ? 'bg-green-100 text-green-800' : 'bg-secondary text-muted-foreground'}`}>
                      {b.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {canEdit && (
                      <button onClick={() => open(b)} className="text-primary hover:text-accent inline-flex">
                        <Edit size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => remove(b)} className="text-destructive hover:text-destructive/80 inline-flex">
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
