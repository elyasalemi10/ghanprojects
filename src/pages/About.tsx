import React from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Scale, Shield, Briefcase, TrendingUp, Target, Eye } from 'lucide-react';
import { FadeInWhenVisible } from '@/components/shared/FadeInWhenVisible';
import { SEO } from '@/components/shared/SEO';

const FOUNDER_IMG = "/images/founder-portrait.avif";

export default function About() {
  return (
    <div className="bg-background">
      <SEO 
        title="About Ghan Projects - Property Development Experts"
        url="/about"
        description="Learn about Ghan Projects - Melbourne's trusted property development and investment consulting firm. Our mission, values, and expert approach to delivering exceptional property outcomes."
        image="/images/founder-portrait.avif"
        keywords="about Ghan Projects, Ghan Property Group, Melbourne property developers, property consulting firm Melbourne, property investment experts Victoria"
      />
      {/* Hero */}
      <section className="relative py-32 lg:py-48 px-6 lg:px-12 bg-primary text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-about.avif"
            className="w-full h-full object-cover opacity-20"
            alt=""
          />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-4 py-1 bg-accent/20 border border-accent/30 text-accent text-[10px] font-bold uppercase tracking-widest mb-8">
              About Ghan Projects
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8">
              Built on Experience,<br />
              <span className="text-accent">Driven by Excellence</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-2xl leading-relaxed">
              From second-generation construction heritage to industry-leading property development expertise, Ghan Projects transforms your property aspirations into profitable realities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Founder's Journey */}
      <section className="py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <FadeInWhenVisible>
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-1 bg-accent" />
                <div className="inline-block px-4 py-1 bg-secondary text-primary text-[10px] font-bold uppercase tracking-widest">The Founder's Journey</div>
              </div>
              <h2 className="text-4xl font-heading font-bold text-primary leading-tight">A Vision Forged in Experience</h2>
              <div className="space-y-6 text-muted-foreground leading-relaxed text-lg">
                <p>
                  Baqir Rezaie established Ghan Projects in 2013 with a clear vision: to elevate the construction and property development industry through unparalleled subcontracting and strategic client partnerships. As a second-generation professional in the construction field, Baqir didn't just inherit knowledge; he meticulously built upon it.
                </p>
                <p>
                  This rigorous journey was driven by a deep understanding of the challenges and common pitfalls in property. Baqir's personal experiences, including navigating complex issues and learning from mistakes, now form the bedrock of Ghan Projects' client-centric approach.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t">
                <div className="space-y-2">
                  <div className="text-3xl font-heading font-bold text-accent">$100M+</div>
                  <p className="text-sm text-muted-foreground">Projects Successfully Managed</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-heading font-bold text-accent">2nd Gen</div>
                  <p className="text-sm text-muted-foreground">Construction Heritage</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-heading font-bold text-accent">2013</div>
                  <p className="text-sm text-muted-foreground">Established in Melbourne</p>
                </div>
              </div>
            </div>
          </FadeInWhenVisible>
          <FadeInWhenVisible delay={0.2}>
            <div className="relative">
              <img
                src={FOUNDER_IMG}
                className="w-full aspect-[3/4] object-cover grayscale"
                alt="Baqir Rezaie - Founder"
              />
              <div className="absolute -bottom-8 -left-8 w-2/3 h-2/3 bg-accent/10 -z-10" />
              <div className="absolute top-8 right-8 bg-primary text-white px-6 py-4">
                <span className="text-xs font-bold uppercase tracking-widest">Founder & Director</span>
              </div>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* Our Network */}
      <section className="py-32 bg-primary text-white px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <FadeInWhenVisible>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">Our Network, <span className="text-accent">Your Advantage</span></h2>
              <p className="text-xl text-white/60 max-w-2xl mx-auto">Strategic partnerships with industry leaders ensure your project success.</p>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              {
                title: 'Leading Legal Counsel',
                desc: 'Working with top-tier lawyers such as Tom Cantwell from Mills Oakley and David Grant from Colin Biggers & Paisley (recognised in The Best Lawyers in Australia 2023–2026), ensures your projects are legally sound and protected.',
                icon: <Scale size={32} />,
              },
              {
                title: 'Premier Builders',
                desc: 'Our collaboration with Ghan Homes (luxury custom residential) and Masci Group (experienced commercial builder for childcare, schools, medical centres, and warehouses) provides unparalleled construction excellence.',
                icon: <Shield size={32} />,
              },
              {
                title: 'Specialised Financial Advisors',
                desc: 'Experts who understand the nuances of property finance and market dynamics to optimise your buying and selling strategies.',
                icon: <TrendingUp size={32} />,
              },
              {
                title: 'Dedicated Accountants',
                desc: 'Ensuring optimal financial structuring and tax efficiency for your investments.',
                icon: <Briefcase size={32} />,
              },
            ].map((item, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.1}>
                <div className="flex gap-8 group p-8 border border-white/10 hover:border-accent/30 transition-colors">
                  <div className="text-accent shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-heading font-bold">{item.title}</h3>
                    <p className="text-white/60 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-32 px-6 lg:px-12 bg-secondary/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          <FadeInWhenVisible>
            <div className="bg-background p-12 border space-y-6 h-full">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center">
                <Target size={32} className="text-primary" />
              </div>
              <h3 className="text-3xl font-heading font-bold text-primary">Our Mission</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To empower individuals and investors to achieve their financial goals faster by minimising mistakes and maximising profit through data-driven decisions, strategic guidance, and seamless project execution.
              </p>
            </div>
          </FadeInWhenVisible>
          <FadeInWhenVisible delay={0.15}>
            <div className="bg-background p-12 border space-y-6 h-full">
              <div className="w-16 h-16 bg-accent/10 flex items-center justify-center">
                <Eye size={32} className="text-accent" />
              </div>
              <h3 className="text-3xl font-heading font-bold text-primary">Our Vision</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To be the trusted partner that provides a stress-free and highly profitable property development and wealth generation journey for every client.
              </p>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* The Ghan Projects Approach */}
      <section className="py-32 px-6 lg:px-12 bg-background">
        <div className="max-w-7xl mx-auto">
          <FadeInWhenVisible>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-6">The Ghan Projects Approach</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Our methodology is built on four pillars of property success.</p>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { title: 'Market Intelligence', desc: 'Leveraging real-time data and off-market networks to source superior sites.' },
              { title: 'Rigorous Feasibility', desc: 'No-nonsense financial modeling that accounts for every variable and risk.' },
              { title: 'Strategic Partnerships', desc: "Aligning with Melbourne's elite consultants, builders, and finance providers." },
              { title: 'Delivery Focus', desc: 'A relentless drive to meet milestones, maintain quality, and maximize exit value.' }
            ].map((p, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.1}>
                <div className="space-y-6 group border p-8 hover:border-accent transition-colors">
                  <div className="text-accent text-4xl font-heading font-bold opacity-30 group-hover:opacity-100 transition-opacity">0{i + 1}</div>
                  <h3 className="text-xl font-heading font-bold text-primary border-b pb-4">{p.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 lg:px-12 bg-accent text-white text-center">
        <div className="max-w-4xl mx-auto">
          <FadeInWhenVisible>
            <h2 className="text-4xl font-heading font-bold mb-6">Ready to Accelerate Your Property Journey?</h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect with Ghan Projects today to discuss your unique goals. Let our expertise guide you to smarter decisions and greater success.
            </p>
            <Button asChild size="lg" className="rounded-none px-12 py-8 text-lg font-heading font-bold uppercase tracking-wider bg-primary text-white hover:bg-primary/90">
              <Link to="/book-consultation">Schedule Your Consultation</Link>
            </Button>
          </FadeInWhenVisible>
        </div>
      </section>
    </div>
  );
}
