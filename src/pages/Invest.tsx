import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, TrendingUp, ShieldCheck, Target, ChevronRight } from 'lucide-react';
import { FadeInWhenVisible } from '@/components/shared/FadeInWhenVisible';
import { SEO } from '@/components/shared/SEO';

const opportunities = [
  {
    title: 'Residential Home – Beaumaris',
    bullets: ['Premium Coastal Location', 'Established Neighbourhood', 'High Growth Area'],
    status: 'High Demand',
    description:
      'A premium residential opportunity in one of Melbourne\'s most sought-after coastal suburbs. Strong long-term capital growth fundamentals backed by tightly held demand.',
  },
  {
    title: 'Child Care – Wood St',
    bullets: ['Strategic Location', 'High Yield Potential', 'Long-term Investment'],
    status: 'Strategic',
    description:
      'A strategically located commercial childcare site offering reliable yield characteristics and long lease covenants — ideal for stable, income-focused capital.',
  },
  {
    title: '6 Townhouses – Narre Warren',
    bullets: ['Development Approved', 'Multi-dwelling Site', 'Strong Rental Demand'],
    status: 'Investor Ready',
    description:
      'Permit-approved 6-townhouse development in one of Melbourne\'s fastest-growing south-eastern corridors, with strong end-buyer and rental demand.',
  },
];

const investmentBenefits = [
  {
    icon: <TrendingUp size={28} />,
    title: 'Curated Opportunities',
    desc: 'Off-market and strategic deals sourced through our network — pre-vetted for fundamentals, feasibility and risk.',
  },
  {
    icon: <ShieldCheck size={28} />,
    title: 'Rigorous Due Diligence',
    desc: 'Each opportunity is supported by detailed feasibility, planning analysis and a transparent capital structure.',
  },
  {
    icon: <Target size={28} />,
    title: 'Aligned Outcomes',
    desc: 'Joint venture and co-investment models structured so our success is directly tied to delivering yours.',
  },
];

export default function Invest() {
  const navigate = useNavigate();

  const handleRequestPack = (title: string) => {
    navigate({
      to: '/book-consultation',
      search: { message: `I am interested in an investment pack opportunity for ${title}` },
    });
  };

  return (
    <div className="bg-background">
      <SEO
        title="Property Investment Opportunities Melbourne"
        url="/invest"
        description="Explore current Melbourne property investment opportunities with Ghan Projects. Off-market deals, joint ventures, and strategic developments — request an investment pack today."
        keywords="property investment Melbourne, off-market property investment, joint venture property Melbourne, investment opportunities Melbourne, development investment Victoria"
      />

      {/* Hero */}
      <section className="relative py-32 lg:py-48 px-6 lg:px-12 bg-primary text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-about.webp"
            className="w-full h-full object-cover opacity-20"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-4 py-1 bg-accent/20 border border-accent/30 text-accent text-[10px] font-bold uppercase tracking-widest mb-8">
              Invest With Ghan Projects
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8">
              Strategic Property<br />
              <span className="text-accent">Investment Opportunities</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-2xl leading-relaxed">
              Curated, off-market and pre-vetted Melbourne property opportunities — available exclusively through our investor network.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Invest */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <FadeInWhenVisible>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-6">Why Invest With Us</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We give qualified investors access to opportunities that are typically reserved for our existing network.
              </p>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {investmentBenefits.map((b, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.1}>
                <div className="bg-background border p-10 h-full hover:border-accent transition-colors">
                  <div className="w-14 h-14 bg-primary/5 text-primary flex items-center justify-center mb-6">
                    {b.icon}
                  </div>
                  <h3 className="text-xl font-heading font-bold text-primary mb-3">{b.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{b.desc}</p>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* Current Opportunities */}
      <section className="py-24 bg-primary text-white px-6 lg:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/5 -skew-x-12 transform translate-x-1/2" />
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeInWhenVisible>
            <div className="mb-16 text-center">
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-white">
                Current Investment Packs
              </h2>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Request a detailed investment pack for any of our current off-market or strategic property opportunities.
              </p>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {opportunities.map((opp, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.1}>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-10 hover:bg-white/10 transition-all duration-500 group h-full flex flex-col">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-accent mb-4 px-2 py-1 bg-accent/10 inline-block self-start">
                    {opp.status}
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-4 text-white group-hover:text-accent transition-colors">
                    {opp.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">{opp.description}</p>
                  <ul className="space-y-3 mb-10">
                    {opp.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-white/70 text-sm">
                        <CheckCircle2 size={16} className="text-accent shrink-0" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleRequestPack(opp.title)}
                    className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider text-xs mt-auto"
                  >
                    Request Investment Pack
                  </Button>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>

          <p className="text-center text-white/40 text-sm italic mt-12">
            Opportunities change frequently. Contact us for the latest availability.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 lg:px-12 bg-primary text-white text-center">
        <div className="max-w-4xl mx-auto">
          <FadeInWhenVisible>
            <h2 className="text-4xl font-heading font-bold mb-6">
              Ready to Join Our Investor Network?
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Get early access to off-market opportunities and strategic property investments across Melbourne.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="rounded-none px-12 py-8 text-lg font-heading font-bold uppercase tracking-wider bg-accent text-white hover:bg-accent/90"
              >
                <Link to="/book-consultation">Speak With An Advisor</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-none px-12 py-8 text-lg font-heading font-bold uppercase tracking-wider border-white text-primary hover:bg-white hover:text-primary"
              >
                <Link to="/portfolio">
                  View Our Portfolio <ChevronRight size={18} className="ml-2" />
                </Link>
              </Button>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>
    </div>
  );
}
