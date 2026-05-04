import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/auth';

export default function EmailPanel() {
  const [senderName, setSenderName] = useState('');
  const [senderPrefix, setSenderPrefix] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isHtml, setIsHtml] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('senderName', senderName);
      fd.append('senderPrefix', senderPrefix);
      fd.append('recipientEmail', recipientEmail);
      fd.append('subject', subject);
      fd.append('body', body);
      fd.append('isHtml', String(isHtml));
      attachments.forEach((f) => fd.append('attachments', f));

      const res = await fetch(`${API_URL}/api/admin/send-email`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (res.ok) {
        toast.success('Email sent');
        setSenderName(''); setSenderPrefix(''); setRecipientEmail('');
        setSubject(''); setBody(''); setAttachments([]);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to send email');
      }
    } finally {
      setSending(false);
    }
  };

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachments((p) => [...p, ...Array.from(e.target.files!)]);
  };
  const remove = (i: number) => setAttachments((p) => p.filter((_, idx) => idx !== i));

  return (
    <div className="bg-white p-10 border shadow-xl">
      <h2 className="text-xl font-heading font-bold text-primary mb-6 flex items-center gap-2">
        <Send size={20} /> Send Email
      </h2>
      <form onSubmit={send} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Sender Name" placeholder="e.g. Jobs, Support, Info" required value={senderName} onChange={setSenderName} />
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Email Prefix</label>
            <div className="flex">
              <input
                type="text" value={senderPrefix} onChange={(e) => setSenderPrefix(e.target.value)}
                placeholder="e.g. jobs, support" required
                className="flex-grow bg-secondary/30 border border-border border-r-0 p-4 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <span className="bg-primary text-white px-4 flex items-center text-sm font-medium">
                @ghanprojects.com.au
              </span>
            </div>
          </div>
        </div>
        <Field label="Recipient Email" type="email" required value={recipientEmail} onChange={setRecipientEmail} />
        <Field label="Subject" required value={subject} onChange={setSubject} />
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Body</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isHtml} onChange={(e) => setIsHtml(e.target.checked)} className="w-4 h-4" />
              <span className="text-muted-foreground">HTML Content</span>
            </label>
          </div>
          <textarea
            value={body} onChange={(e) => setBody(e.target.value)} required rows={10}
            placeholder={isHtml ? '<h1>Hello</h1><p>...</p>' : 'Your message here...'}
            className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
          />
        </div>
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Attachments</label>
          <div className="flex flex-wrap gap-2">
            {attachments.map((f, i) => (
              <div key={i} className="flex items-center gap-2 bg-secondary px-3 py-2 text-sm">
                <Paperclip size={14} />
                <span className="max-w-[150px] truncate">{f.name}</span>
                <button type="button" onClick={() => remove(i)} className="text-destructive hover:text-destructive/80">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-primary cursor-pointer hover:bg-secondary/80 transition-colors">
            <Paperclip size={16} />
            <span className="text-sm font-medium">Add Attachments</span>
            <input type="file" multiple onChange={addFiles} className="hidden" />
          </label>
        </div>
        <Button
          type="submit" disabled={sending}
          className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
        >
          {sending ? 'Sending...' : 'Send Email'}
        </Button>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, required, type = 'text', placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
  type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">{label}{required ? ' *' : ''}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder}
        className="w-full bg-secondary/30 border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
