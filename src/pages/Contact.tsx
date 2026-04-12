import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '@/components/shared/SEO';

const LOGO_URL = "/images/pdcon-logo.webp";
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageValue, setMessageValue] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const search = useSearch({ strict: false }) as { message?: string };
  
  useEffect(() => {
    if (search.message) {
      setMessageValue(search.message);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [search.message]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    
    if (!email?.trim() && !phone?.trim()) {
      toast.error('Please provide either an email address or phone number.');
      return;
    }
    
    setIsSubmitting(true);
    
    const data = {
      name: formData.get('name'),
      email,
      phone,
      projectType: formData.get('projectType'),
      budget: formData.get('budget'),
      message: formData.get('message')
    };
    
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        toast.success('Message sent successfully. We will be in touch shortly.');
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background">
      <SEO 
        title="Contact Property Development Consultants Melbourne"
        url="/contact"
        description="Contact PDCON for expert property development consulting, investment advisory, and joint venture opportunities in Melbourne. Schedule your consultation today."
        keywords="contact property consultant Melbourne, property development enquiry, investment property consultation, PDCON contact, property advisory Melbourne"
      />
      {/* Hero */}
      <section className="relative min-h-[calc(100vh-80px)] flex items-center px-6 lg:px-12 bg-primary text-white overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 w-full py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8">Contact <span className="text-accent">Us</span></h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-2xl leading-relaxed">
              Whether you're exploring a joint venture, seeking advisory, or looking for your next acquisition, we're here to help.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-24">
            {/* Contact Info */}
            <div className="space-y-16">
              <div className="space-y-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-1 bg-accent" />
                  <img src={LOGO_URL} alt="PDCON" className="h-8 w-auto object-contain" />
                </div>
                <h2 className="text-4xl font-heading font-bold text-primary leading-tight">Let's Discuss Your Next Property Move</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our specialists are available for strategic consultations regarding Melbourne's residential and development markets. Reach out today to schedule a confidential discussion.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="font-heading font-bold text-lg uppercase tracking-widest text-accent border-b border-primary/10 pb-2">Direct Contact</h3>
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4 group cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-accent group-hover:text-white transition-colors">
                        <Phone size={18} />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Phone</span>
                        <a href="tel:+61408255259" className="text-primary font-bold hover:text-accent transition-colors">0408 255 259</a>
                      </div>
                    </li>
                    <li className="flex items-start gap-4 group cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-accent group-hover:text-white transition-colors">
                        <Mail size={18} />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Email</span>
                        <a href="mailto:info@pdcon.com.au" className="text-primary font-bold hover:text-accent transition-colors">info@pdcon.com.au</a>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="space-y-6">
                  <h3 className="font-heading font-bold text-lg uppercase tracking-widest text-accent border-b border-primary/10 pb-2">Our Office</h3>
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Location</span>
                        <span className="text-primary font-bold">7 Hammel Court</span>
                        <span className="block text-xs text-muted-foreground mt-1">Hallam 3803, Victoria</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                        <Clock size={18} />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Office Hours</span>
                        <span className="text-primary font-bold uppercase text-sm">Mon–Fri: 9AM–5PM</span>
                        <span className="block text-xs text-muted-foreground mt-1">Weekends: By Appointment</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 border-t">
                <div className="p-6 bg-accent/5 border border-accent/20 rounded-sm space-y-3">
                  <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-widest text-[10px]">
                    <CheckCircle2 size={14} /> 100% Confidential
                  </div>
                  <p className="text-xs text-muted-foreground italic">All discussions and project details are handled with strict professional confidentiality.</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div ref={formRef} className="bg-secondary/30 p-6 sm:p-10 lg:p-16 border border-secondary shadow-2xl relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 -z-10 rounded-bl-full" />
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 lg:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Your Name</label>
                    <input 
                      name="name" 
                      required 
                      placeholder="Jane Smith"
                      className="w-full bg-white border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Email <span className="text-muted-foreground normal-case">(or phone)</span></label>
                    <input 
                      name="email" 
                      type="email" 
                      placeholder="jane@example.com"
                      className="w-full bg-white border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm font-medium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Phone <span className="text-muted-foreground normal-case">(or email)</span></label>
                    <input 
                      name="phone" 
                      placeholder="+61 400 000 000"
                      className="w-full bg-white border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Project Type</label>
                    <select name="projectType" className="w-full bg-white border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all appearance-none cursor-pointer text-sm font-medium">
                      <option>Property Advisory</option>
                      <option>Buyer's Agency</option>
                      <option>Joint Venture</option>
                      <option>Project Management</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Estimated Budget</label>
                  <select name="budget" className="w-full bg-white border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all appearance-none cursor-pointer text-sm font-medium">
                    <option>$500k - $1M</option>
                    <option>$1M - $3M</option>
                    <option>$3M - $5M</option>
                    <option>$5M+</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Your Message</label>
                  <textarea 
                    name="message" 
                    required 
                    rows={4}
                    placeholder="Tell us about your property goals..."
                    value={messageValue}
                    onChange={(e) => setMessageValue(e.target.value)}
                    className="w-full bg-white border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm font-medium resize-none"
                  ></textarea>
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full rounded-none bg-primary hover:bg-primary/95 text-white py-5 sm:py-8 font-heading font-bold uppercase tracking-wider text-xs sm:text-sm h-auto flex gap-2 sm:gap-3"
                >
                  {isSubmitting ? 'Sending...' : (
                    <>
                      Send Message <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="h-[500px] w-full bg-secondary grayscale">
        <div className="w-full h-full flex items-center justify-center bg-secondary/50 border-y">
          <div className="text-center space-y-4">
            <MapPin size={48} className="mx-auto text-primary/20" />
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-muted-foreground/60">Melbourne, Victoria, Australia</span>
          </div>
        </div>
      </section>
    </div>
  );
}
