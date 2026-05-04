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
import ResourcePage from '@/pages/ResourcePage';
import Invest from '@/pages/Invest';
import BookConsultation from '@/pages/BookConsultation';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AdminLayout from '@/pages/admin/AdminLayout';
import InvestorLayout from '@/pages/investor/InvestorLayout';
import NotFound from '@/pages/NotFound';

import Dashboard from '@/pages/admin/panels/Dashboard';
import Loans from '@/pages/admin/panels/Loans';
import LoanDetail from '@/pages/admin/panels/LoanDetail';
import Borrowers from '@/pages/admin/panels/Borrowers';
import Projects from '@/pages/admin/panels/Projects';
import Inflows from '@/pages/admin/panels/Inflows';
import Statements from '@/pages/admin/panels/Statements';
import Requests from '@/pages/admin/panels/Requests';
import EmailPanel from '@/pages/admin/panels/Email';
import Members from '@/pages/admin/panels/Members';
import Blog from '@/pages/admin/panels/Blog';
import UsersPanel from '@/pages/admin/panels/Users';
import Audit from '@/pages/admin/panels/Audit';
import Account from '@/pages/admin/panels/Account';

import InvestorOverview from '@/pages/investor/panels/Overview';
import InvestorMyLoans from '@/pages/investor/panels/MyLoans';
import InvestorStatements from '@/pages/investor/panels/Statements';
import InvestorRequestsPanel from '@/pages/investor/panels/Requests';
import InvestorProfile from '@/pages/investor/panels/Profile';

const NO_CHROME_PREFIXES = ['/admin', '/investor', '/login', '/forgot-password', '/reset-password'];

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return null;
}

function RootLayout() {
  const location = useLocation();
  const noChrome = NO_CHROME_PREFIXES.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`));

  if (noChrome) {
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
  notFoundComponent: NotFound,
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home });
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: About });
const servicesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/services', component: Services });
const portfolioRoute = createRoute({ getParentRoute: () => rootRoute, path: '/portfolio', component: Portfolio });
const insightsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/insights', component: Insights });
const insightPostRoute = createRoute({ getParentRoute: () => rootRoute, path: '/insights/$id', component: InsightPost });
const resourcesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/resources', component: Resources });
const resourcePageRoute = createRoute({ getParentRoute: () => rootRoute, path: '/resources/$slug', component: ResourcePage });
const investRoute = createRoute({ getParentRoute: () => rootRoute, path: '/invest', component: Invest });
const bookConsultationRoute = createRoute({ getParentRoute: () => rootRoute, path: '/book-consultation', component: BookConsultation });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: Login });
const forgotPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forgot-password', component: ForgotPassword });
const resetPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/reset-password', component: ResetPassword });

// Admin parent + child routes
const adminLayoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin', component: AdminLayout });
const adminIndexRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/', component: () => null });
const adminDashboardRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: 'dashboard', component: Dashboard });
const adminLoansRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: 'loans', component: Loans });
const adminLoanDetailRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: 'loans/$id', component: LoanDetail });
const adminBorrowersRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: 'borrowers', component: Borrowers });
const adminProjectsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: 'projects', component: Projects });
const adminInflowsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: 'inflows', component: Inflows });
const adminStatementsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: 'statements', component: Statements });
const adminRequestsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: 'requests', component: Requests });
const adminEmailRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: 'email', component: EmailPanel });
const adminMembersRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: 'members', component: Members });
const adminBlogRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: 'blog', component: Blog });
const adminUsersRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: 'users', component: UsersPanel });
const adminAuditRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: 'audit', component: Audit });
const adminAccountRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: 'account', component: Account });

const adminRoute = adminLayoutRoute.addChildren([
  adminIndexRoute,
  adminDashboardRoute,
  adminLoansRoute, adminLoanDetailRoute,
  adminBorrowersRoute, adminProjectsRoute,
  adminInflowsRoute, adminStatementsRoute, adminRequestsRoute,
  adminEmailRoute, adminMembersRoute, adminBlogRoute,
  adminUsersRoute, adminAuditRoute,
  adminAccountRoute,
]);

// Investor parent + child routes
const investorLayoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/investor', component: InvestorLayout });
const investorIndexRoute = createRoute({ getParentRoute: () => investorLayoutRoute, path: '/', component: () => null });
const investorOverviewRoute = createRoute({ getParentRoute: () => investorLayoutRoute, path: 'overview', component: InvestorOverview });
const investorLoansRoute = createRoute({ getParentRoute: () => investorLayoutRoute, path: 'loans', component: InvestorMyLoans });
const investorStatementsRoute = createRoute({ getParentRoute: () => investorLayoutRoute, path: 'statements', component: InvestorStatements });
const investorRequestsRoute = createRoute({ getParentRoute: () => investorLayoutRoute, path: 'requests', component: InvestorRequestsPanel });
const investorProfileRoute = createRoute({ getParentRoute: () => investorLayoutRoute, path: 'profile', component: InvestorProfile });

const investorRoute = investorLayoutRoute.addChildren([
  investorIndexRoute,
  investorOverviewRoute, investorLoansRoute,
  investorStatementsRoute, investorRequestsRoute, investorProfileRoute,
]);

const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  servicesRoute,
  portfolioRoute,
  insightsRoute,
  insightPostRoute,
  resourcesRoute,
  resourcePageRoute,
  investRoute,
  bookConsultationRoute,
  loginRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  adminRoute,
  investorRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
