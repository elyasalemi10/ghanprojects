import React from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FadeInWhenVisible } from '@/components/shared/FadeInWhenVisible';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/shared/SEO';
import { 
  Target, 
  Search, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Landmark, 
  Building2,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

const services = [
  {
    id: 'advisory',
    icon: <Target size={48} />,
    title: 'Property Advisory & Consultation',
    subtitle: 'Feasibility + Strategy',
    desc: 'Expert guidance to navigate the complexities of property investment and development. We provide the data-driven insights needed to make informed decisions.',
    for: 'Investors, Landowners, Developers',
    process: [
      'Site identification and initial screening',
      'Detailed financial feasibility modeling',
      'Highest-and-best-use (HBU) analysis',
      'Strategic project roadmap development'
    ],
    benefits: [
      'Mitigate financial and planning risks',
      'Optimize project returns and margins',
      'Data-backed decision making'
    ]
  },
  {
    id: 'acquisition',
    icon: <Search size={48} />,
    title: 'Buyer’s Agent Services',
    subtitle: 'Strategic Acquisition',
    desc: 'Professional representation for property buyers. We source, evaluate, and negotiate residential and development assets on your behalf.',
    for: 'Home Buyers, SMSF Investors, Developers',
    process: [
      'Comprehensive brief alignment',
      'Melbourne-wide property search',
      'Rigorous due diligence & appraisal',
      'Professional negotiation and settlement'
    ],
    benefits: [
      'Access to off-market inventory',
      'Save time and remove emotional bias',
      'Securing assets at the best possible price'
    ]
  },
  {
    id: 'jv',
    icon: <Users size={48} />,
    title: 'Joint Venture Development',
    subtitle: 'Capital + Land Synergy',
    desc: 'Structuring profitable partnerships. We connect landowners with capital and expertise to deliver high-yielding development projects.',
    for: 'Landowners, Sophisticated Investors',
    process: [
      'Potential JV site assessment',
      'Investor/Partner matching',
      'Legal and profit-share structuring',
      'Full project implementation management'
    ],
    benefits: [
      'Unlock land value without selling',
      'Access experienced development teams',
      'Diversify investment portfolios'
    ]
  },
  {
    id: 'pm',
    icon: <Briefcase size={48} />,
    title: 'Project Management',
    subtitle: 'End-to-End Delivery',
    desc: 'Total management of the development lifecycle. From planning and design through to construction and final handover.',
    for: 'Developers, Busy Investors',
    process: [
      'Consultant team selection & management',
      'Planning and building permit oversight',
      'Tender management and builder selection',
      'On-site construction supervision'
    ],
    benefits: [
      'Ensure project stays on time and budget',
      'Strict quality control and risk mitigation',
      'Stress-free development experience'
    ]
  },
  {
    id: 'off-market',
    icon: <TrendingUp size={48} />,
    title: 'Off-Market Opportunities',
    subtitle: 'Exclusive Deal Flow',
    desc: 'Exclusive access to strategic property deals before they reach the public market. We leverage our network to secure unique assets.',
    for: 'Developers, Value-Add Investors',
    process: [
      'Vendor direct relationship management',
      'Pre-market feasibility assessment',
      'Discreet transaction handling',
      'Strategic exit planning'
    ],
    benefits: [
      'Avoid competitive bidding wars',
      'Secure sites at wholesale pricing',
      'Priority access to high-value sites'
    ]
  },
  {
    id: 'finance',
    icon: <Landmark size={48} />,
    title: 'Development Finance',
    subtitle: 'Capital Structuring',
    desc: 'Bespoke financing solutions tailored for property projects. We facilitate capital introductions and optimize debt/equity ratios.',
    for: 'Property Developers, JV Partners',
    process: [
      'Finance feasibility and modeling',
      'Lender matching (Major & Private)',
      'Mezzanine and equity introduction',
      'Application management and settlement'
    ],
    benefits: [
      'Optimized cost of capital',
      'Flexible funding for complex projects',
      'Faster project commencement'
    ]
  },
  {
    id: 'delivery',
    icon: <Building2 size={48} />,
    title: 'Building & Construction Management',
    subtitle: 'Quality Delivery',
    desc: 'Overseeing the physical delivery of your project through trusted construction partners and rigorous management systems.',
    for: 'Project Owners, Investors',
    process: [
      'Builder due diligence and selection',
      'Contract administration',
      'Program and milestone tracking',
      'Defect management and handover'
    ],
    benefits: [
      'Guaranteed build quality',
      'Proactive delay management',
      'Seamless transition to sale/holding'
    ]
  }
];

export default function Services() {
  return (
    <div className="bg-background">
      <SEO 
        title="Services"
        url="/services"
        description="End-to-end property advisory, acquisition, JV structuring, and delivery management tailored for the Melbourne market. Expert guidance for investors, landowners, and developers."
      />
      {/* Hero */}
      <section className="relative min-h-[calc(100vh-80px)] flex items-center px-6 lg:px-12 bg-primary text-white overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover opacity-30"
          >
            <source src="/images/construction.webm" type="video/webm" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 w-full py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8">Our <span className="text-accent">Services</span></h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-2xl leading-relaxed">
              End-to-end property advisory, acquisition, JV structuring, and delivery management tailored for the Melbourne market.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services List */}
      <div className="divide-y">
        {services.map((s, i) => (
          <section key={s.id} id={s.id} className={cn("py-32 px-6 lg:px-12", i % 2 !== 0 ? "bg-secondary/20" : "bg-background")}>
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
                <FadeInWhenVisible>
                  <div className="space-y-8">
                    <div className="text-accent">{s.icon}</div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-accent block mb-2">{s.subtitle}</span>
                      <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary">{s.title}</h2>
                    </div>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                      {s.desc}
                    </p>
                    <div className="flex items-center gap-4 text-primary font-bold">
                      <span className="text-xs uppercase tracking-widest border-r pr-4">Ideal For</span>
                      <span className="text-lg">{s.for}</span>
                    </div>
                    <Button asChild size="lg" className="rounded-none px-10 py-7 font-heading font-bold uppercase tracking-wider text-xs bg-primary text-white">
                      <Link to="/book-consultation">Book Consultation</Link>
                    </Button>
                  </div>
                </FadeInWhenVisible>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <FadeInWhenVisible delay={0.2}>
                    <div className="bg-background p-10 border shadow-sm h-full">
                      <h3 className="font-heading font-bold text-lg mb-8 uppercase tracking-widest text-primary border-b pb-4">The Process</h3>
                      <ul className="space-y-6">
                        {s.process.map((p, idx) => (
                          <li key={idx} className="flex gap-4 items-start text-sm leading-relaxed text-muted-foreground group">
                            <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-primary shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">{idx + 1}</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </FadeInWhenVisible>
                  <FadeInWhenVisible delay={0.3}>
                    <div className="bg-primary text-white p-10 shadow-xl h-full">
                      <h3 className="font-heading font-bold text-lg mb-8 uppercase tracking-widest text-accent border-b border-white/10 pb-4">Key Benefits</h3>
                      <ul className="space-y-6">
                        {s.benefits.map((b, idx) => (
                          <li key={idx} className="flex gap-4 items-start text-sm leading-relaxed text-white/80">
                            <CheckCircle2 size={20} className="text-accent shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </FadeInWhenVisible>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Final CTA */}
      <section className="py-32 px-6 lg:px-12 bg-accent text-white text-center">
        <div className="max-w-4xl mx-auto">
          <FadeInWhenVisible>
            <h2 className="text-4xl md:text-6xl font-heading font-bold mb-8">Need a Custom Strategy?</h2>
            <p className="text-xl text-white/80 mb-12">Every project is unique. Let's discuss how we can tailor our services to your specific property goals.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Button asChild size="lg" className="rounded-none px-12 py-8 text-lg font-heading font-bold uppercase tracking-wider bg-primary text-white hover:bg-primary/90">
                <Link to="/book-consultation">Request Call Back</Link>
              </Button>
              <Button asChild size="lg" className="rounded-none px-12 py-8 text-lg font-heading font-bold uppercase tracking-wider bg-white text-accent hover:bg-white/90">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>
    </div>
  );
}
