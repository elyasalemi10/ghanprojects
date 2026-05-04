import { Construction } from 'lucide-react';

export default function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="bg-white p-12 border shadow-xl flex flex-col items-center justify-center text-center min-h-[400px]">
      <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
        <Construction className="text-accent" size={28} />
      </div>
      <h2 className="text-2xl font-heading font-bold text-primary mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md">{note}</p>
    </div>
  );
}
