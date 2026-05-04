import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { fetchMe, login } from '@/lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bootChecked, setBootChecked] = useState(false);

  // If already signed in, route to the right place
  useEffect(() => {
    let alive = true;
    fetchMe().then((me) => {
      if (!alive) return;
      if (me) {
        navigate({ to: me.role === 'LENDER' ? '/investor' : '/admin' });
      } else {
        setBootChecked(true);
      }
    });
    return () => { alive = false; };
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await login(email, password);
      toast.success(`Welcome back, ${result.user.name}`);
      navigate({ to: result.redirect });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
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
              <Lock className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-primary">Sign In</h1>
              <p className="text-sm text-muted-foreground">Ghan Projects portal</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                required
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-none bg-primary hover:bg-primary/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            Investors sign in here too — you'll be routed to your portal.
          </p>
        </div>
      </div>
    </div>
  );
}
