import { useParams, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle2, ExternalLink, Calculator, Bot, Layers } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { getResourceBySlug, freeResources } from '@/data/resources';
import { RentalYieldCalculator, StampDutyCalculator, SubdivisionChecker } from '@/components/calculators';

const getResourceIcon = (id: string) => {
  switch (id) {
    case 'ai-assistant':
      return Bot;
    case 'rental-yield-calculator':
    case 'stamp-duty-calculator':
      return Calculator;
    case 'subdivision-checker':
      return Layers;
    default:
      return Calculator;
  }
};

const CalculatorComponent = ({ resourceId }: { resourceId: string }) => {
  switch (resourceId) {
    case 'rental-yield-calculator':
      return <RentalYieldCalculator />;
    case 'stamp-duty-calculator':
      return <StampDutyCalculator />;
    case 'subdivision-checker':
      return <SubdivisionChecker />;
    default:
      return null;
  }
};

export default function ResourcePage() {
  const { slug } = useParams({ from: '/resources/$slug' });
  const resource = getResourceBySlug(slug);

  if (!resource || resource.type === 'PDF') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-heading font-bold text-primary">Resource Not Found</h1>
        <p className="text-muted-foreground">The resource you're looking for doesn't exist or is a downloadable file.</p>
        <Button asChild>
          <Link to="/resources">Back to Resources</Link>
        </Button>
      </div>
    );
  }

  const Icon = getResourceIcon(resource.id);
  const otherFreeResources = freeResources.filter(r => r.id !== resource.id && r.type !== 'PDF');
  const hasCalculator = ['rental-yield-calculator', 'stamp-duty-calculator', 'subdivision-checker'].includes(resource.id);

  return (
    <div className="bg-background">
      <SEO 
        title={resource.seoTitle}
        url={`/resources/${resource.slug}`}
        description={resource.seoDescription}
        keywords={resource.seoKeywords}
      />
      
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 px-6 lg:px-12 bg-primary text-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link 
            to="/resources" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors mb-6"
          >
            <ChevronLeft size={16} /> Back to Resources
          </Link>
          
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:w-2/3"
            >
              <span className="text-[10px] uppercase tracking-widest font-bold text-accent mb-3 block">{resource.cat}</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-4">{resource.title}</h1>
              <p className="text-lg text-white/70 leading-relaxed">
                {resource.desc}
              </p>
              
              {resource.isExternal && resource.url && (
                <Button 
                  asChild
                  className="mt-6 rounded-none bg-accent hover:bg-accent/90 text-white py-5 px-8 font-heading font-bold uppercase tracking-wider h-auto gap-2"
                >
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    Launch Tool <ExternalLink size={18} />
                  </a>
                </Button>
              )}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block lg:w-1/3"
            >
              <div className="w-28 h-28 bg-white/10 rounded-sm flex items-center justify-center text-accent">
                <Icon size={56} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      {hasCalculator && (
        <section className="py-12 lg:py-16 px-6 lg:px-12 bg-secondary/20">
          <div className="max-w-4xl mx-auto">
            <CalculatorComponent resourceId={resource.id} />
          </div>
        </section>
      )}

      {/* Description Section - Only show for AI Assistant */}
      {resource.id === 'ai-assistant' && (
        <section className="py-20 px-6 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-heading font-bold text-primary mb-8">About This Tool</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
                {resource.fullDescription.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="mb-6">{paragraph}</p>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Features Section - Only show for AI Assistant */}
      {resource.id === 'ai-assistant' && resource.features && resource.features.length > 0 && (
        <section className="py-20 px-6 lg:px-12 bg-secondary/30">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-heading font-bold text-primary mb-10">Key Features</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {resource.features.map((feature, i) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="flex items-center gap-4 bg-background p-5 border border-transparent hover:border-accent transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="font-medium text-primary">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Subtle CTA Section */}
      <section className="py-16 px-6 lg:px-12 border-t">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-center justify-between gap-8 bg-primary/5 p-8 border border-primary/10"
          >
            <div>
              <h3 className="text-xl font-heading font-bold text-primary mb-2">Need personalized advice?</h3>
              <p className="text-muted-foreground">Our team can help you apply these insights to your specific situation.</p>
            </div>
            <Button asChild className="rounded-none bg-primary hover:bg-primary/90 whitespace-nowrap">
              <Link to="/book-consultation">Book a Free Consultation</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Other Free Resources */}
      {otherFreeResources.length > 0 && (
        <section className="py-20 px-6 lg:px-12 bg-secondary/20">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-heading font-bold text-primary mb-10">More Free Tools</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherFreeResources.map((res, i) => {
                const ResIcon = getResourceIcon(res.id);
                return (
                  <motion.div
                    key={res.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Link
                      to="/resources/$slug"
                      params={{ slug: res.slug }}
                      className="group block bg-background p-8 border border-transparent hover:border-accent transition-all duration-500 shadow-sm hover:shadow-xl h-full"
                    >
                      <div className="w-14 h-14 bg-primary/5 rounded-sm flex items-center justify-center text-primary mb-6 group-hover:bg-accent group-hover:text-white transition-colors duration-500">
                        <ResIcon size={28} />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-accent mb-2 block">{res.cat}</span>
                      <h3 className="text-xl font-heading font-bold text-primary group-hover:text-accent transition-colors mb-3">{res.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{res.desc}</p>
                      <span className="text-primary group-hover:text-accent font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        Learn More <ChevronRight size={14} />
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
