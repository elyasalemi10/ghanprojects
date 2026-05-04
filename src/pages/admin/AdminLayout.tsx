import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Banknote, Users, Building2, Receipt, TrendingUp, FileSpreadsheet,
  Inbox, ShieldCheck, ScrollText, Mail, UserPlus, FileText, LogOut, Menu, X,
} from 'lucide-react';
import { fetchMe, logout, type SessionUser } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import Borrowers from './panels/Borrowers';
import Projects from './panels/Projects';
import Loans from './panels/Loans';
import Transactions from './panels/Transactions';
import EmailPanel from './panels/Email';
import MembersPanel from './panels/Members';
import BlogPanel from './panels/Blog';
import Dashboard from './panels/Dashboard';
import Inflows from './panels/Inflows';
import Statements from './panels/Statements';
import Requests from './panels/Requests';
import UsersPanel from './panels/Users';
import Audit from './panels/Audit';

export type AdminSection =
  | 'dashboard' | 'loans' | 'borrowers' | 'projects' | 'transactions'
  | 'inflows' | 'statements' | 'requests'
  | 'email' | 'members' | 'blog'
  | 'users' | 'audit';

interface NavItem {
  key: AdminSection;
  label: string;
  icon: LucideIcon;
  ownerOnly?: boolean;
  group: 'lending' | 'communications' | 'admin';
}

const NAV: NavItem[] = [
  { key: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard, ownerOnly: true,  group: 'lending' },
  { key: 'loans',        label: 'Loans',        icon: Banknote,                          group: 'lending' },
  { key: 'borrowers',    label: 'Borrowers',    icon: Users,                             group: 'lending' },
  { key: 'projects',     label: 'Projects',     icon: Building2,                         group: 'lending' },
  { key: 'transactions', label: 'Transactions', icon: Receipt,                           group: 'lending' },
  { key: 'inflows',      label: 'Inflows',      icon: TrendingUp,    ownerOnly: true,    group: 'lending' },
  { key: 'statements',   label: 'Statements',   icon: FileSpreadsheet,                   group: 'lending' },
  { key: 'requests',     label: 'Requests',     icon: Inbox,                             group: 'lending' },

  { key: 'email',        label: 'Email',        icon: Mail,                              group: 'communications' },
  { key: 'members',      label: 'Members',      icon: UserPlus,                          group: 'communications' },
  { key: 'blog',         label: 'Blog',         icon: FileText,                          group: 'communications' },

  { key: 'users',        label: 'Users',        icon: ShieldCheck,   ownerOnly: true,    group: 'admin' },
  { key: 'audit',        label: 'Audit Log',    icon: ScrollText,    ownerOnly: true,    group: 'admin' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [me, setMe] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetchMe().then((user) => {
      if (!user) {
        navigate({ to: '/login' });
        return;
      }
      if (user.role === 'LENDER') {
        navigate({ to: '/investor' });
        return;
      }
      setMe(user);
      // ADMINs can't see dashboard — pick first allowed section
      if (user.role === 'ADMIN') setSection('loans');
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

  const visible = NAV.filter((item) => !item.ownerOnly || me.role === 'OWNER');
  const groups: Array<{ id: NavItem['group']; label: string }> = [
    { id: 'lending',        label: 'Lending' },
    { id: 'communications', label: 'Communications' },
    { id: 'admin',          label: 'Administration' },
  ];

  const activeItem = visible.find((i) => i.key === section) ?? visible[0];

  return (
    <div className="min-h-screen bg-secondary/20 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-primary text-white flex flex-col transition-transform',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="font-heading text-lg font-bold tracking-wide">Ghan Projects</p>
            <p className="text-[10px] uppercase tracking-widest text-white/60 mt-1">Admin Console</p>
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
          {groups.map((group) => {
            const items = visible.filter((i) => i.group === group.id);
            if (items.length === 0) return null;
            return (
              <div key={group.id} className="mb-2">
                <p className="px-6 py-2 text-[10px] uppercase tracking-widest text-white/40 font-bold">
                  {group.label}
                </p>
                {items.map((item) => {
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
              </div>
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

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
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
          {section === 'borrowers'    && <Borrowers user={me} />}
          {section === 'projects'     && <Projects user={me} />}
          {section === 'loans'        && <Loans user={me} />}
          {section === 'transactions' && <Transactions user={me} />}
          {section === 'email'        && <EmailPanel />}
          {section === 'members'      && <MembersPanel />}
          {section === 'blog'         && <BlogPanel />}
          {section === 'dashboard'    && <Dashboard />}
          {section === 'inflows'      && <Inflows />}
          {section === 'statements'   && <Statements />}
          {section === 'requests'     && <Requests />}
          {section === 'users'        && <UsersPanel />}
          {section === 'audit'        && <Audit />}
        </main>
      </div>
    </div>
  );
}
