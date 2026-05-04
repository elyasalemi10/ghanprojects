import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth';
import { LoadingBlock, LoadingValue } from '@/components/admin/form-controls';

interface Signup {
  id: number;
  email: string;
  source: string;
  created_at: string;
}

const SOURCE_LABELS: Record<string, string> = {
  resources: 'Resources',
  contact: 'Contact Form',
  consultation: 'Consultation',
  investor_network: 'Investor Network',
  newsletter: 'Newsletter',
  chatbot_inquiry: 'Chatbot',
};

export default function MembersPanel() {
  const [list, setList] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/signups');
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: number) => {
    if (!confirm('Delete this signup?')) return;
    const res = await authFetch(`/api/admin/signups/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setList((p) => p.filter((s) => s.id !== id));
      toast.success('Signup deleted');
    } else {
      toast.error('Delete failed');
    }
  };

  const filtered = list.filter((s) => {
    const m1 = s.email.toLowerCase().includes(search.toLowerCase());
    const m2 = filter === 'all' || s.source === filter;
    return m1 && m2;
  });

  return (
    <div className="bg-white p-10 border shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-bold text-primary flex items-center gap-2">
          <Users size={20} /> Email Signups (<LoadingValue loading={loading} value={filtered.length} />)
        </h2>
        <Button onClick={load} variant="outline" size="sm">Refresh</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text" placeholder="Search by email..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All Sources</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No signups found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <Th>Email</Th><Th>Source</Th><Th>Date</Th>
                <th className="text-right py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b hover:bg-secondary/20">
                  <td className="py-3 px-4 font-medium">{s.email}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 bg-secondary text-xs font-medium">
                      {SOURCE_LABELS[s.source] || s.source}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-sm">
                    {new Date(s.created_at).toLocaleString('en-AU')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => remove(s.id)} className="text-destructive hover:text-destructive/80 inline-flex">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">{children}</th>;
}
