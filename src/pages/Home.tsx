import React, { useRef } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  Target, 
  TrendingUp, 
  ChevronRight, 
  Briefcase, 
  Landmark, 
  Home as HomeIcon,
  Search,
  FileText,
  Clock,
  MapPin,
  Star,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FadeInWhenVisible } from '@/components/shared/FadeInWhenVisible';
import { SEO } from '@/components/shared/SEO';

// --- Data ---

const stats = [
  { label: 'Projects Delivered', value: '50+' },
  { label: 'Development Value', value: '$250M+' },
  { label: 'Industry Partners', value: '200+' },
  { label: 'Years Experience', value: '15+' },
];

const services = [
  {
    title: 'Property Advisory',
    desc: 'Strategic feasibility and project strategy to maximize development returns.',
    icon: <Target className="w-6 h-6" />,
  },
  {
    title: 'Buyer’s Agent',
    desc: 'Professional acquisition services for residential and development sites.',
    icon: <Search className="w-6 h-6" />,
  },
  {
    title: 'Joint Venture Development',
    desc: 'Structuring profitable partnerships between landowners and investors.',
    icon: <Users className="w-6 h-6" />,
  },
  {
    title: 'Project Management',
    desc: 'End-to-end delivery management from concept to completion.',
    icon: <Briefcase className="w-6 h-6" />,
  },
  {
    title: 'Off-Market Opportunities',
    desc: 'Exclusive access to strategic property deals before they hit the market.',
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    title: 'Development Finance',
    desc: 'Bespoke financing solutions and capital introductions for projects.',
    icon: <Landmark className="w-6 h-6" />,
  },
];

const projects = [
  {
    title: '4 Luxury Townhouses – Berwick',
    tags: ['Townhouse', 'Luxury'],
    result: '4 luxury townhouses successfully delivered',
    image: '/portfolio/4-luxury-townhouses/main.webp',
  },
  {
    title: '7 Luxury Townhouses – Mordialloc',
    tags: ['Townhouse', 'Luxury'],
    result: '7 high-end townhouses delivered',
    image: '/portfolio/7-luxury-townhouses/main.webp',
  },
  {
    title: 'Premium Duplex – Beaumaris',
    tags: ['Duplex', 'Residential'],
    result: 'Premium coastal duplex delivered',
    image: '/portfolio/duplex/main.webp',
  },
];

const opportunities = [
  {
    title: 'Development Site – Mount Waverley',
    bullets: ['850sqm Corner Site', 'Plans for 3 Luxury Townhouses', 'DA Approved'],
    status: 'High Demand',
  },
  {
    title: 'Subdivision Opportunity – Ringwood',
    bullets: ['Flat 1000sqm Allotment', 'Concept for 4 Units', 'Pre-market Sale'],
    status: 'Strategic',
  },
  {
    title: 'Townhouse Project – Bentleigh East',
    bullets: ['3 Bed, 2.5 Bath Units', 'Construction Starting Q3', 'Fixed Price Build'],
    status: 'Investor Ready',
  },
];

const steps = [
  { title: 'Identify Opportunity', desc: 'Rigorous market screening and off-market deal sourcing.' },
  { title: 'Feasibility Analysis', desc: 'Detailed financial modeling and risk assessment.' },
  { title: 'Deal Structuring', desc: 'Custom JV agreements and finance pathways.' },
  { title: 'Development Delivery', desc: 'Overseeing construction and project milestones.' },
  { title: 'Completion & Exit', desc: 'Marketing, sales, and capital realization.' },
];

const insights = [
  { title: 'How to Assess a Development Site in Melbourne', cat: 'Strategy', date: 'Oct 12, 2023' },
  { title: 'JV Property Development: How Profit Splits Work', cat: 'Finance', date: 'Sep 28, 2023' },
  { title: 'Feasibility Basics: Costs, Risks, and Returns', cat: 'Investment', date: 'Sep 15, 2023' },
];

const resources = [
  { title: 'Development Feasibility Checklist', type: 'PDF', size: '1.2 MB' },
  { title: 'Due Diligence Checklist', type: 'PDF', size: '0.8 MB' },
  { title: 'JV Partnership Guide', type: 'PDF', size: '2.4 MB' },
];

const HERO_IMAGE_URL = "/images/hero-home.webp";

