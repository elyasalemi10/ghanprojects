import React from 'react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { Linkedin, Instagram, Mail, Phone, MapPin, Clock } from 'lucide-react';

const LOGO_URL = "/images/ghan-projects-logo-blue.webp";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white pt-20 pb-10 px-6 lg:px-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Company */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src={LOGO_URL} 
                alt="Ghan Projects" 
                className="h-14 md:h-16 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-white/60 text-sm max-w-xs leading-relaxed">
              Strategic property development and investment advisory. We help investors identify and deliver high-value projects across Melbourne.
            </p>
            <nav className="flex flex-col gap-3 pt-4">
              <Link to="/" className="text-white/70 hover:text-accent transition-colors text-sm">Home</Link>
              <Link to="/about" className="text-white/70 hover:text-accent transition-colors text-sm">About</Link>
              <Link to="/services" className="text-white/70 hover:text-accent transition-colors text-sm">Services</Link>
              <Link to="/portfolio" className="text-white/70 hover:text-accent transition-colors text-sm">Portfolio</Link>
            </nav>
          </div>

          {/* Column 2: Learn */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-8 uppercase tracking-widest text-accent">Learn</h3>
            <nav className="flex flex-col gap-4">
              <Link to="/insights" className="text-white/70 hover:text-accent transition-colors text-sm">Insights & Articles</Link>
              <Link to="/resources" className="text-white/70 hover:text-accent transition-colors text-sm">Resources</Link>
              <Link to="/book-consultation" className="text-white/70 hover:text-accent transition-colors text-sm">Investment Strategy</Link>
              <Link to="/portfolio" className="text-white/70 hover:text-accent transition-colors text-sm">Market Analysis</Link>
            </nav>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-8 uppercase tracking-widest text-accent">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white/70 hover:text-accent transition-colors">
                <Phone size={18} className="mt-0.5 text-accent" />
                <a href="tel:+61390017797" className="text-sm">03 9001 7797</a>
              </li>
              <li className="flex items-start gap-3 text-white/70 hover:text-accent transition-colors">
                <Mail size={18} className="mt-0.5 text-accent" />
                <a href="mailto:info@ghanprojects.com.au" className="text-sm">info@ghanprojects.com.au</a>
              </li>
              <li className="flex items-start gap-3 text-white/70">
                <MapPin size={18} className="mt-0.5 text-accent" />
                <span className="text-sm">Level 19, 263 William St, Melbourne 3000</span>
              </li>
              <li className="flex items-start gap-3 text-white/70">
                <Clock size={18} className="mt-0.5 text-accent" />
                <span className="text-sm">Mon–Fri: 9AM–5PM | Weekends: By Appointment</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Social */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-8 uppercase tracking-widest text-accent">Connect</h3>
            <div className="flex gap-4 mb-8">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent transition-all duration-300">
                <Linkedin size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent transition-all duration-300">
                <Instagram size={20} />
              </a>
            </div>
            <p className="text-xs text-white/40 leading-relaxed italic">
              "Building wealth through strategic property development and disciplined acquisition."
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-white/40 text-xs flex flex-col gap-1 text-center md:text-left">
            <p>© {currentYear} GHAN PROJECTS. All rights reserved.</p>
            <p className="uppercase tracking-widest font-medium text-[10px]">General information only. Not financial advice.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
