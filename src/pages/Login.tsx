import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { fetchMe, login, verifyTwoFactor } from '@/lib/auth';

type Stage = 'credentials' | 'twofa';

export default function Login() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingToken, setPendingToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bootChecked, setBootChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchMe().then((me) => {
      if (!alive) return;
      if (me) navigate({ to: me.role === 'LENDER' ? '/investor' : '/admin' });
      else setBootChecked(true);
    });
    return () => { alive = false; };
  }, [navigate]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if ('requires2FA' in result && result.requires2FA) {
        setPendingToken(result.pendingToken);
        setStage('twofa');
      } else if ('user' in result) {
        toast.success(`Welcome back, ${result.user.name}`);
        navigate({ to: result.redirect });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const onVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await verifyTwoFactor(pendingToken, code);
      toast.success(`Welcome back, ${result.user.name}`);
      navigate({ to: result.redirect });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '2FA failed');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStage('credentials');
    setCode('');
    setPendingToken('');
    setPassword('');
  };

  if (!bootChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white p-10 border shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              {stage === 'twofa' ? <ShieldCheck className="text-primary" size={24} /> : <Lock className="text-primary" size={24} />}
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-primary">
                {stage === 'twofa' ? 'Two-Factor Code' : 'Sign In'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {stage === 'twofa' ? 'Enter the 6-digit code from your authenticator app' : 'Ghan Projects portal'}
              </p>
            </div>
          </div>

          {stage === 'credentials' ? (
            <form onSubmit={onLogin} className="space-y-6">
              <Field label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" />
              <Field label="Password" type="password" value={password} onChange={setPassword} required autoComplete="current-password" />
              <Button
                type="submit" disabled={submitting}
                className="w-full rounded-none bg-primary hover:bg-primary/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </Button>
              <div className="text-center">
                <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-accent">
                  Forgot password?
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={onVerify2FA} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Authentication Code</label>
                <input
                  type="text" inputMode="numeric" autoComplete="one-time-code"
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\s+/g, ''))}
                  placeholder="123 456" required maxLength={10} autoFocus
                  className="w-full bg-secondary/30 border border-border p-4 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <Button
                type="submit" disabled={submitting}
                className="w-full rounded-none bg-primary hover:bg-primary/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
              >
                {submitting ? 'Verifying...' : 'Verify'}
              </Button>
              <div className="text-center">
                <button type="button" onClick={reset} className="text-xs text-muted-foreground hover:text-accent">
                  Back to sign in
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-xs text-muted-foreground text-center">
            Investors sign in here too — you'll be routed to your portal.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text', required, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} autoComplete={autoComplete}
        className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
