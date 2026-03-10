import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Search, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { SEO } from '@/components/shared/SEO';
import { toast } from 'sonner';

const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

const categories = ['All', 'Development', 'Investment', 'Strategy', 'Finance', 'Market Update'];
const ARTICLES_PER_PAGE = 10;

interface BlogPost {
  id: number;
  title: string;
  category: string;
  thumbnail: string;
  date: string;
  read_time: string;
  content: string;
  excerpt: string;
}

const fallbackArticles: BlogPost[] = [
  {
    id: 1,
    title: 'How to Assess a Development Site in Melbourne',
    category: 'Strategy',
    date: '2023-10-12',
    read_time: '6 min read',
    excerpt: 'Identifying the right site is the most critical step in property development. Learn the key factors we analyze to ensure feasibility...',
    thumbnail: '/images/property-analysis.webp',
    content: ''
  },
  {
    id: 2,
    title: 'JV Property Development: How Profit Splits Work',
    category: 'Finance',
    date: '2023-09-28',
    read_time: '8 min read',
    excerpt: 'Joint ventures offer a powerful way to leverage capital and expertise. We break down the standard models and how to structure a fair deal...',
    thumbnail: '/images/glen-waverley.webp',
    content: ''
  },
  {
    id: 3,
    title: 'Feasibility Basics: Costs, Risks, and Returns',
    category: 'Investment',
    date: '2023-09-15',
    read_time: '5 min read',
    excerpt: 'Before a shovel hits the ground, the numbers must stack up. Discover the fundamental metrics every property developer needs to track...',
    thumbnail: '/images/commercial-richmond.webp',
    content: ''
  }
];

