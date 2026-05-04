import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth';

export default function TwoFactor({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  useEffect(() => {
    // Reset local state if enabled flag flips
    setSetupSecret(null); setQrDataUrl(null); setCode('');
    setShowDisable(false); setDisablePassword('');
  }, [enabled]);

  const startSetup = async () => {
    setBusy(true);
    try {
      const res = await authFetch('/api/auth/2fa/setup', { method: 'POST', body: JSON.stringify({}) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Setup failed');
        return;
      }
      const data = await res.json() as { secret: string; otpauthUrl: string };
      setSetupSecret(data.secret);
      const qr = await QRCode.toDataURL(data.otpauthUrl, { width: 240, margin: 1 });
      setQrDataUrl(qr);
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await authFetch('/api/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) });
      if (res.ok) {
        toast.success('2FA enabled. From now on you\'ll need a code to sign in.');
        onChange();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Verification failed');
      }
    } finally {
      setBusy(false);
    }
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await authFetch('/api/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ password: disablePassword }) });
      if (res.ok) {
        toast.success('2FA disabled');
        onChange();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Disable failed');
      }
    } finally {
      setBusy(false);
    }
  };

  if (enabled) {
    return (
      <div className="bg-white p-10 border shadow-xl">
        <h3 className="text-lg font-heading font-bold text-primary mb-4 flex items-center gap-2">
          <ShieldCheck size={20} className="text-emerald-700" /> Two-Factor Authentication
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          2FA is currently <span className="font-bold text-emerald-700">enabled</span>. You'll need a 6-digit code from your authenticator app every time you sign in.
        </p>
        {!showDisable ? (
          <Button variant="outline" onClick={() => setShowDisable(true)} className="gap-2 text-destructive">
            <ShieldOff size={16} /> Disable 2FA
          </Button>
        ) : (
          <form onSubmit={disable} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Confirm with your password</label>
              <input
                type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} required
                className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy} variant="outline" className="text-destructive">
                {busy ? 'Disabling…' : 'Confirm Disable'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setShowDisable(false); setDisablePassword(''); }}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-10 border shadow-xl">
      <h3 className="text-lg font-heading font-bold text-primary mb-4 flex items-center gap-2">
        <ShieldCheck size={20} /> Two-Factor Authentication
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Add an extra layer of security. After setup, you'll need a 6-digit code from an authenticator app
        (Google Authenticator, 1Password, Authy, etc.) every time you sign in.
      </p>

      {!setupSecret ? (
        <Button onClick={startSetup} disabled={busy} className="rounded-none bg-primary hover:bg-primary/90 text-white px-8 py-6 font-heading uppercase tracking-wider">
          {busy ? 'Generating…' : 'Set up 2FA'}
        </Button>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="2FA QR code" className="border bg-white p-2" width={240} height={240} />
            )}
            <div className="space-y-3 text-sm">
              <p>1. Open your authenticator app and add a new account.</p>
              <p>2. Scan this QR code, or enter the secret manually:</p>
              <pre className="bg-secondary/30 border p-3 text-xs font-mono break-all select-all">{setupSecret}</pre>
              <p>3. Enter the 6-digit code your app shows below to confirm.</p>
            </div>
          </div>
          <form onSubmit={confirmEnable} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Verification Code</label>
              <input
                type="text" inputMode="numeric" autoComplete="one-time-code"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\s+/g, ''))}
                placeholder="123456" required maxLength={10}
                className="w-full bg-secondary/30 border border-border p-4 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <Button
              type="submit" disabled={busy}
              className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
            >
              {busy ? 'Verifying…' : 'Enable 2FA'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
