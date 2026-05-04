import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Banknote, FileSpreadsheet, Inbox, User, LogOut, Menu, X,
} from 'lucide-react';
import { fetchMe, logout, type SessionUser } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Overview from './panels/Overview';
import MyLoans from './panels/MyLoans';
import Statements from './panels/Statements';
import Requests from './panels/Requests';
import Profile from './panels/Profile';

type InvestorSection = 'overview' | 'loans' | 'statements' | 'requests' | 'profile';

const NAV: Array<{ key: InvestorSection; label: string; icon: LucideIcon }> = [
  { key: 'overview',   label: 'Overview',   icon: LayoutDashboard },
  { key: 'loans',      label: 'My Loans',   icon: Banknote },
  { key: 'statements', label: 'Statements', icon: FileSpreadsheet },
  { key: 'requests',   label: 'Requests',   icon: Inbox },
  { key: 'profile',    label: 'Profile',    icon: User },
];

export default function InvestorLayout() {
  const navigate = useNavigate();
  const [me, setMe] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<InvestorSection>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetchMe().then((user) => {
      if (!user) { navigate({ to: '/login' }); return; }
      if (user.role !== 'LENDER') { navigate({ to: '/admin' }); return; }
      setMe(user);
      setLoading(false);
    });
  }, [navigate]);

  const onLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate({ to: '/login' });
  };

  if (loading || !me) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const activeItem = NAV.find((i) => i.key === section) ?? NAV[0];

  return (
    <div className="min-h-screen bg-secondary/20 flex">
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-primary text-white flex flex-col transition-transform',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="font-heading text-lg font-bold tracking-wide">Ghan Projects</p>
            <p className="text-[10px] uppercase tracking-widest text-white/60 mt-1">Investor Portal</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-white/80 hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.key === section;
            return (
              <button
                key={item.key}
                onClick={() => { setSection(item.key); setMobileOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-6 py-2.5 text-sm transition-colors border-l-2',
                  active
                    ? 'border-accent bg-white/10 text-accent font-medium'
                    : 'border-transparent text-white/80 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4 space-y-3">
          <div className="px-2">
            <p className="text-sm font-medium truncate">{me.name}</p>
            <p className="text-[11px] text-white/60 truncate">{me.email}</p>
            <p className="text-[10px] uppercase tracking-widest text-accent mt-1">{me.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 border border-white/20 hover:bg-white/10 text-sm font-medium uppercase tracking-wider"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-primary"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-heading font-bold text-primary">{activeItem.label}</h1>
          </div>
        </header>
        <main className="flex-1 px-6 py-8 max-w-7xl w-full mx-auto">
          {section === 'overview'   && <Overview />}
          {section === 'loans'      && <MyLoans />}
          {section === 'statements' && <Statements />}
          {section === 'requests'   && <Requests />}
          {section === 'profile'    && <Profile />}
        </main>
      </div>
    </div>
  );
}