export default function Home() {
  const heroRef = useRef(null);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  const handleJoinNetwork = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    
    if (!email?.trim() && !phone?.trim()) {
      toast.error('Please provide either an email address or phone number.');
      return;
    }
    
    const data = {
      fullName: formData.get('fullName'),
      email,
      phone,
      budgetRange: formData.get('budgetRange'),
      interestType: formData.get('interestType')
    };
    
    try {
      const res = await fetch(`${API_URL}/api/investor-network`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        toast.success('Welcome to the Investor Network!');
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error('Failed to submit. Please try again.');
      }
    } catch {
      toast.error('Failed to submit. Please try again.');
    }
  };

  return (
    <div className="overflow-hidden">
      <SEO 
        url="/"
        description="Melbourne's leading property development and investment consulting firm. Expert property advisory, joint venture structuring, buyer's agent services, and strategic property investment guidance."
        image="/images/hero-home.webp"
        keywords="property development Melbourne, property investment consulting, property advisory Melbourne, joint venture property development, buyer's agent Melbourne, Ghan Projects, Ghan Property Group, property consulting Melbourne, real estate investment Victoria"
      />
      {/* SECTION 1: HERO */}
      <section ref={heroRef} className="relative h-screen flex items-center px-6 lg:px-12 bg-primary overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-primary/40 z-10" />
          <img 
            src={HERO_IMAGE_URL} 
            className="w-full h-full object-cover"
            alt="Premium Melbourne Property"
          />
        </motion.div>
        
        <div className="relative z-20 max-w-4xl mx-auto lg:mx-0 text-white">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 text-balance leading-[1.1]">
              Strategic Property <span className="text-accent">Development</span> & Investment
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl leading-relaxed">
              Ghan Projects helps investors, landowners, and developers identify, structure, and deliver high-value property projects across Melbourne.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button asChild size="lg" className="rounded-none px-8 py-7 text-lg font-heading font-bold uppercase tracking-wider bg-accent text-white hover:bg-accent/90">
                <Link to="/book-consultation">Book Consultation</Link>
              </Button>
              <Button asChild size="lg" className="rounded-none px-8 py-7 text-lg font-heading font-bold uppercase tracking-wider bg-white text-primary hover:bg-white/90">
                <Link to="/portfolio">View Portfolio</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60 font-medium uppercase tracking-[0.2em]">
              <span>Advisory</span>
              <span className="w-1 h-1 bg-accent rounded-full" />
              <span>Acquisition</span>
              <span className="w-1 h-1 bg-accent rounded-full" />
              <span>Joint Ventures</span>
              <span className="w-1 h-1 bg-accent rounded-full" />
              <span>Project Delivery</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: TRUST STATS */}
      <section className="py-20 bg-background px-6 lg:px-12 border-b">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {stats.map((stat, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.1}>
                <div className="text-center lg:text-left space-y-2">
                  <div className="text-4xl md:text-5xl font-heading font-bold text-primary">{stat.value}</div>
                  <div className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">{stat.label}</div>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: SERVICES OVERVIEW */}
      <section className="py-32 bg-secondary/30 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <FadeInWhenVisible>
            <div className="mb-20 max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-6">Our Core Expertise</h2>
              <p className="text-xl text-muted-foreground">Comprehensive property services designed to navigate the complexities of development and acquisition.</p>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.1}>
                <div className="group bg-background p-10 border hover:border-accent transition-all duration-500 h-full flex flex-col shadow-sm hover:shadow-xl">
                  <div className="w-14 h-14 bg-primary/5 text-primary flex items-center justify-center mb-8 group-hover:bg-accent group-hover:text-white transition-colors duration-500">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-4">{service.title}</h3>
                  <p className="text-muted-foreground mb-8 flex-grow leading-relaxed">
                    {service.desc}
                  </p>
                  <Link to="/services" className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs hover:text-accent transition-colors">
                    Learn more <ChevronRight size={16} />
                  </Link>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURED PROJECTS */}
      <section className="py-32 bg-background px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <FadeInWhenVisible>
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-6">Portfolio Showcase</h2>
                <p className="text-xl text-muted-foreground">A track record of identifying value and delivering excellence across Melbourne's prime suburbs.</p>
              </div>
            </FadeInWhenVisible>
            <FadeInWhenVisible delay={0.2}>
              <Button asChild variant="outline" className="rounded-none border-primary text-primary hover:bg-primary hover:text-white px-8 py-6">
                <Link to="/portfolio">View All Portfolio</Link>
              </Button>
            </FadeInWhenVisible>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {projects.map((project, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.1}>
                <div className="group cursor-pointer">
                  <div className="relative aspect-[4/5] overflow-hidden mb-6">
                    <img 
                      src={project.image} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={project.title}
                    />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="flex gap-2 mb-4">
                    {project.tags.map(tag => (
                      <span key={tag} className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-secondary text-primary">{tag}</span>
                    ))}
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-2 group-hover:text-accent transition-colors">{project.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium mb-6 italic">{project.result}</p>
                  <Button variant="ghost" className="p-0 hover:bg-transparent text-primary hover:text-accent font-bold uppercase tracking-widest text-xs gap-2">
                    View Project <ChevronRight size={16} />
                  </Button>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: INVESTMENT OPPORTUNITIES */}
      <section className="py-32 bg-primary text-white px-6 lg:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/5 -skew-x-12 transform translate-x-1/2" />
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeInWhenVisible>
            <div className="mb-20 text-center">
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-white">Current Property Opportunities</h2>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">Request an information pack for select off-market and strategic opportunities currently in our pipeline.</p>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {opportunities.map((opp, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.1}>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-10 hover:bg-white/10 transition-all duration-500 group">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-accent mb-4 px-2 py-1 bg-accent/10 inline-block">{opp.status}</div>
                  <h3 className="text-2xl font-heading font-bold mb-6 text-white group-hover:text-accent transition-colors">{opp.title}</h3>
                  <ul className="space-y-4 mb-10">
                    {opp.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-white/70 text-sm">
                        <CheckCircle2 size={16} className="text-accent shrink-0" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => navigate({ 
                      to: '/contact', 
                      search: { message: `I am interested in an investment pack opportunity for ${opp.title}` } 
                    })}
                    className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider text-xs"
                  >
                    Request Investment Pack
                  </Button>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
          <p className="text-center text-white/40 text-sm italic">Opportunities change frequently. Register for updates via the Investor Network below.</p>
        </div>
      </section>

      {/* SECTION 6: HOW WE WORK */}
      <section className="py-32 bg-background px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <FadeInWhenVisible>
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-6">Our Strategic Process</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">A disciplined, end-to-end framework designed to mitigate risk and maximize capital appreciation.</p>
            </div>
          </FadeInWhenVisible>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-secondary -translate-y-1/2 z-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 relative z-10">
              {steps.map((step, i) => (
                <FadeInWhenVisible key={i} delay={i * 0.1}>
                  <div className="bg-background flex flex-col items-center lg:items-start text-center lg:text-left group">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-primary font-heading font-bold text-xl mb-8 group-hover:bg-accent group-hover:text-white transition-all duration-500 border-4 border-background outline outline-1 outline-secondary">
                      {i + 1}
                    </div>
                    <h3 className="text-xl font-heading font-bold mb-4">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </FadeInWhenVisible>
              ))}
            </div>
          </div>

          <div className="mt-20 text-center">
            <Button asChild size="lg" className="rounded-none px-10 py-7 font-heading font-bold uppercase tracking-wider text-xs bg-primary text-white">
              <Link to="/book-consultation">Book a Strategy Call</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 7 & 8: INSIGHTS & RESOURCES PREVIEW */}
      <section className="py-32 bg-secondary/20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Insights */}
          <div>
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-3xl font-heading font-bold text-primary">Latest Insights</h2>
              <Link to="/insights" className="text-xs uppercase tracking-widest font-bold text-accent hover:text-primary transition-colors">View All</Link>
            </div>
            <div className="space-y-6">
              {insights.map((article, i) => (
                <FadeInWhenVisible key={i} delay={i * 0.1}>
                  <div className="group bg-background p-6 flex gap-6 items-center border hover:border-accent transition-all duration-300 shadow-sm cursor-pointer">
                    <div className="w-24 h-24 bg-secondary shrink-0 hidden sm:block overflow-hidden">
                      <img src="/images/property-analysis.webp" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-accent mb-2">
                        <span>{article.cat}</span>
                        <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                        <span className="text-muted-foreground">{article.date}</span>
                      </div>
                      <h3 className="text-lg font-heading font-bold text-primary leading-snug group-hover:text-accent transition-colors">{article.title}</h3>
                    </div>
                  </div>
                </FadeInWhenVisible>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-3xl font-heading font-bold text-primary">Strategic Resources</h2>
              <Link to="/resources" className="text-xs uppercase tracking-widest font-bold text-accent hover:text-primary transition-colors">All Resources</Link>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {resources.map((res, i) => (
                <FadeInWhenVisible key={i} delay={i * 0.1}>
                  <div className="p-8 bg-primary text-white flex justify-between items-center group cursor-pointer hover:bg-primary/95 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-sm text-accent group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-lg mb-1">{res.title}</h3>
                        <span className="text-[10px] uppercase tracking-widest text-white/50">{res.type} • {res.size}</span>
                      </div>
                    </div>
                    <ChevronRight className="text-accent group-hover:translate-x-2 transition-transform" />
                  </div>
                </FadeInWhenVisible>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: INVESTOR NETWORK SIGNUP */}
      <section className="py-32 bg-background px-6 lg:px-12 border-y">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <FadeInWhenVisible>
              <div>
                <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-8 leading-tight">Join the Ghan Projects <span className="text-accent italic">Investor Network</span></h2>
                <p className="text-xl text-muted-foreground mb-10 leading-relaxed">Gain priority access to off-market opportunities, JV projects, and institutional-grade market insights across the Melbourne property landscape.</p>
                <div className="space-y-6">
                  {[
                    'First access to off-market development sites',
                    'Strategic joint-venture structuring options',
                    'Monthly Melbourne property market analysis',
                    'Exclusive investor networking events'
                  ].map(text => (
                    <div key={text} className="flex items-center gap-4 text-primary font-medium">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <CheckCircle2 size={16} />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </FadeInWhenVisible>

            <FadeInWhenVisible delay={0.2}>
              <div className="bg-secondary/30 p-10 lg:p-14 border border-secondary shadow-2xl">
                <form onSubmit={handleJoinNetwork} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Full Name</label>
                      <input 
                        name="fullName" 
                        required 
                        placeholder="John Doe"
                        className="w-full bg-white border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Email Address <span className="text-muted-foreground normal-case">(or phone)</span></label>
                      <input 
                        name="email" 
                        type="email" 
                        placeholder="john@example.com"
                        className="w-full bg-white border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Phone Number <span className="text-muted-foreground normal-case">(or email)</span></label>
                      <input 
                        name="phone" 
                        placeholder="+61 400 000 000"
                        className="w-full bg-white border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Budget Range</label>
                      <select name="budgetRange" className="w-full bg-white border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent transition-all appearance-none cursor-pointer">
                        <option>$500k - $1M</option>
                        <option>$1M - $3M</option>
                        <option>$3M - $5M</option>
                        <option>$5M+</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Investment Interest</label>
                    <select name="interestType" className="w-full bg-white border border-border p-4 focus:outline-none focus:ring-2 focus:ring-accent transition-all appearance-none cursor-pointer">
                      <option>Off-market Opportunities</option>
                      <option>Joint Venture (JV) Projects</option>
                      <option>Development Sites</option>
                      <option>Investment Properties</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full rounded-none bg-primary hover:bg-primary/95 text-white py-8 font-heading font-bold uppercase tracking-wider text-sm mt-4">
                    Join Network
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center pt-2 uppercase tracking-tighter">By joining, you agree to receive communications regarding strategic property opportunities.</p>
                </form>
              </div>
            </FadeInWhenVisible>
          </div>
        </div>
      </section>

      {/* SECTION 10: TESTIMONIALS */}
      <section className="py-32 bg-secondary/10 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <FadeInWhenVisible>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-6">Client Experiences</h2>
              <div className="flex justify-center gap-1 mb-4 text-accent">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} fill="currentColor" />)}
              </div>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { name: 'David Wilson', role: 'Property Investor', quote: 'The off-market site sourced by Ghan Projects exceeded all our feasibility benchmarks. Their transparency and network in Melbourne is unparalleled.' },
              { name: 'Sarah Thompson', role: 'Landowner', quote: 'We had a large block but no idea how to develop it. Ghan Projects structured a JV that was win-win for everyone involved. Highly professional.' },
              { name: 'Marcus Chen', role: 'Developer', quote: 'As a mid-scale developer, I need project management I can trust. Ghan Projects takes the stress out of delivery and keeps things on track.' }
            ].map((t, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.1}>
                <div className="bg-background p-10 border shadow-sm relative italic leading-relaxed text-muted-foreground">
                  <div className="absolute top-0 right-10 -translate-y-1/2 w-12 h-12 bg-accent text-white flex items-center justify-center rounded-full">
                    <Star size={24} />
                  </div>
                  <p className="mb-8">"{t.quote}"</p>
                  <div className="not-italic">
                    <h4 className="font-heading font-bold text-primary uppercase tracking-wider">{t.name}</h4>
                    <span className="text-[10px] uppercase tracking-widest text-accent font-bold">{t.role}</span>
                  </div>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 11: FINAL CTA */}
      <section className="py-32 bg-primary text-white px-6 lg:px-12 text-center relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-accent/5 -skew-y-6 transform translate-y-1/2" />
        <div className="max-w-4xl mx-auto relative z-10">
          <FadeInWhenVisible>
            <h2 className="text-5xl md:text-7xl font-heading font-bold mb-8 text-white leading-tight">Start Your Next Property <span className="text-accent italic">Opportunity</span></h2>
            <p className="text-xl md:text-2xl text-white/70 mb-12 leading-relaxed">Whether you're looking to acquire, develop, or invest, Ghan Projects provides the strategic edge you need in Melbourne's property market.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Button asChild size="lg" className="rounded-none px-12 py-8 text-lg font-heading font-bold uppercase tracking-wider bg-accent text-white hover:bg-accent/90">
                <Link to="/book-consultation">Book Consultation</Link>
              </Button>
              <Button asChild size="lg" className="rounded-none px-12 py-8 text-lg font-heading font-bold uppercase tracking-wider bg-white text-primary hover:bg-white/90">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>
    </div>
  );
}
