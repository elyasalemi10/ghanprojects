import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, FileText, Eye, EyeOff, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

interface BlogPost {
  id: number;
  title: string;
  category: string;
  thumbnail: string;
  date: string;
  read_time: string;
  content: string;
  excerpt: string;
  published: boolean;
  created_at: string;
}

const CATEGORIES = ['Strategy', 'Finance', 'Investment', 'Development', 'Market Update'];

const empty = {
  title: '', category: 'Strategy', thumbnail: '',
  date: new Date().toISOString().split('T')[0],
  read_time: '5 min read', content: '', excerpt: '',
};

export default function BlogPanel() {
  const [list, setList] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/posts');
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const open = (p?: BlogPost) => {
    if (p) {
      setEditing(p);
      setForm({
        title: p.title, category: p.category, thumbnail: p.thumbnail,
        date: p.date, read_time: p.read_time, content: p.content, excerpt: p.excerpt,
      });
    } else {
      setEditing(null); setForm(empty);
    }
    setCreating(true);
  };

  const close = () => { setCreating(false); setEditing(null); setForm(empty); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch(
        editing ? `/api/admin/posts/${editing.id}` : '/api/admin/posts',
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify({ ...form, published: true }) }
      );
      if (res.ok) {
        toast.success(editing ? 'Post updated' : 'Post created');
        close(); load();
      } else {
        toast.error('Failed to save post');
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this post?')) return;
    const res = await authFetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    if (res.ok) { setList((p) => p.filter((x) => x.id !== id)); toast.success('Post deleted'); }
    else toast.error('Delete failed');
  };

  if (creating) {
    return (
      <div className="bg-white p-10 border shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold text-primary">
            {editing ? 'Edit Post' : 'Create New Post'}
          </h2>
          <Button variant="outline" onClick={close}>Cancel</Button>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Title" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Category</label>
              <select
                value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Thumbnail URL *" type="url" required value={form.thumbnail} onChange={(v) => setForm({ ...form, thumbnail: v })} placeholder="https://... or /images/..." />
            <Field label="Date" type="date" required value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            <Field label="Read Time" required value={form.read_time} onChange={(v) => setForm({ ...form, read_time: v })} placeholder="5 min read" />
          </div>
          <Field label="Excerpt (Short Description)" textarea required value={form.excerpt} onChange={(v) => setForm({ ...form, excerpt: v })} />
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Content</label>
            <RichTextEditor content={form.content} onChange={(content) => setForm({ ...form, content })} />
          </div>
          <Button
            type="submit" disabled={saving}
            className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
          >
            {saving ? 'Saving...' : (editing ? 'Update Post' : 'Create Post')}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white p-10 border shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-bold text-primary flex items-center gap-2">
          <FileText size={20} /> Blog Posts ({list.length})
        </h2>
        <Button onClick={() => open()} className="gap-2"><Plus size={16} /> New Post</Button>
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : list.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No posts yet. Create your first post!</p>
      ) : (
        <div className="space-y-4">
          {list.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4 border hover:bg-secondary/20">
              {p.thumbnail && <img src={p.thumbnail} alt="" className="w-20 h-20 object-cover" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-accent">{p.category}</span>
                  {p.published ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                      <Eye size={12} /> Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                      <EyeOff size={12} /> Draft
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-primary truncate">{p.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{p.excerpt}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {p.date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {p.read_time}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => open(p)}><Edit size={14} /></Button>
                <Button variant="outline" size="sm" onClick={() => remove(p.id)} className="text-destructive">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, required, type = 'text', placeholder, textarea,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
  type?: string; placeholder?: string; textarea?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">{label}{required ? ' *' : ''}</label>
      {textarea ? (
        <textarea
          value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          rows={3} required={required}
          className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      ) : (
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          required={required} placeholder={placeholder}
          className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      )}
    </div>
  );
}
