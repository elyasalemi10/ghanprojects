import { useEffect, useState, createContext, useContext } from 'react';
import { useNavigate, Outlet, useRouterState, Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Banknote, Users, Building2, TrendingUp, FileSpreadsheet,
  Inbox, ShieldCheck, ScrollText, Mail, UserPlus, FileText, LogOut, Menu, X, UserCog,
} from 'lucide-react';
import { fetchMe, logout, type SessionUser } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type AdminSection =
  | 'dashboard' | 'loans' | 'borrowers' | 'projects'
  | 'inflows' | 'statements' | 'requests'
  | 'email' | 'members' | 'blog'
  | 'users' | 'audit' | 'account';

interface NavItem {
  key: AdminSection;
  label: string;
  path: string;
  icon: LucideIcon;
  ownerOnly?: boolean;
  group: 'lending' | 'communications' | 'admin' | 'account';
}

const NAV: NavItem[] = [
  { key: 'dashboard',    label: 'Dashboard',    path: '/admin/dashboard',    icon: LayoutDashboard, ownerOnly: true,  group: 'lending' },
  { key: 'loans',        label: 'Loans',        path: '/admin/loans',        icon: Banknote,                          group: 'lending' },
  { key: 'borrowers',    label: 'Borrowers',    path: '/admin/borrowers',    icon: Users,                             group: 'lending' },
  { key: 'projects',     label: 'Projects',     path: '/admin/projects',     icon: Building2,                         group: 'lending' },
  { key: 'inflows',      label: 'Inflows',      path: '/admin/inflows',      icon: TrendingUp,    ownerOnly: true,    group: 'lending' },
  { key: 'statements',   label: 'Statements',   path: '/admin/statements',   icon: FileSpreadsheet,                   group: 'lending' },
  { key: 'requests',     label: 'Requests',     path: '/admin/requests',     icon: Inbox,                             group: 'lending' },

  { key: 'email',        label: 'Email',        path: '/admin/email',        icon: Mail,                              group: 'communications' },
  { key: 'members',      label: 'Members',      path: '/admin/members',      icon: UserPlus,                          group: 'communications' },
  { key: 'blog',         label: 'Blog',         path: '/admin/blog',         icon: FileText,                          group: 'communications' },

  { key: 'users',        label: 'Users',        path: '/admin/users',        icon: ShieldCheck,   ownerOnly: true,    group: 'admin' },
  { key: 'audit',        label: 'Audit Log',    path: '/admin/audit',        icon: ScrollText,    ownerOnly: true,    group: 'admin' },

  { key: 'account',      label: 'My Account',   path: '/admin/account',      icon: UserCog,                           group: 'account' },
];

const AdminUserContext = createContext<SessionUser | null>(null);
export const useAdminUser = (): SessionUser => {
  const u = useContext(AdminUserContext);
  if (!u) throw new Error('useAdminUser must be used inside <AdminLayout>');
  return u;
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [me, setMe] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetchMe().then((user) => {
      if (!user) { navigate({ to: '/login' }); return; }
      if (user.role === 'LENDER') { navigate({ to: '/investor' }); return; }
      setMe(user);
      // If at /admin (no section), redirect to first allowed section.
      if (pathname === '/admin' || pathname === '/admin/') {
        navigate({ to: user.role === 'OWNER' ? '/admin/dashboard' : '/admin/loans' });
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    { id: 'account',        label: 'Account' },
  ];

  const activeItem = visible.find((i) => pathname.startsWith(i.path)) ?? visible[0];

  return (
    <AdminUserContext.Provider value={me}>
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
              <p className="text-[10px] uppercase tracking-widest text-white/60 mt-1">Admin Console</p>
            </div>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden text-white/80 hover:text-white" aria-label="Close menu">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            {groups.map((group) => {
              const items = visible.filter((i) => i.group === group.id);
              if (items.length === 0) return null;
              return (
                <div key={group.id} className="mb-2">
                  <p className="px-6 py-2 text-[10px] uppercase tracking-widest text-white/40 font-bold">{group.label}</p>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.key} to={item.path} onClick={() => setMobileOpen(false)}
                        className={cn(
                          'w-full flex items-center gap-3 px-6 py-2.5 text-sm transition-colors border-l-2',
                          active
                            ? 'border-accent bg-white/10 text-accent font-medium'
                            : 'border-transparent text-white/80 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </Link>
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

        {mobileOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="bg-white border-b sticky top-0 z-20">
            <div className="px-6 py-4 flex items-center gap-4">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden text-primary" aria-label="Open menu">
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-heading font-bold text-primary">{activeItem.label}</h1>
            </div>
          </header>
          <main className="flex-1 px-6 py-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminUserContext.Provider>
  );
}
