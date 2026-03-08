import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle2, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEO } from '@/components/shared/SEO';

const opportunities = [
  {
    title: 'Residential Home – Beaumaris',
    bullets: ['Premium Coastal Location', 'Established Neighbourhood', 'High Growth Area'],
    status: 'High Demand',
  },
  {
    title: 'Child Care – Wood St',
    bullets: ['Strategic Location', 'High Yield Potential', 'Long-term Investment'],
    status: 'Strategic',
  },
  {
    title: '6 Townhouses – Narre Warren',
    bullets: ['Development Approved', 'Multi-dwelling Site', 'Strong Rental Demand'],
    status: 'Investor Ready',
  },
];

const portfolioProjects = [
  {
    id: 1,
    title: 'Duplex',
    tags: ['Duplex', 'Residential'],
    suburb: 'Beaumaris',
    value: '',
    caption: 'Premium coastal duplex delivered',
    folder: 'duplex',
    images: ['pool.webp', 'main.webp', 'kitchen.webp', 'bathroom.webp', 'bathroom-2.webp', 'bathroom-3.webp', 'upstairs-living.webp'],
  },
  {
    id: 2,
    title: '3 Luxury Townhouses',
    tags: ['Townhouse', 'Luxury', 'Residential'],
    suburb: '',
    value: '',
    caption: 'Boutique luxury townhouse development',
    folder: '3-luxury-townhouses-2',
    images: ['main.webp', 'main-side.webp', 'aerial.webp', 'kitchen.webp', 'living-room.webp', 'living-room-2.webp', 'bedroom.webp', 'bathroom.webp', 'rooftop.webp', 'stairs.webp'],
  },
  {
    id: 3,
    title: '7 Luxury Townhouses',
    tags: ['Townhouse', 'Luxury', 'Residential'],
    suburb: 'Mordialloc',
    value: '',
    caption: '7 high-end townhouses delivered',
    folder: '7-luxury-townhouses',
    images: ['main.webp', 'main-side.webp', 'living room.webp', 'dining.webp', 'kitchen.webp', 'bedroom.webp', 'bedroom-2.webp', 'bathroom.webp', 'study.webp', 'cinema.webp', 'balcony.webp', 'pergola.webp', 'hallway.webp', 'stairs.webp', 'stairs-2.webp'],
  },
  {
    id: 4,
    title: 'Duplex',
    tags: ['Duplex', 'Residential'],
    suburb: 'Mordialloc',
    value: '',
    caption: 'High-quality dual-occupancy project',
    folder: 'duplex-2',
    images: ['main.webp', 'main-2.webp', 'kitchen.webp', 'living-room.webp', 'dining.webp', 'bedroom.webp', 'bedroom-2.webp', 'bathroom.webp', 'backyard.webp'],
  },
  {
    id: 5,
    title: 'Duplex',
    tags: ['Duplex', 'Residential'],
    suburb: 'Bentleigh',
    value: '',
    caption: 'Premium side-by-side duplex build',
    folder: 'duplex-3',
    images: ['main.webp', 'kitchen.webp', 'dining.webp', 'pantry.webp', 'pergola.webp', 'stairs.webp'],
  },
  {
    id: 6,
    title: '4 Bedroom Home',
    tags: ['Residential', 'House'],
    suburb: 'Berwick',
    value: '',
    caption: 'Strategic renovation successfully increasing sale value',
    folder: '4-bedroom-house',
    images: ['main.webp', 'pool.webp', 'dining.webp', 'bedroom.webp', 'bathroom.webp', 'backyard.webp', 'side-view.webp'],
  },
  {
    id: 7,
    title: '4 Luxury Townhouses',
    tags: ['Townhouse', 'Luxury', 'Residential'],
    suburb: 'Berwick',
    value: '',
    caption: '4 luxury townhouses successfully delivered',
    folder: '4-luxury-townhouses',
    images: ['main.webp', 'main-side.webp', 'kitchen.webp', 'kitchen-2.webp', 'living-room.webp', 'living-room-2.webp', 'dining.webp', 'bedroom.webp', 'bedroom-2.webp', 'bedroom-3.webp', 'bathroom.webp', 'bathroom-2.webp', 'closet.webp', 'balcony.webp', 'pergola.webp'],
  },
  {
    id: 8,
    title: '3 Luxury Townhouses',
    tags: ['Townhouse', 'Luxury', 'Residential'],
    suburb: 'Narre Warren',
    value: '',
    caption: 'Boutique triple-townhouse development',
    folder: '3-luxury-townhouses',
    images: ['main.webp', 'street-view.webp', 'kitchen.webp', 'kitchen-2.webp', 'living.webp', 'living-2.webp', 'bedroom.webp', 'bathroom.webp', 'bathroom-2.webp', 'study.webp', 'pergola.webp'],
  },
];

const categories = ['All', 'Townhouse', 'Duplex', 'House', 'Luxury', 'Residential'];

