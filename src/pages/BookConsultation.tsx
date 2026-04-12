import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  PhoneCall, 
  Calendar, 
  CheckCircle2, 
  Clock,
  ShieldCheck,
  Target,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '@/components/shared/SEO';

const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export default function BookConsultation() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const search = useSearch({ strict: false }) as { type?: string };
  const isShowroomBooking = search.type === 'showroom-booking';

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
    
    const data = isShowroomBooking ? {
      fullName: formData.get('fullName'),
      email,
      phone,
      preferredDate: formData.get('preferredDate'),
      message: `Showroom Visit Request for ${formData.get('preferredDate')}`,
      isShowroomBooking: true
    } : {
      fullName: formData.get('fullName'),
      email,
      phone,
      budgetRange: formData.get('budgetRange'),
      interestType: formData.get('interestType'),
      preferredTime: formData.get('preferredTime'),
      message: formData.get('message')
    };
    
    try {
      const res = await fetch(`${API_URL}/api/consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        toast.success(isShowroomBooking 
          ? 'Showroom visit request received. We will confirm your appointment shortly.'
          : 'Consultation request received. A specialist will contact you shortly.'
        );
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error('Failed to submit request. Please try again.');
      }
    } catch {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <SEO 
        title={isShowroomBooking ? "Book Showroom Visit Melbourne" : "Book Property Consultation Melbourne"}
        url="/book-consultation"
        description={isShowroomBooking 
          ? "Schedule a visit to our Melbourne showroom. See our project displays and meet our property development specialists in person."
          : "Schedule a free property development consultation with PDCON. Discuss your property investment strategy, development opportunities, or joint venture partnerships in Melbourne."
        }
        keywords={isShowroomBooking
          ? "book showroom visit Melbourne, property showroom, PDCON showroom, property display Melbourne"
          : "property consultation Melbourne, book property consultant, free property advice, property investment consultation, development consultation Melbourne"
        }
      />
      {/* Hero */}
      <section className="relative py-20 lg:py-28 px-6 lg:px-12 bg-primary text-white overflow-hidden text-center">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/20 border border-accent/30 rounded-full text-accent text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
              {isShowroomBooking ? <MapPin size={14} /> : <ShieldCheck size={14} />}
              {isShowroomBooking ? 'Showroom Visit' : 'Strategic Property Advisory'}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight">
              {isShowroomBooking ? (
                <>Book a <span className="text-accent italic">Showroom Visit</span></>
              ) : (
                <>Book a <span className="text-accent italic">Consultation</span></>
              )}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed px-4">
              {isShowroomBooking 
                ? 'Visit our Melbourne showroom to view project displays and discuss your property goals in person.'
                : 'Tell us about your property goals. Our specialists will review your requirements and respond within 1 business day.'
              }
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            {/* Form Column */}
            <div className="lg:col-span-7">
              <div className="bg-white p-6 sm:p-8 lg:p-12 xl:p-16 border shadow-2xl relative">
                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                  {isShowroomBooking ? (
                    <>
                      {/* Showroom Booking - Simplified Form */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Full Name</label>
                        <input 
                          name="fullName" 
                          required 
                          placeholder="John Doe"
                          className="w-full bg-secondary/30 border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Email or Phone</label>
                        <input 
                          name="email" 
                          type="email" 
                          placeholder="john@example.com or +61 400 000 000"
                          className="w-full bg-secondary/30 border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm font-medium"
                        />
                        <input 
                          name="phone" 
                          placeholder="Or enter phone number"
                          className="w-full bg-secondary/30 border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm font-medium mt-3"
                        />
                        <p className="text-xs text-muted-foreground">Provide at least one contact method</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Preferred Visit Date</label>
                        <input 
                          name="preferredDate" 
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-secondary/30 border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm font-medium"
                        />
                        <p className="text-xs text-muted-foreground">Mon-Fri, 9AM-5PM. Weekends by appointment.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Regular Consultation Form */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Full Name</label>
                          <input 
                            name="fullName" 
                            required 
                            placeholder="John Doe"
                            className="w-full bg-secondary/30 border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Email <span className="text-muted-foreground normal-case">(or phone)</span></label>
                          <input 
                            name="email" 
                            type="email" 
                            placeholder="john@example.com"
                            className="w-full bg-secondary/30 border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm font-medium"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Phone <span className="text-muted-foreground normal-case">(or email)</span></label>
                          <input 
                            name="phone" 
                            placeholder="+61 400 000 000"
                            className="w-full bg-secondary/30 border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Budget Range</label>
                          <select name="budgetRange" className="w-full bg-secondary/30 border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all appearance-none cursor-pointer text-sm font-medium">
                            <option>$500k - $1M</option>
                            <option>$1M - $3M</option>
                            <option>$3M - $5M</option>
                            <option>$5M+</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Interest Type</label>
                          <select name="interestType" className="w-full bg-secondary/30 border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all appearance-none cursor-pointer text-sm font-medium">
                            <option>Property Advisory</option>
                            <option>Buyer's Agency</option>
                            <option>Joint Venture</option>
                            <option>Project Management</option>
                            <option>Off-market Opportunities</option>
                            <option>Development Finance</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Preferred Time</label>
                          <select name="preferredTime" className="w-full bg-secondary/30 border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all appearance-none cursor-pointer text-sm font-medium">
                            <option>Morning (10am - 12pm)</option>
                            <option>Afternoon (12pm - 4pm)</option>
                            <option>Anytime (10am - 4pm)</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Message / Project Details</label>
                        <textarea 
                          name="message" 
                          required 
                          rows={4}
                          placeholder="Brief overview of your property goals..."
                          className="w-full bg-secondary/30 border border-border p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm font-medium resize-none"
                        ></textarea>
                      </div>
                    </>
                  )}
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full rounded-none bg-primary hover:bg-primary/95 text-white py-6 sm:py-7 font-heading font-bold uppercase tracking-wider text-xs sm:text-sm h-auto flex gap-2 sm:gap-3 shadow-xl"
                  >
                    {isSubmitting ? 'Processing...' : (
                      <>
                        {isShowroomBooking ? 'Book Showroom Visit' : 'Request a Call Back'}
                        {isShowroomBooking ? <Calendar size={18} /> : <PhoneCall size={18} />}
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center leading-relaxed">By submitting this form, you agree to receive communications from PDCON.</p>
                </form>
              </div>
            </div>

            {/* Info Column */}
            <div className="lg:col-span-5 space-y-8 lg:space-y-12">
              <div className="space-y-6 lg:space-y-8">
                <h2 className="text-2xl lg:text-3xl font-heading font-bold text-primary border-b pb-4 lg:pb-6">
                  {isShowroomBooking ? 'Visit Our Showroom' : 'What to Expect'}
                </h2>
                <div className="space-y-6 lg:space-y-10">
                  {isShowroomBooking ? (
                    <>
                      {[
                        { 
                          icon: <MapPin />, 
                          title: 'Prime Location', 
                          desc: 'Level 19, 263 William St, Melbourne CBD - easily accessible by public transport.' 
                        },
                        { 
                          icon: <Target />, 
                          title: 'Project Displays', 
                          desc: 'View detailed project models, plans, and materials from our current developments.' 
                        },
                        { 
                          icon: <Calendar />, 
                          title: 'Personalized Tour', 
                          desc: 'A specialist will guide you through our portfolio and discuss your property goals.' 
                        }
                      ].map((item, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          className="flex gap-4 lg:gap-6 group"
                        >
                          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-all">
                            {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                          </div>
                          <div className="space-y-1 lg:space-y-2">
                            <h3 className="font-heading font-bold text-lg lg:text-xl text-primary">{item.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </>
                  ) : (
                    <>
                      {[
                        { 
                          icon: <Clock />, 
                          title: 'Rapid Response', 
                          desc: 'A specialist will review your request and reach out within 24 business hours.' 
                        },
                        { 
                          icon: <Target />, 
                          title: 'Strategic Alignment', 
                          desc: 'We\'ll discuss your specific goals and assess how our services align with your needs.' 
                        },
                        { 
                          icon: <Calendar />, 
                          title: 'Structured Strategy', 
                          desc: 'Following the initial call, we\'ll provide a preliminary roadmap for your project.' 
                        }
                      ].map((item, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          className="flex gap-4 lg:gap-6 group"
                        >
                          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-all">
                            {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                          </div>
                          <div className="space-y-1 lg:space-y-2">
                            <h3 className="font-heading font-bold text-lg lg:text-xl text-primary">{item.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {!isShowroomBooking && (
                <div className="bg-secondary/30 p-6 lg:p-10 space-y-6 lg:space-y-8 border">
                  <h3 className="text-xl lg:text-2xl font-heading font-bold text-primary">Frequently Asked Questions</h3>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-left font-bold text-primary text-xs sm:text-sm uppercase tracking-wider py-3 lg:py-4">Do you work with first-time investors?</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                        Yes, we work with both seasoned developers and first-time investors. We tailor our advisory level to match your experience and project complexity.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-left font-bold text-primary text-xs sm:text-sm uppercase tracking-wider py-3 lg:py-4">What areas of Melbourne do you cover?</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                        We focus on Melbourne's growth corridors and established residential suburbs across the metropolitan area, with a deep specialty in Eastern and South-Eastern suburbs.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger className="text-left font-bold text-primary text-xs sm:text-sm uppercase tracking-wider py-3 lg:py-4">How do your fees work?</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                        Our fee structures vary depending on the service—ranging from fixed advisory fees to percentage-based buyer's agency or project management fees. JV models are typically based on profit-sharing.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                      <AccordionTrigger className="text-left font-bold text-primary text-xs sm:text-sm uppercase tracking-wider py-3 lg:py-4">Do you guarantee investment returns?</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                        While we provide rigorous feasibility analysis and data-driven guidance to maximize success, property investment carries inherent risks and returns cannot be guaranteed.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              <div className="p-6 lg:p-8 border border-accent/20 bg-accent/5 rounded-sm space-y-3 lg:space-y-4">
                <div className="flex items-center gap-3 text-accent font-bold uppercase tracking-widest text-[10px]">
                  <CheckCircle2 size={14} /> 100% Confidential
                </div>
                <p className="text-xs text-muted-foreground italic">All discussions and project details are handled with strict professional confidentiality.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 lg:py-20 px-6 lg:px-12 bg-secondary/10 border-t">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-8 lg:gap-24 opacity-30 grayscale contrast-125">
          <div className="font-heading font-bold text-lg lg:text-2xl tracking-tighter">MELBOURNE COUNCIL</div>
          <div className="font-heading font-bold text-lg lg:text-2xl tracking-tighter">VCAT PLANNING</div>
          <div className="font-heading font-bold text-lg lg:text-2xl tracking-tighter">MASTER BUILDERS</div>
          <div className="font-heading font-bold text-lg lg:text-2xl tracking-tighter">REIV MEMBER</div>
        </div>
      </section>
    </div>
  );
}