function ArticleSkeleton() {
  return (
    <div className="bg-background border flex flex-col shadow-sm animate-pulse">
      <div className="relative aspect-video bg-secondary/50" />
      <div className="p-10 flex flex-col flex-grow">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-3 w-20 bg-secondary/50 rounded" />
          <div className="w-1 h-1 bg-secondary/50 rounded-full" />
          <div className="h-3 w-16 bg-secondary/50 rounded" />
        </div>
        <div className="h-7 bg-secondary/50 rounded mb-3 w-full" />
        <div className="h-7 bg-secondary/50 rounded mb-6 w-3/4" />
        <div className="space-y-2 mb-10 flex-grow">
          <div className="h-4 bg-secondary/30 rounded w-full" />
          <div className="h-4 bg-secondary/30 rounded w-full" />
          <div className="h-4 bg-secondary/30 rounded w-2/3" />
        </div>
        <div className="pt-6 border-t mt-auto">
          <div className="h-4 w-32 bg-secondary/50 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Insights() {
  const [activeCat, setActiveCat] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<BlogPost[]>(fallbackArticles);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCat, searchQuery]);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setArticles(data);
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(a => {
    const matchesCat = activeCat === 'All' || a.category === activeCat;
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         a.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-background">
      <SEO 
        title="Property Development & Investment Insights"
        url="/insights"
        description="Expert property development insights, market analysis, and investment guides for Melbourne. Strategic advice on property investment, development feasibility, and market trends."
        keywords="property investment insights, Melbourne property market analysis, property development guides, investment property advice, real estate market trends Victoria, property feasibility insights, development strategy Melbourne"
      />
      {/* Hero */}
      <section className="relative min-h-[calc(100vh-80px)] flex items-center px-6 lg:px-12 bg-primary text-white overflow-hidden text-center">
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            poster="/images/insights-thumbnail.webp"
            className="w-full h-full object-cover"
          >
            <source src="/images/insights.webm" type="video/webm" />
          </video>
          <div className="absolute inset-0 bg-primary/70" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 w-full py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8">Property <span className="text-accent">Insights</span></h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              Strategic analysis, market updates, and expert guides for Melbourne's property development sector.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-12 bg-secondary/30 px-6 lg:px-12 border-b">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 justify-between items-center">
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={cn(
                  "px-5 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border",
                  activeCat === cat 
                    ? "bg-primary text-white border-primary shadow-lg" 
                    : "bg-background text-primary border-transparent hover:border-accent"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border-none p-4 pl-12 focus:ring-2 focus:ring-accent outline-none font-medium text-sm transition-all"
            />
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[...Array(6)].map((_, i) => (
                <ArticleSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
              >
                <AnimatePresence mode="popLayout">
                  {paginatedArticles.map((a) => (
                    <motion.div
                      key={a.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Link 
                        to="/insights/$id" 
                        params={{ id: String(a.id) }}
                        className="group bg-background border hover:border-accent transition-all duration-500 flex flex-col shadow-sm hover:shadow-2xl cursor-pointer block h-full"
                      >
                        <div className="relative aspect-video overflow-hidden">
                          <img 
                            src={a.thumbnail || '/images/hero-about.webp'} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            alt={a.title}
                          />
                          <div className="absolute top-6 left-6">
                            <span className="px-3 py-1 bg-accent text-white text-[10px] font-bold uppercase tracking-widest">{a.category}</span>
                          </div>
                        </div>
                        <div className="p-10 flex flex-col flex-grow">
                          <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4">
                            <span>{formatDate(a.date)}</span>
                            <span className="w-1 h-1 bg-accent rounded-full" />
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} />
                              {a.read_time}
                            </div>
                          </div>
                          <h3 className="text-2xl font-heading font-bold text-primary mb-6 leading-tight group-hover:text-accent transition-colors">{a.title}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed mb-10 flex-grow line-clamp-3">
                            {a.excerpt}
                          </p>
                          <div className="pt-6 border-t mt-auto">
                            <span className="text-primary group-hover:text-accent font-bold uppercase tracking-widest text-xs inline-flex items-center gap-2">
                              Read Full Article <ChevronRight size={16} />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-16">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="gap-2"
                  >
                    <ChevronLeft size={16} /> Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={cn(
                          "w-10 h-10 flex items-center justify-center font-bold text-sm transition-colors",
                          currentPage === i + 1
                            ? "bg-primary text-white"
                            : "bg-secondary/30 text-primary hover:bg-secondary"
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="gap-2"
                  >
                    Next <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </>
          )}

          {!loading && filteredArticles.length === 0 && (
            <div className="py-20 text-center text-muted-foreground italic flex flex-col items-center gap-4">
              <Search size={48} className="text-muted-foreground/30" />
              No articles found matching your criteria.
            </div>
          )}
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="py-24 px-6 lg:px-12 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-heading font-bold leading-tight">Get Strategic Insights Delivered to Your Inbox</h2>
          <p className="text-white/70 text-lg">Join 2,000+ Melbourne property investors and receive monthly market analysis and project updates.</p>
          <form 
            className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto" 
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
              const email = emailInput?.value;
              
              if (!email) {
                toast.error('Please enter your email address');
                return;
              }
              
              const submitBtn = form.querySelector('button') as HTMLButtonElement;
              submitBtn.disabled = true;
              submitBtn.textContent = 'Subscribing...';
              
              try {
                const res = await fetch(`${API_URL}/api/newsletter`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, source: 'insights' })
                });
                
                if (res.ok) {
                  toast.success('Successfully subscribed! Check your inbox for confirmation.');
                  emailInput.value = '';
                } else {
                  const data = await res.json();
                  toast.error(data.message || 'Failed to subscribe. Please try again.');
                }
              } catch {
                toast.error('Failed to connect. Please try again.');
              } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Subscribe';
              }
            }}
          >
            <input 
              type="email" 
              placeholder="Your Email Address" 
              required
              className="flex-grow bg-white/10 border border-white/20 p-4 focus:outline-none focus:ring-2 focus:ring-accent text-white placeholder:text-white/50"
            />
            <Button type="submit" className="rounded-none bg-accent hover:bg-accent/90 text-white font-heading font-bold uppercase tracking-wider px-8 h-auto py-4">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