function ImageLightbox({ 
  images, 
  folder, 
  title, 
  initialIndex, 
  onClose 
}: { 
  images: string[], 
  folder: string, 
  title: string, 
  initialIndex: number, 
  onClose: () => void 
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrentIndex((prev) => (prev + 1) % images.length);
      if (e.key === 'ArrowLeft') setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [images.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-50"
      >
        <X size={24} />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + images.length) % images.length); }}
        className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-50"
      >
        <ChevronLeft size={28} />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % images.length); }}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-50"
      >
        <ChevronRight size={28} />
      </button>

      <div className="max-w-6xl max-h-[85vh] mx-4" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={`/portfolio/${folder}/${images[currentIndex]}`}
            alt={`${title} - Image ${currentIndex + 1}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
          />
        </AnimatePresence>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <span className="text-white/60 text-sm font-medium">{title}</span>
        <span className="text-white/40">|</span>
        <span className="text-white font-bold">{currentIndex + 1} / {images.length}</span>
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto py-2 px-4">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
            className={cn(
              "w-16 h-16 rounded overflow-hidden shrink-0 border-2 transition-all",
              idx === currentIndex ? "border-white" : "border-transparent opacity-50 hover:opacity-80"
            )}
          >
            <img
              src={`/portfolio/${folder}/${img}`}
              alt=""
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ImageGallery({ 
  images, 
  folder, 
  title,
  onOpenLightbox 
}: { 
  images: string[], 
  folder: string, 
  title: string,
  onOpenLightbox: (index: number) => void 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative aspect-[4/5] overflow-hidden group/gallery">
      <img
        src={`/portfolio/${folder}/${images[currentIndex]}`}
        alt={`${title} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />
      
      <button
        onClick={(e) => { e.stopPropagation(); onOpenLightbox(currentIndex); }}
        className="absolute top-4 left-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-primary opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 shadow-lg z-10"
      >
        <ZoomIn size={18} />
      </button>
      
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-primary opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 shadow-lg z-10"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-primary opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 shadow-lg z-10"
          >
            <ChevronRight size={20} />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentIndex ? "bg-white w-4" : "bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
          
          <div className="absolute top-4 right-4 px-2 py-1 bg-black/50 text-white text-xs font-medium rounded z-10">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}

export default function Portfolio() {
  const [activeCat, setActiveCat] = useState('All');
  const [lightbox, setLightbox] = useState<{ projectId: number, imageIndex: number } | null>(null);
  const navigate = useNavigate();

  const filteredProjects = activeCat === 'All' 
    ? portfolioProjects 
    : portfolioProjects.filter(p => p.tags.some(tag => tag.toLowerCase() === activeCat.toLowerCase()));

  const lightboxProject = lightbox ? portfolioProjects.find(p => p.id === lightbox.projectId) : null;

  useEffect(() => {
    const allImages: string[] = [];
    portfolioProjects.forEach(project => {
      project.images.forEach(img => {
        allImages.push(`/portfolio/${project.folder}/${img}`);
      });
    });
    
    allImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <div className="bg-background">
      <SEO 
        title="Property Development Portfolio Melbourne"
        url="/portfolio"
        description="Explore our successful property development projects across Melbourne. Townhouse developments, subdivisions, residential and commercial property investments delivered with strategic expertise."
        image="/images/townhouse-berwick.webp"
        keywords="property development projects Melbourne, townhouse development Victoria, subdivision development, commercial property development, residential property investment, property portfolio Melbourne, Ghan Projects portfolio"
      />
      
      <AnimatePresence>
        {lightbox && lightboxProject && (
          <ImageLightbox
            images={lightboxProject.images}
            folder={lightboxProject.folder}
            title={lightboxProject.title}
            initialIndex={lightbox.imageIndex}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative min-h-[calc(100vh-80px)] flex items-center px-6 lg:px-12 bg-primary text-white overflow-hidden">
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

      {/* Current Opportunities */}
      <section className="py-24 bg-primary text-white px-6 lg:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/5 -skew-x-12 transform translate-x-1/2" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-white">Current Property Opportunities</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">Request an information pack for select off-market and strategic opportunities currently in our pipeline.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {opportunities.map((opp, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-10 hover:bg-white/10 transition-all duration-500 group"
              >
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
              </motion.div>
            ))}
          </div>
          <p className="text-center text-white/40 text-sm italic">Opportunities change frequently. Contact us for the latest availability.</p>
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

      {/* Portfolio Grid */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="group bg-background border hover:border-accent transition-all duration-500 overflow-hidden shadow-sm hover:shadow-2xl"
              >
                <ImageGallery 
                  images={project.images} 
                  folder={project.folder} 
                  title={project.title}
                  onOpenLightbox={(index) => setLightbox({ projectId: project.id, imageIndex: index })}
                />
                
                <div className="p-8 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest">{tag}</span>
                    ))}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-heading font-bold text-primary group-hover:text-accent transition-colors">{project.title}</h3>
                    {project.suburb && (
                      <div className="flex items-center gap-2 text-muted-foreground mt-2 text-xs font-medium">
                        <MapPin size={14} className="text-accent" />
                        {project.suburb}, VIC
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground italic">{project.caption}</p>
                  
                  {project.value && (
                    <div className="pt-4 border-t">
                      <span className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Project Value</span>
                      <span className="text-lg font-bold text-primary">{project.value}</span>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => setLightbox({ projectId: project.id, imageIndex: 0 })}
                      className="p-0 h-auto hover:bg-transparent text-primary hover:text-accent font-bold uppercase tracking-widest text-xs gap-2"
                    >
                      <ZoomIn size={14} /> View Gallery
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

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
