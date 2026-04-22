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

  const handleDownload = (resource: Resource) => {
    if (isUnlocked && resource.url) {
      const link = document.createElement('a');
      link.href = resource.url;
      link.download = resource.title + '.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${resource.title}...`);
    } else {
      toast.info('Enter your email above to unlock all resources');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-background">
      <SEO 
        title="Free Property Development Resources, Tools & Guides | Ghan Projects"
        url="/resources"
        description="Access free property development calculators, feasibility checklists, due diligence guides, and investment resources. Professional tools for Melbourne property investors and developers."
        keywords="property development resources, rental yield calculator, stamp duty calculator, property feasibility checklist, investment property guides, due diligence checklist, Melbourne property tools"
      />
      
      {/* Hero */}
      <section className="relative py-24 lg:py-36 px-6 lg:px-12 bg-primary text-white overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:w-1/2"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold mb-6">Strategic <span className="text-accent">Resources</span></h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed mb-8">
              Access our proprietary tools and guides designed to help you navigate the Melbourne property market with confidence.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold uppercase tracking-wider text-accent">
              <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Calculators</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Guides</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Checklists</span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:w-1/2 w-full bg-white/5 backdrop-blur-sm border border-white/10 p-8 lg:p-10"
          >
            {isUnlocked ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                    <Unlock size={24} />
                  </div>
                  <h2 className="text-2xl font-heading font-bold">Premium Access Granted</h2>
                </div>
                <p className="text-white/60">You now have full access to all premium resources. Scroll down to download any guide you need.</p>
                <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/20 text-green-400">
                  <CheckCircle2 size={24} />
                  <span className="font-medium">All resources are now available for download</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent">
                    <Lock size={24} />
                  </div>
                  <h2 className="text-2xl font-heading font-bold">Unlock Premium Resources</h2>
                </div>
                <p className="text-white/60">Enter your email to unlock all premium checklists and guides, plus receive strategic updates.</p>
                <form onSubmit={handleDownloadRequest} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                    <input 
                      type="email" 
                      required
                      placeholder="Your Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 p-4 pl-12 focus:outline-none focus:ring-2 focus:ring-accent text-white transition-all"
                    />
                  </div>
                  <Button 
                    disabled={isSubmitting}
                    className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider h-auto"
                  >
                    {isSubmitting ? 'Processing...' : 'Unlock All Resources'}
                  </Button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Free Tools Section */}
      <section className="py-20 px-6 lg:px-12 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                <Unlock size={16} />
              </div>
              <h2 className="text-2xl font-heading font-bold text-primary">Free Tools</h2>
            </div>
            <p className="text-muted-foreground">Access these powerful tools instantly—no signup required.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      className="group bg-white p-6 sm:p-8 border border-gray-100 hover:border-accent hover:shadow-xl transition-all duration-300 flex gap-6 h-full"
                    >
                      <div className="w-14 h-14 bg-green-500/10 rounded-lg flex items-center justify-center text-green-600 shrink-0 group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                        <Icon size={28} />
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-xl font-heading font-bold text-primary group-hover:text-accent transition-colors mb-2">{res.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{res.desc}</p>
                        <span className="text-accent font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                          {res.isExternal ? 'Launch Tool' : 'Use Calculator'} <ChevronRight size={14} />
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <div className="group bg-white p-6 sm:p-8 border border-gray-100 hover:border-accent hover:shadow-xl transition-all duration-300 flex gap-6 h-full">
                      <div className="w-14 h-14 bg-green-500/10 rounded-lg flex items-center justify-center text-green-600 shrink-0 group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                        <Icon size={28} />
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-xl font-heading font-bold text-primary group-hover:text-accent transition-colors mb-2">{res.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{res.desc}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Premium Resources Section */}
      <section className="py-20 px-6 lg:px-12 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUnlocked ? 'bg-green-500/10 text-green-500' : 'bg-accent/10 text-accent'}`}>
                {isUnlocked ? <Unlock size={16} /> : <Lock size={16} />}
              </div>
              <h2 className="text-2xl font-heading font-bold text-primary">Premium Guides & Checklists</h2>
            </div>
            <p className="text-muted-foreground">
              {isUnlocked 
                ? 'Download our proprietary checklists and guides.' 
                : 'Unlock access by entering your email above.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lockedResources.map((res, i) => (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group bg-white p-6 sm:p-8 border border-gray-100 hover:border-accent hover:shadow-xl transition-all duration-300 flex gap-6"
              >
                <div className="w-14 h-14 bg-primary/5 rounded-lg flex items-center justify-center text-primary shrink-0 group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                  <FileText size={28} />
                </div>
                <div className="flex-grow space-y-4">
                  <div>
                    <h3 className="text-xl font-heading font-bold text-primary group-hover:text-accent transition-colors mb-2">{res.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{res.desc}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className={`rounded-none transition-all text-xs font-bold uppercase tracking-wider px-5 h-9 gap-2 ${
                      isUnlocked 
                        ? 'border-accent text-accent hover:bg-accent hover:text-white' 
                        : 'border-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={() => handleDownload(res)}
                    disabled={!isUnlocked}
                  >
                    {isUnlocked ? <Download size={14} /> : <Lock size={14} />} 
                    {isUnlocked ? 'Download PDF' : 'Locked'}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-12 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold">Ready to Take the Next Step?</h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Our resources are just the beginning. Book a consultation with our team to discuss your specific property goals and get personalized guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="rounded-none bg-accent hover:bg-accent/90 text-white px-8 py-6 font-heading font-bold uppercase tracking-wider">
                <Link to="/book-consultation">Book Free Consultation</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-none border-white/30 text-white hover:bg-white/10 px-8 py-6 font-heading font-bold uppercase tracking-wider">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Strategic Value Section */}
      <section className="py-24 px-6 lg:px-12 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2 space-y-6">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary leading-tight">Why We Share Our Proprietary Frameworks</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              At Ghan Projects, we believe in radical transparency. By sharing the tools we use to assess Melbourne's top development sites, we build trust and help our partners understand the rigor required for success.
            </p>
            <ul className="space-y-3">
              {[
                'Standardizing feasibility metrics across the industry.',
                'Reducing risk for capital and equity partners.',
                'Empowering investors with data-driven decision tools.',
                'Creating a common language for project success.'
              ].map(text => (
                <li key={text} className="flex gap-3 items-center font-medium text-primary">
                  <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <CheckCircle2 size={12} />
                  </div>
                  <span className="text-sm">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2 grid grid-cols-2 gap-4">
            <div className="bg-secondary/30 aspect-square p-6 flex flex-col justify-between border">
              <span className="text-3xl font-heading font-bold text-primary/20">01</span>
              <h4 className="font-heading font-bold text-lg">Analyze</h4>
            </div>
            <div className="bg-primary aspect-square p-6 flex flex-col justify-between text-white">
              <span className="text-3xl font-heading font-bold text-white/20">02</span>
              <h4 className="font-heading font-bold text-lg">Structure</h4>
            </div>
            <div className="bg-accent aspect-square p-6 flex flex-col justify-between text-white">
              <span className="text-3xl font-heading font-bold text-white/20">03</span>
              <h4 className="font-heading font-bold text-lg">Deliver</h4>
            </div>
            <div className="bg-secondary aspect-square p-6 flex flex-col justify-between border border-primary/10">
              <span className="text-3xl font-heading font-bold text-primary/20">04</span>
              <h4 className="font-heading font-bold text-lg">Scale</h4>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
