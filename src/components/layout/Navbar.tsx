import React, { useState, useEffect } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Portfolio', path: '/portfolio' },
  { name: 'Insights', path: '/insights' },
  { name: 'Resources', path: '/resources' },
  { name: 'Contact', path: '/contact' },
];

const LOGO_URL = "/images/ghan-projects-logo-blue.webp";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 lg:px-12 h-20',
        isScrolled || isMobileMenuOpen || !isHome
          ? 'bg-background/95 backdrop-blur-md border-b shadow-sm' 
          : 'bg-white/95 backdrop-blur-sm'
      )}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img 
            src={LOGO_URL} 
            alt="Ghan Projects" 
            className="h-12 md:h-14 w-auto object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "font-medium text-sm transition-colors hover:text-accent text-primary/80",
                location.pathname === link.path && "text-primary font-bold"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:block">
          <Button 
            asChild
            className="rounded-none px-6 font-heading font-bold uppercase tracking-wider text-xs bg-primary text-white hover:bg-primary/90"
          >
            <Link to="/book-consultation">Book Consultation</Link>
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden p-2 transition-colors text-primary"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-20 left-0 right-0 bg-background border-b shadow-lg lg:hidden overflow-hidden"
          >
            <nav className="flex flex-col py-6 px-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "py-3 text-lg font-heading font-medium text-primary border-b border-border/50 last:border-0",
                    location.pathname === link.path && "text-accent font-bold"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <Button 
                asChild
                className="mt-6 w-full rounded-none py-6 font-heading font-bold uppercase tracking-wider bg-primary"
              >
                <Link to="/book-consultation">Book Consultation</Link>
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
