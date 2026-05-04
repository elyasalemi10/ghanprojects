import { useEffect, useState } from 'react';
import { ScrollText, Search } from 'lucide-react';
import { authFetch } from '@/lib/auth';
import { LoadingBlock, LoadingValue } from '@/components/admin/form-controls';

interface AuditEntry {
  id: string;
  user: { id: string; email: string; name: string } | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const ENTITY_TYPES = [
  'Loan', 'Borrower', 'Project', 'Transaction', 'EstimatedInflow',
  'RepaymentRequest', 'TopUpRequest', 'User',
];

export default function Audit() {
  const [list, setList] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [actionSearch, setActionSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityType) params.set('entityType', entityType);
      if (actionSearch) params.set('action', actionSearch);
      params.set('limit', '200');
      const res = await authFetch(`/api/admin/audit-log?${params.toString()}`);
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [entityType]);

  return (
    <div className="bg-white p-10 border shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-bold text-primary flex items-center gap-2">
          <ScrollText size={20} /> Audit Log (<LoadingValue loading={loading} value={list.length} />)
        </h2>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text" placeholder="Search action (e.g. CREATED, DELETED)…"
            value={actionSearch}
            onChange={(e) => setActionSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
            className="w-full pl-10 pr-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          value={entityType} onChange={(e) => setEntityType(e.target.value)}
          className="px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">All entities</option>
          {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={load} className="px-4 py-2 bg-secondary text-primary text-sm font-medium hover:bg-secondary/80">
          Refresh
        </button>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : list.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No audit entries.</p>
      ) : (
        <div className="space-y-1">
          {list.map((e) => {
            const isOpen = expanded === e.id;
            return (
              <div key={e.id} className="border">
                <button
                  onClick={() => setExpanded(isOpen ? null : e.id)}
                  className="w-full flex items-center justify-between gap-4 p-3 text-left hover:bg-secondary/20"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                      {new Date(e.created_at).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'medium' })}
                    </span>
                    <span className="font-mono text-xs px-2 py-1 bg-secondary text-primary shrink-0">{e.action}</span>
                    <span className="text-sm text-muted-foreground shrink-0">{e.entity_type}</span>
                    <span className="text-sm truncate flex-1">
                      {e.user ? <span className="font-medium">{e.user.name}</span> : <span className="italic">system</span>}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{isOpen ? '▾' : '▸'}</span>
                </button>
                {isOpen && (
                  <div className="border-t bg-secondary/10 p-4 text-xs space-y-2">
                    {e.entity_id && (
                      <p><span className="font-bold uppercase tracking-widest text-[10px] text-primary">Entity ID</span> <span className="font-mono">{e.entity_id}</span></p>
                    )}
                    {e.user && (
                      <p><span className="font-bold uppercase tracking-widest text-[10px] text-primary">User</span> {e.user.email}</p>
                    )}
                    {e.ip_address && (
                      <p><span className="font-bold uppercase tracking-widest text-[10px] text-primary">IP</span> <span className="font-mono">{e.ip_address}</span></p>
                    )}
                    {e.details && (
                      <div>
                        <p className="font-bold uppercase tracking-widest text-[10px] text-primary mb-1">Details</p>
                        <pre className="bg-white border p-3 overflow-x-auto font-mono text-xs">{JSON.stringify(e.details, null, 2)}</pre>
                      </div>
                    )}
                    {e.user_agent && (
                      <p className="text-muted-foreground"><span className="font-bold uppercase tracking-widest text-[10px] text-primary">UA</span> {e.user_agent}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
