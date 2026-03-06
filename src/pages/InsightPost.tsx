import { useState, useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Clock, ChevronLeft, Calendar } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';

const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

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

export default function InsightPost() {
  const { id } = useParams({ from: '/insights/$id' });
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-heading font-bold text-primary">Article Not Found</h1>
        <p className="text-muted-foreground">The article you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/insights">Back to Insights</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-primary min-h-screen">
      <SEO 
        title={post.title}
        url={`/insights/${post.id}`}
        description={post.excerpt}
        image={post.thumbnail}
        type="article"
        publishedTime={post.date}
      />
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <Link 
          to="/insights" 
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
        >
          <ChevronLeft size={16} /> Back to Blog
        </Link>
      </div>

      {/* Header */}
      <header className="pt-12 pb-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="flex items-center justify-center gap-4 text-sm text-white/60 mb-8">
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              {formatDate(post.date)}
            </div>
            <span className="text-white/30">|</span>
            <div className="flex items-center gap-2">
              <Clock size={14} />
              {post.read_time}
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-8 leading-tight">
            {post.title}
          </h1>
          
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            {post.excerpt}
          </p>
        </motion.div>
      </header>

      {/* Featured Image */}
      {post.thumbnail && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="px-6 pb-16"
        >
          <div className="max-w-4xl mx-auto">
            <img 
              src={post.thumbnail} 
              alt={post.title}
              className="w-full rounded-xl shadow-2xl"
            />
          </div>
        </motion.div>
      )}

      {/* Content */}
      <section className="bg-background rounded-t-3xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-3xl mx-auto px-6 py-16 lg:py-24"
        >
          {post.content ? (
            <div 
              className="prose prose-lg max-w-none 
                [&_h1]:text-3xl [&_h1]:font-heading [&_h1]:font-bold [&_h1]:text-primary [&_h1]:my-8
                [&_h2]:text-2xl [&_h2]:font-heading [&_h2]:font-bold [&_h2]:text-primary [&_h2]:my-6 [&_h2]:pt-4
                [&_h3]:text-xl [&_h3]:font-heading [&_h3]:font-bold [&_h3]:text-primary [&_h3]:my-4
                [&_p]:my-4 [&_p]:leading-relaxed [&_p]:text-muted-foreground
                [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:my-8 [&_blockquote]:text-primary [&_blockquote]:bg-secondary/30 [&_blockquote]:py-4 [&_blockquote]:pr-6 [&_blockquote]:rounded-r-lg
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:text-muted-foreground
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:text-muted-foreground
                [&_li]:my-2
                [&_figure]:my-8
                [&_figure_img]:rounded-xl [&_figure_img]:shadow-lg [&_figure_img]:w-full
                [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted-foreground [&_figcaption]:mt-3 [&_figcaption]:italic
                [&_img]:rounded-xl [&_img]:my-8 [&_img]:shadow-lg
                [&_a]:text-accent [&_a]:underline [&_a]:hover:text-accent/80
                [&_table]:w-auto [&_table]:border-collapse [&_table]:my-8 [&_table]:mx-auto
                [&_th]:border [&_th]:border-border [&_th]:p-4 [&_th]:bg-secondary [&_th]:font-bold [&_th]:text-primary
                [&_td]:border [&_td]:border-border [&_td]:p-4
                [&_strong]:text-primary [&_strong]:font-bold
                [&_em]:italic
                [&_mark]:bg-accent/20 [&_mark]:text-primary [&_mark]:px-1 [&_mark]:rounded
                [&_hr]:my-12 [&_hr]:border-border
                [&_[style*='text-align:_center']]:text-center
                [&_[style*='text-align:_right']]:text-right
                [&_[style*='text-align:center']]:text-center
                [&_[style*='text-align:right']]:text-right"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <p className="text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
          )}
        </motion.div>

        {/* CTA */}
        <section className="py-16 px-6 bg-secondary/30 border-t">
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl font-heading font-bold text-primary mb-2">Want to discuss this topic?</h3>
              <p className="text-muted-foreground">Book a consultation with our property experts.</p>
            </div>
            <Button asChild className="rounded-none bg-primary hover:bg-primary/90">
              <Link to="/book-consultation">Book Consultation</Link>
            </Button>
          </div>
        </section>
      </section>
    </div>
  );
}
