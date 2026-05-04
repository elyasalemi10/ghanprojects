import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { User as UserIcon, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth';

interface Borrower {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  id_number: string | null;
  id_type: string | null;
  created_at: string;
}

export default function InvestorProfile() {
  const [borrower, setBorrower] = useState<Borrower | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await authFetch('/api/investor/me');
    if (res.ok) {
      const data = await res.json();
      setBorrower(data.borrower);
      setPhone(data.borrower.phone || '');
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const savePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPhone(true);
    const res = await authFetch('/api/investor/me', {
      method: 'PUT', body: JSON.stringify({ phone }),
    });
    if (res.ok) {
      toast.success('Phone updated');
      load();
    } else {
      toast.error('Update failed');
    }
    setSavingPhone(false);
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSavingPassword(true);
    const res = await authFetch('/api/investor/me', {
      method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      toast.success('Password changed');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || 'Password change failed');
    }
    setSavingPassword(false);
  };

  if (loading || !borrower) {
    return <div className="bg-white p-12 border shadow-xl text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-10 border shadow-xl">
        <h2 className="text-xl font-heading font-bold text-primary mb-6 flex items-center gap-2">
          <UserIcon size={20} /> My Details
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Info label="Full Name" value={borrower.full_name} />
          <Info label="Email" value={borrower.email} />
          <Info label="Address" value={borrower.address || '—'} />
          <Info label="ID Type" value={borrower.id_type || '—'} />
          <Info label="ID Number" value={borrower.id_number || '—'} />
          <Info label="Investor since" value={new Date(borrower.created_at).toLocaleDateString('en-AU', { year: 'numeric', month: 'long' })} />
        </dl>
        <p className="text-xs text-muted-foreground mt-6">
          To change details other than your phone number, contact the Ghan Projects team.
        </p>
      </div>

      <form onSubmit={savePhone} className="bg-white p-10 border shadow-xl">
        <h3 className="text-lg font-heading font-bold text-primary mb-4">Update Phone</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Phone</label>
            <input
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <Button type="submit" disabled={savingPhone} className="rounded-none bg-primary hover:bg-primary/90 text-white py-6 font-heading uppercase tracking-wider">
            {savingPhone ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>

      <form onSubmit={savePassword} className="bg-white p-10 border shadow-xl">
        <h3 className="text-lg font-heading font-bold text-primary mb-4 flex items-center gap-2">
          <KeyRound size={18} /> Change Password
        </h3>
        <div className="space-y-4">
          <Field label="Current Password" type="password" value={currentPassword} onChange={setCurrentPassword} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="New Password" type="password" value={newPassword} onChange={setNewPassword} required />
            <Field label="Confirm New Password" type="password" value={confirmPassword} onChange={setConfirmPassword} required />
          </div>
        </div>
        <Button
          type="submit" disabled={savingPassword}
          className="mt-6 rounded-none bg-accent hover:bg-accent/90 text-white px-8 py-6 font-heading font-bold uppercase tracking-wider"
        >
          {savingPassword ? 'Saving…' : 'Change Password'}
        </Button>
      </form>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</dt>
      <dd className="font-medium text-primary mt-1">{value}</dd>
    </div>
  );
}

function Field({
  label, value, onChange, required, type = 'text',
}: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">{label}{required ? ' *' : ''}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
