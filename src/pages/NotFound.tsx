import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';

export default function NotFound() {
  return (
    <div className="bg-background min-h-[calc(100vh-80px)] flex items-center justify-center px-6 lg:px-12">
      <SEO 
        title="Page Not Found"
        url="/404"
        description="The page you're looking for doesn't exist. Return to Ghan Projects homepage."
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl"
      >
        <div className="mb-8">
          <span className="text-[200px] font-heading font-bold text-primary/10 leading-none block">404</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-6 -mt-20">
          Page Not Found
        </h1>
        
        <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="rounded-none px-8 py-6 font-heading font-bold uppercase tracking-wider text-xs bg-primary text-white">
            <Link to="/">
              <Home size={18} className="mr-2" />
              Back to Home
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="rounded-none px-8 py-6 font-heading font-bold uppercase tracking-wider text-xs border-primary text-primary hover:bg-primary hover:text-white">
            <Link to="/portfolio">
              <Search size={18} className="mr-2" />
              View Portfolio
            </Link>
          </Button>
        </div>

        <div className="mt-16 pt-12 border-t">
          <p className="text-sm text-muted-foreground mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/services" className="text-primary hover:text-accent transition-colors font-medium">Services</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/portfolio" className="text-primary hover:text-accent transition-colors font-medium">Portfolio</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/insights" className="text-primary hover:text-accent transition-colors font-medium">Insights</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/book-consultation" className="text-primary hover:text-accent transition-colors font-medium">Contact</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
