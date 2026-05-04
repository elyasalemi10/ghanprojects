import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { KeyRound } from 'lucide-react';
import { forgotPassword } from '@/lib/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await forgotPassword(email);
    setDone(true);
    setSubmitting(false);
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
              <h1 className="text-2xl font-heading font-bold text-primary">Reset Password</h1>
              <p className="text-sm text-muted-foreground">We'll email you a reset link</p>
            </div>
          </div>

          {done ? (
            <div className="space-y-4 text-sm">
              <p className="text-primary font-medium">Check your email.</p>
              <p className="text-muted-foreground">
                If <b>{email}</b> belongs to a Ghan Projects account, we've sent a password reset link.
                The link expires in 1 hour.
              </p>
              <p className="text-muted-foreground">
                Don't see it? Check your spam folder or try again.
              </p>
              <Link to="/login" className="inline-block text-accent hover:underline text-sm">← Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                  className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <Button
                type="submit" disabled={submitting}
                className="w-full rounded-none bg-primary hover:bg-primary/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
              >
                {submitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <div className="text-center">
                <Link to="/login" className="text-xs text-muted-foreground hover:text-accent">← Back to sign in</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
