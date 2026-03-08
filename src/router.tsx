import { createRouter, createRootRoute, createRoute, Outlet, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Services from '@/pages/Services';
import Portfolio from '@/pages/Portfolio';
import Insights from '@/pages/Insights';
import InsightPost from '@/pages/InsightPost';
import Resources from '@/pages/Resources';
import Contact from '@/pages/Contact';
import BookConsultation from '@/pages/BookConsultation';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';

function ScrollToTop() {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return null;
}

function RootLayout() {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';
  
  if (isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <ScrollToTop />
        <Outlet />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: About,
});

const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/services',
  component: Services,
});

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/portfolio',
  component: Portfolio,
});

const insightsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/insights',
  component: Insights,
});

const insightPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/insights/$id',
  component: InsightPost,
});

const resourcesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/resources',
  component: Resources,
});

const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contact',
  component: Contact,
});

const bookConsultationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/book-consultation',
  component: BookConsultation,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: Admin,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFound,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  servicesRoute,
  portfolioRoute,
  insightsRoute,
  insightPostRoute,
  resourcesRoute,
  contactRoute,
  bookConsultationRoute,
  adminRoute,
  notFoundRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
