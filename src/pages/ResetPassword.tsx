import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { resetPassword } from '@/lib/auth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { token?: string };
  const token = search.token || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) toast.error('Missing reset token. Request a new link.');
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      toast.success('Password updated. You can sign in now.');
      navigate({ to: '/login' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white p-10 border shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <KeyRound className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-primary">New Password</h1>
              <p className="text-sm text-muted-foreground">Choose a strong password (8+ chars)</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <Field label="New Password" type="password" value={newPassword} onChange={setNewPassword} required />
            <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm} required />
            <Button
              type="submit" disabled={submitting || !token}
              className="w-full rounded-none bg-primary hover:bg-primary/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
            >
              {submitting ? 'Saving...' : 'Set Password'}
            </Button>
            <div className="text-center">
              <Link to="/login" className="text-xs text-muted-foreground hover:text-accent">← Back to sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text', required,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
