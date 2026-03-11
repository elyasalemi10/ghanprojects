import React from 'react';
import { Link } from '@tanstack/react-router';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const LOGO_URL = "/images/ghan-projects-logo-blue.webp";

const suburbs = [
  'Beaumaris', 'South Yarra', 'Armadale', 'Malvern', 'Hawthorn',
  'Canterbury', 'Middle Park', 'Albert Park', 'East Melbourne',
  'South Melbourne', 'Camberwell', 'Brighton', 'Prahran', 'Deepdene',
  'Glen Waverley', 'Toorak', 'Kew', 'Richmond'
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white pt-16 pb-8 px-6 lg:px-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Column 1: Company */}
          <div className="space-y-5">
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src={LOGO_URL} 
                alt="Ghan Projects" 
                className="h-12 md:h-14 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-white/60 text-sm max-w-xs leading-relaxed">
              Strategic property development and investment advisory across Melbourne.
            </p>
            <nav className="flex flex-col gap-2 pt-2">
              <Link to="/" className="text-white/70 hover:text-accent transition-colors text-sm">Home</Link>
              <Link to="/about" className="text-white/70 hover:text-accent transition-colors text-sm">About</Link>
              <Link to="/services" className="text-white/70 hover:text-accent transition-colors text-sm">Services</Link>
              <Link to="/portfolio" className="text-white/70 hover:text-accent transition-colors text-sm">Portfolio</Link>
            </nav>
          </div>

          {/* Column 2: Learn */}
          <div>
            <h3 className="font-heading font-bold text-sm mb-6 uppercase tracking-widest text-accent">Learn</h3>
            <nav className="flex flex-col gap-3">
              <Link to="/insights" className="text-white/70 hover:text-accent transition-colors text-sm">Insights & Articles</Link>
              <Link to="/resources" className="text-white/70 hover:text-accent transition-colors text-sm">Resources & Tools</Link>
              <Link to="/book-consultation" className="text-white/70 hover:text-accent transition-colors text-sm">Book Consultation</Link>
              <Link to="/book-consultation?type=showroom-booking" className="text-white/70 hover:text-accent transition-colors text-sm">Book Showroom Visit</Link>
            </nav>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="font-heading font-bold text-sm mb-6 uppercase tracking-widest text-accent">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-white/70 hover:text-accent transition-colors">
                <Phone size={16} className="mt-0.5 text-accent shrink-0" />
                <a href="tel:+61390017797" className="text-sm">03 9001 7797</a>
              </li>
              <li className="flex items-start gap-3 text-white/70 hover:text-accent transition-colors">
                <Mail size={16} className="mt-0.5 text-accent shrink-0" />
                <a href="mailto:info@ghanprojects.com.au" className="text-sm">info@ghanprojects.com.au</a>
              </li>
              <li className="flex items-start gap-3 text-white/70">
                <MapPin size={16} className="mt-0.5 text-accent shrink-0" />
                <span className="text-sm">Level 19, 263 William St<br />Melbourne 3000</span>
              </li>
              <li className="flex items-start gap-3 text-white/70">
                <Clock size={16} className="mt-0.5 text-accent shrink-0" />
                <span className="text-sm">Mon–Fri: 9AM–5PM</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Areas We Service */}
          <div>
            <h3 className="font-heading font-bold text-sm mb-6 uppercase tracking-widest text-accent">Areas We Service</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {suburbs.map((suburb, i) => (
                <span key={suburb} className="text-xs text-white/50 hover:text-white/70 transition-colors">
                  {suburb}{i < suburbs.length - 1 ? ',' : ''}
                </span>
              ))}
              <span className="text-xs text-accent">+ South East Melbourne</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-white/40 text-xs flex flex-col gap-1 text-center md:text-left">
            <p>© {currentYear} GHAN PROJECTS. All rights reserved.</p>
            <p className="uppercase tracking-widest font-medium text-[10px]">General information only. Not financial advice.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
