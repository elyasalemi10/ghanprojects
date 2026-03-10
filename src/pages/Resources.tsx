import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileText, Download, Lock, CheckCircle2, ChevronRight, Mail, Unlock, Bot, ExternalLink, Calculator, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '@/components/shared/SEO';
import { freeResources, lockedResources, type Resource } from '@/data/resources';

const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

const getResourceIcon = (resource: Resource) => {
  if (resource.id === 'ai-assistant') return Bot;
  if (resource.id === 'subdivision-checker') return Layers;
  if (resource.type === 'Tool') return Calculator;
  return FileText;
};

export default function Resources() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      setIsUnlocked(true);
      toast.success('Resources unlocked! You now have full access.');
    }
  }, []);

  const handleDownloadRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/resources/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (res.ok) {
        toast.success('Check your email for the access link!');
        setEmail('');
      } else {
        toast.error('Failed to send email. Please try again.');
      }
    } catch {
      toast.error('Failed to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background">
      <SEO 
        title="Free Property Development Resources & Guides"
        url="/resources"
        description="Download free property development resources including feasibility checklists, financial templates, and property investment guides. Expert tools for Melbourne property investors and developers."
        keywords="property development resources, property feasibility checklist, investment property guides, property development templates, free property resources Melbourne"
      />
      {/* Hero */}
      <section className="relative py-32 lg:py-48 px-6 lg:px-12 bg-primary text-white overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:w-1/2"
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8">Strategic <span className="text-accent">Resources</span></h1>
            <p className="text-xl md:text-2xl text-white/70 leading-relaxed mb-10">
              Access our proprietary tools and guides designed to help you navigate the Melbourne property market with confidence.
            </p>
            <div className="flex items-center gap-6 text-sm font-bold uppercase tracking-[0.2em] text-accent">
              <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Calculators</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Guides</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Checklists</span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:w-1/2 bg-white/5 backdrop-blur-sm border border-white/10 p-10 lg:p-14 space-y-8"
          >
            {isUnlocked ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                    <Unlock size={24} />
                  </div>
                  <h2 className="text-2xl font-heading font-bold">Premium Access Granted</h2>
                </div>
                <p className="text-white/60">You now have full access to all premium resources. Scroll down to download any checklist or guide you need.</p>
                <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/20 text-green-400">
                  <CheckCircle2 size={24} />
                  <span className="font-medium">All premium resources are now available</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent">
                    <Lock size={24} />
                  </div>
                  <h2 className="text-2xl font-heading font-bold">Unlock Premium Resources</h2>
                </div>
                <p className="text-white/60">Enter your email to unlock all premium checklists and guides, plus receive strategic updates from our specialists.</p>
                <form onSubmit={handleDownloadRequest} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                    <input 
                      type="email" 
                      required
                      placeholder="Your Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 p-5 pl-12 focus:outline-none focus:ring-2 focus:ring-accent text-white transition-all"
                    />
                  </div>
                  <Button 
                    disabled={isSubmitting}
                    className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-8 font-heading font-bold uppercase tracking-wider h-auto"
                  >
                    {isSubmitting ? 'Processing...' : 'Unlock Premium Resources'}
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Free Resources Section */}
      <section className="py-24 px-6 lg:px-12 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                <Unlock size={20} />
              </div>
              <h2 className="text-3xl font-heading font-bold text-primary">Free Tools</h2>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Access these powerful tools instantly—no signup required.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {freeResources.map((res, i) => {
              const Icon = getResourceIcon(res);
              const isExternalOrTool = res.type === 'External' || res.type === 'Tool';
              
              return (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  {isExternalOrTool ? (
                    <Link
                      to="/resources/$slug"
                      params={{ slug: res.slug }}
                      className="group bg-background p-10 border border-green-500/20 hover:border-accent transition-all duration-500 flex flex-col md:flex-row gap-10 shadow-sm hover:shadow-2xl block h-full"
                    >
                      <div className="w-20 h-20 bg-green-500/10 rounded-sm flex items-center justify-center text-green-600 shrink-0 group-hover:bg-accent group-hover:text-white transition-colors duration-500">
                        <Icon size={40} />
                      </div>
                      <div className="space-y-6 flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] uppercase tracking-widest font-bold text-accent">{res.cat}</span>
                              <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 bg-green-500/10 text-green-600 border border-green-500/20">Free</span>
                            </div>
                            <h3 className="text-2xl font-heading font-bold text-primary group-hover:text-accent transition-colors">{res.title}</h3>
                          </div>
                          {res.isExternal && (
                            <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap flex items-center gap-2">
                              <ExternalLink size={14} /> External
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {res.desc}
                        </p>
                        <div className="pt-6 border-t">
                          <span className="text-primary group-hover:text-accent font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                            {res.isExternal ? 'Launch Tool' : 'Use Calculator'} <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="group bg-background p-10 border border-green-500/20 hover:border-accent transition-all duration-500 flex flex-col md:flex-row gap-10 shadow-sm hover:shadow-2xl h-full">
                      <div className="w-20 h-20 bg-green-500/10 rounded-sm flex items-center justify-center text-green-600 shrink-0 group-hover:bg-accent group-hover:text-white transition-colors duration-500">
                        <Icon size={40} />
                      </div>
                      <div className="space-y-6 flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] uppercase tracking-widest font-bold text-accent">{res.cat}</span>
                              <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 bg-green-500/10 text-green-600 border border-green-500/20">Free</span>
                            </div>
                            <h3 className="text-2xl font-heading font-bold text-primary group-hover:text-accent transition-colors">{res.title}</h3>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {res.desc}
                        </p>
                        <div className="pt-6 border-t flex justify-between items-center">
                          <Button variant="link" className="p-0 h-auto text-primary hover:text-accent font-bold uppercase tracking-widest text-[10px] gap-2">
                            Learn More <ChevronRight size={14} />
                          </Button>
                          <Button 
                            variant="outline" 
                            className="rounded-none border-green-500 text-green-600 hover:bg-green-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest px-6 h-10 gap-2"
                          >
                            <Download size={14} /> Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Premium/Locked Resources Section */}
      <section className="py-24 px-6 lg:px-12 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isUnlocked ? 'bg-green-500/10 text-green-500' : 'bg-accent/10 text-accent'}`}>
                {isUnlocked ? <Unlock size={20} /> : <Lock size={20} />}
              </div>
              <h2 className="text-3xl font-heading font-bold text-primary">Premium Resources</h2>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              {isUnlocked 
                ? 'Download our proprietary checklists and guides used by our team.' 
                : 'Unlock access to our proprietary checklists and guides by entering your email above.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {lockedResources.map((res, i) => (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group bg-background p-10 border border-transparent hover:border-accent transition-all duration-500 flex flex-col md:flex-row gap-10 shadow-sm hover:shadow-2xl"
              >
                <div className="w-20 h-20 bg-primary/5 rounded-sm flex items-center justify-center text-primary shrink-0 group-hover:bg-accent group-hover:text-white transition-colors duration-500">
                  <FileText size={40} />
                </div>
                <div className="space-y-6 flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-accent mb-2 block">{res.cat}</span>
                      <h3 className="text-2xl font-heading font-bold text-primary group-hover:text-accent transition-colors">{res.title}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">{res.type} • {res.size}</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {res.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {res.tags?.map(tag => (
                      <span key={tag} className="text-[9px] uppercase tracking-widest font-bold px-2 py-1 bg-secondary text-primary/60 border border-primary/5">{tag}</span>
                    ))}
                  </div>
                  <div className="pt-6 border-t flex justify-between items-center">
                    <Button variant="link" className="p-0 h-auto text-primary hover:text-accent font-bold uppercase tracking-widest text-[10px] gap-2">
                      Learn More <ChevronRight size={14} />
                    </Button>
                    <Button 
                      variant="outline" 
                      className={`rounded-none transition-all text-[10px] font-bold uppercase tracking-widest px-6 h-10 gap-2 ${
                        isUnlocked 
                          ? 'border-accent text-accent hover:bg-accent hover:text-white' 
                          : 'border-primary text-primary group-hover:bg-primary group-hover:text-white'
                      }`}
                      onClick={() => {
                        if (isUnlocked) {
                          toast.success(`Downloading ${res.title}...`);
                        } else {
                          toast.info('Unlock all resources above to download');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                    >
                      {isUnlocked ? <CheckCircle2 size={14} /> : <Lock size={14} />} 
                      {isUnlocked ? 'Download Now' : 'Locked'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Value Section */}
      <section className="py-32 px-6 lg:px-12 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
          <div className="lg:w-1/2 space-y-8">
            <h2 className="text-4xl font-heading font-bold text-primary leading-tight">Why We Share Our Proprietary Frameworks</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              At Ghan Projects, we believe in radical transparency. By sharing the tools we use to assess Melbourne's top development sites, we build trust and help our partners understand the rigor required for success.
            </p>
            <ul className="space-y-4">
              {[
                'Standardizing feasibility metrics across the industry.',
                'Reducing risk for capital and equity partners.',
                'Empowering investors with data-driven decision tools.',
                'Creating a common language for project success.'
              ].map(text => (
                <li key={text} className="flex gap-4 items-center font-medium text-primary">
                  <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <CheckCircle2 size={14} />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2 grid grid-cols-2 gap-6">
            <div className="bg-secondary/30 aspect-square p-8 flex flex-col justify-between border">
              <span className="text-4xl font-heading font-bold text-primary/20">01</span>
              <h4 className="font-heading font-bold text-xl">Analyze</h4>
            </div>
            <div className="bg-primary aspect-square p-8 flex flex-col justify-between text-white">
              <span className="text-4xl font-heading font-bold text-white/20">02</span>
              <h4 className="font-heading font-bold text-xl">Structure</h4>
            </div>
            <div className="bg-accent aspect-square p-8 flex flex-col justify-between text-white">
              <span className="text-4xl font-heading font-bold text-white/20">03</span>
              <h4 className="font-heading font-bold text-xl">Deliver</h4>
            </div>
            <div className="bg-secondary aspect-square p-8 flex flex-col justify-between border border-primary/10">
              <span className="text-4xl font-heading font-bold text-primary/20">04</span>
              <h4 className="font-heading font-bold text-xl">Scale</h4>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
