import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEO } from '@/components/shared/SEO';

const categories = ['All', 'Townhouses', 'Subdivision', 'Residential', 'Commercial', 'Advisory'];


const projects = [
  {
    id: 1,
    title: 'Townhouse Development – Berwick',
    cat: 'Townhouses',
    loc: 'Berwick, VIC',
    outcome: '4 High-end Townhouses',
    scope: 'Acquisition, JV Structuring, PM',
    image: '/images/townhouse-berwick.webp',
  },
  {
    id: 2,
    title: 'Dual Occupancy – Glen Waverley',
    cat: 'Subdivision',
    loc: 'Glen Waverley, VIC',
    outcome: 'Premium Side-by-Side',
    scope: 'Advisory, Feasibility, Delivery',
    image: '/images/glen-waverley.webp',
  },
  {
    id: 3,
    title: 'Strategic Acquisition – Richmond',
    cat: 'Advisory',
    loc: 'Richmond, VIC',
    outcome: 'Commercial Yield +15%',
    scope: 'Buyer Agent, Strategic Analysis',
    image: '/images/commercial-richmond.webp',
  },
  {
    id: 4,
    title: 'Multi-unit Site – Ringwood',
    cat: 'Subdivision',
    loc: 'Ringwood, VIC',
    outcome: '6 Unit Subdivision',
    scope: 'Off-market Sourcing, JV',
    image: '/images/property-analysis.webp',
  },
  {
    id: 5,
    title: 'Luxury Residence – Toorak',
    cat: 'Residential',
    loc: 'Toorak, VIC',
    outcome: 'Bespoke Single Dwelling',
    scope: 'Construction Management',
    image: '/images/luxury-toorak.webp',
  },
  {
    id: 6,
    title: 'Office Refurbishment – Box Hill',
    cat: 'Commercial',
    loc: 'Box Hill, VIC',
    outcome: 'Modernized Workspace',
    scope: 'Advisory, Project Management',
    image: '/images/commercial-richmond.webp',
  },
];

export default function Projects() {
  const [activeCat, setActiveCat] = useState('All');

  const filteredProjects = activeCat === 'All' 
    ? projects 
    : projects.filter(p => p.cat === activeCat);

  return (
    <div className="bg-background">
      <SEO 
        title="Property Development Portfolio Melbourne"
        url="/projects"
        description="Explore our successful property development projects across Melbourne. Townhouse developments, subdivisions, residential and commercial property investments delivered with strategic expertise."
        image="/images/townhouse-berwick.webp"
        keywords="property development projects Melbourne, townhouse development Victoria, subdivision development, commercial property development, residential property investment, property portfolio Melbourne, Ghan Projects portfolio"
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
            poster="/images/portfolio-thumbnail.webp"
            className="w-full h-full object-cover"
          >
            <source src="/images/portfolio.webm" type="video/webm" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-primary/50" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 w-full py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8">Our <span className="text-accent">Portfolio</span></h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-2xl leading-relaxed">
              A showcase of strategic acquisitions and successfully delivered property developments across Melbourne.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-12 bg-secondary/30 px-6 lg:px-12 border-b">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={cn(
                "px-6 py-2 rounded-none text-xs font-bold uppercase tracking-widest transition-all duration-300 border",
                activeCat === cat 
                  ? "bg-primary text-white border-primary shadow-lg" 
                  : "bg-background text-primary border-transparent hover:border-accent"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="group bg-background border hover:border-accent transition-all duration-500 overflow-hidden shadow-sm hover:shadow-2xl"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img 
                      src={p.image} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={p.title}
                    />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                      <Button variant="outline" className="rounded-none border-white text-white hover:bg-white hover:text-primary font-bold uppercase tracking-widest text-[10px]">
                        View Details
                      </Button>
                    </div>
                    <div className="absolute top-6 left-6">
                      <span className="px-3 py-1 bg-accent text-white text-[10px] font-bold uppercase tracking-widest">{p.cat}</span>
                    </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <div>
                      <h3 className="text-2xl font-heading font-bold text-primary group-hover:text-accent transition-colors">{p.title}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground mt-2 text-xs font-medium">
                        <MapPin size={14} className="text-accent" />
                        {p.loc}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                      <div>
                        <span className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Outcome</span>
                        <span className="text-sm font-bold text-primary">{p.outcome}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Scope</span>
                        <span className="text-sm font-bold text-primary">{p.scope}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredProjects.length === 0 && (
            <div className="py-20 text-center text-muted-foreground italic">
              No projects found in this category.
            </div>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 px-6 lg:px-12 bg-primary text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-heading font-bold mb-8">Discuss a Similar Project?</h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">Our portfolio is a testament to our disciplined approach and commitment to excellence. Let's explore how we can deliver results for your next project.</p>
          <Button asChild size="lg" className="rounded-none px-12 py-8 text-lg font-heading font-bold uppercase tracking-wider bg-accent text-white hover:bg-accent/90">
            <Link to="/book-consultation">Consult a Specialist</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
