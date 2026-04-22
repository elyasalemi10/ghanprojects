import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Lock, Send, Paperclip, X, LogOut, Mail, Users, FileText,
  Plus, Edit, Trash2, Eye, EyeOff, Calendar, Clock, Search
} from 'lucide-react';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

type Tab = 'email' | 'members' | 'blog';

interface Signup {
  id: number;
  email: string;
  source: string;
  created_at: string;
}

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

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('email');

  // Email state
  const [senderName, setSenderName] = useState('');
  const [senderPrefix, setSenderPrefix] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isHtml, setIsHtml] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Members state
  const [signups, setSignups] = useState<Signup[]>([]);
  const [signupsLoading, setSignupsLoading] = useState(false);
  const [signupSearch, setSignupSearch] = useState('');
  const [signupFilter, setSignupFilter] = useState('all');

  // Blog state
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    category: 'Strategy',
    thumbnail: '',
    date: new Date().toISOString().split('T')[0],
    read_time: '5 min read',
    content: '',
    excerpt: ''
  });
  const [isSavingPost, setIsSavingPost] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        setIsAuthenticated(true);
        toast.success('Logged in successfully');
      } else {
        toast.error('Invalid credentials');
      }
    } catch {
      toast.error('Failed to connect to server');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Fetch data when tabs change
  useEffect(() => {
    if (!isAuthenticated) return;
    
    if (activeTab === 'members') {
      fetchSignups();
    } else if (activeTab === 'blog') {
      fetchPosts();
    }
  }, [activeTab, isAuthenticated]);

  const fetchSignups = async () => {
    setSignupsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/signups`);
      if (res.ok) {
        const data = await res.json();
        setSignups(data);
      }
    } catch (error) {
      console.error('Error fetching signups:', error);
    } finally {
      setSignupsLoading(false);
    }
  };

  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('senderName', senderName);
      formData.append('senderPrefix', senderPrefix);
      formData.append('recipientEmail', recipientEmail);
      formData.append('subject', subject);
      formData.append('body', body);
      formData.append('isHtml', String(isHtml));
      
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const res = await fetch(`${API_URL}/api/admin/send-email`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        toast.success('Email sent successfully!');
        setSenderName('');
        setSenderPrefix('');
        setRecipientEmail('');
        setSubject('');
        setBody('');
        setAttachments([]);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to send email');
      }
    } catch {
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const deleteSignup = async (id: number) => {
    if (!confirm('Are you sure you want to delete this signup?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/signups/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSignups(prev => prev.filter(s => s.id !== id));
        toast.success('Signup deleted');
      }
    } catch {
      toast.error('Failed to delete signup');
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPost(true);

    try {
      const url = editingPost 
        ? `${API_URL}/api/admin/posts/${editingPost.id}`
        : `${API_URL}/api/admin/posts`;
      
      const res = await fetch(url, {
        method: editingPost ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...postForm, published: true })
      });

      if (res.ok) {
        toast.success(editingPost ? 'Post updated!' : 'Post created!');
        setEditingPost(null);
        setIsCreatingPost(false);
        resetPostForm();
        fetchPosts();
      } else {
        toast.error('Failed to save post');
      }
    } catch {
      toast.error('Failed to save post');
    } finally {
      setIsSavingPost(false);
    }
  };

  const deletePost = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
        toast.success('Post deleted');
      }
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const editPost = (post: BlogPost) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      category: post.category,
      thumbnail: post.thumbnail,
      date: post.date,
      read_time: post.read_time,
      content: post.content,
      excerpt: post.excerpt
    });
    setIsCreatingPost(true);
  };

  const resetPostForm = () => {
    setPostForm({
      title: '',
      category: 'Strategy',
      thumbnail: '',
      date: new Date().toISOString().split('T')[0],
      read_time: '5 min read',
      content: '',
      excerpt: ''
    });
  };

  const filteredSignups = signups.filter(signup => {
    const matchesSearch = signup.email.toLowerCase().includes(signupSearch.toLowerCase());
    const matchesFilter = signupFilter === 'all' || signup.source === signupFilter;
    return matchesSearch && matchesFilter;
  });

  const sourceLabels: Record<string, string> = {
    resources: 'Resources',
    contact: 'Contact Form',
    consultation: 'Consultation',
    investor_network: 'Investor Network'
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="bg-white p-10 border shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="text-primary" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-primary">Admin Access</h1>
                <p className="text-sm text-muted-foreground">Enter your credentials</p>
              </div>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
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
                />
              </div>
              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full rounded-none bg-primary text-white py-6 font-heading font-bold uppercase tracking-wider"
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-heading font-bold text-primary">Admin Dashboard</h1>
          <Button variant="outline" onClick={() => setIsAuthenticated(false)} className="gap-2">
            <LogOut size={16} /> Logout
          </Button>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => { setActiveTab('email'); setIsCreatingPost(false); }}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'email' 
                  ? 'border-accent text-accent' 
                  : 'border-transparent text-muted-foreground hover:text-primary'
              }`}
            >
              <Mail size={18} /> Emailing
            </button>
            <button
              onClick={() => { setActiveTab('members'); setIsCreatingPost(false); }}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'members' 
                  ? 'border-accent text-accent' 
                  : 'border-transparent text-muted-foreground hover:text-primary'
              }`}
            >
              <Users size={18} /> Members
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'blog' 
                  ? 'border-accent text-accent' 
                  : 'border-transparent text-muted-foreground hover:text-primary'
              }`}
            >
              <FileText size={18} /> Blog Posts
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* EMAIL TAB */}
        {activeTab === 'email' && (
          <div className="bg-white p-10 border shadow-xl">
            <h2 className="text-xl font-heading font-bold text-primary mb-6 flex items-center gap-2">
              <Send size={20} /> Send Email
            </h2>
            
            <form onSubmit={handleSendEmail} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Sender Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Jobs, Support, Info"
                    className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Email Prefix</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={senderPrefix}
                      onChange={(e) => setSenderPrefix(e.target.value)}
                      placeholder="e.g. jobs, support"
                      className="flex-grow bg-secondary/30 border border-border border-r-0 p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    />
                    <span className="bg-primary text-white px-4 flex items-center text-sm font-medium">
                      @ghanprojects.com.au
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Recipient Email</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Body</label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHtml}
                      onChange={(e) => setIsHtml(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-muted-foreground">HTML Content</span>
                  </label>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={isHtml ? "<h1>Hello</h1><p>Your HTML content here...</p>" : "Your message here..."}
                  rows={10}
                  className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Attachments</label>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-secondary px-3 py-2 text-sm">
                      <Paperclip size={14} />
                      <span className="max-w-[150px] truncate">{file.name}</span>
                      <button type="button" onClick={() => removeAttachment(index)} className="text-destructive hover:text-destructive/80">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-primary cursor-pointer hover:bg-secondary/80 transition-colors">
                  <Paperclip size={16} />
                  <span className="text-sm font-medium">Add Attachments</span>
                  <input type="file" multiple onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSending}
                className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
              >
                {isSending ? 'Sending...' : 'Send Email'}
              </Button>
            </form>
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div className="bg-white p-10 border shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-bold text-primary flex items-center gap-2">
                <Users size={20} /> Email Signups ({filteredSignups.length})
              </h2>
              <Button onClick={fetchSignups} variant="outline" size="sm">
                Refresh
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={signupSearch}
                  onChange={(e) => setSignupSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <select
                value={signupFilter}
                onChange={(e) => setSignupFilter(e.target.value)}
                className="px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Sources</option>
                <option value="resources">Resources</option>
                <option value="contact">Contact Form</option>
                <option value="consultation">Consultation</option>
                <option value="investor_network">Investor Network</option>
              </select>
            </div>

            {signupsLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredSignups.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No signups found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">Email</th>
                      <th className="text-left py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">Source</th>
                      <th className="text-left py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">Date</th>
                      <th className="text-right py-3 px-4 font-bold text-[10px] uppercase tracking-widest text-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSignups.map((signup) => (
                      <tr key={signup.id} className="border-b hover:bg-secondary/20">
                        <td className="py-3 px-4 font-medium">{signup.email}</td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-1 bg-secondary text-xs font-medium rounded">
                            {sourceLabels[signup.source] || signup.source}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {new Date(signup.created_at).toLocaleDateString()} {new Date(signup.created_at).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => deleteSignup(signup.id)}
                            className="text-destructive hover:text-destructive/80"
                          >
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
        )}

        {/* BLOG TAB */}
        {activeTab === 'blog' && !isCreatingPost && (
          <div className="bg-white p-10 border shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-bold text-primary flex items-center gap-2">
                <FileText size={20} /> Blog Posts ({posts.length})
              </h2>
              <Button onClick={() => { setIsCreatingPost(true); setEditingPost(null); resetPostForm(); }} className="gap-2">
                <Plus size={16} /> New Post
              </Button>
            </div>

            {postsLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : posts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No posts yet. Create your first post!</p>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-secondary/20">
                    {post.thumbnail && (
                      <img src={post.thumbnail} alt="" className="w-20 h-20 object-cover rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-accent">{post.category}</span>
                        {post.published ? (
                          <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                            <Eye size={12} /> Published
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                            <EyeOff size={12} /> Draft
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-primary truncate">{post.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{post.excerpt}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {post.read_time}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => editPost(post)}>
                        <Edit size={14} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deletePost(post.id)} className="text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BLOG EDITOR */}
        {activeTab === 'blog' && isCreatingPost && (
          <div className="bg-white p-10 border shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-bold text-primary">
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </h2>
              <Button variant="outline" onClick={() => { setIsCreatingPost(false); setEditingPost(null); }}>
                Cancel
              </Button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Title</label>
                  <input
                    type="text"
                    value={postForm.title}
                    onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Post title"
                    className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Category</label>
                  <select
                    value={postForm.category}
                    onChange={(e) => setPostForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Thumbnail URL *</label>
                  <input
                    type="url"
                    value={postForm.thumbnail}
                    onChange={(e) => setPostForm(prev => ({ ...prev, thumbnail: e.target.value }))}
                    placeholder="https://... or /images/..."
                    className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Date</label>
                  <input
                    type="date"
                    value={postForm.date}
                    onChange={(e) => setPostForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Read Time</label>
                  <input
                    type="text"
                    value={postForm.read_time}
                    onChange={(e) => setPostForm(prev => ({ ...prev, read_time: e.target.value }))}
                    placeholder="5 min read"
                    className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Excerpt (Short Description)</label>
                <textarea
                  value={postForm.excerpt}
                  onChange={(e) => setPostForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="A brief description shown in the article list..."
                  rows={3}
                  className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Content</label>
                <RichTextEditor 
                  content={postForm.content} 
                  onChange={(content) => setPostForm(prev => ({ ...prev, content }))} 
                />
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={isSavingPost}
                  className="flex-1 rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
                >
                  {isSavingPost ? 'Saving...' : (editingPost ? 'Update Post' : 'Create Post')}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
