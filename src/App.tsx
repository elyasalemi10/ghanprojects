import { useEffect, useState } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { Toaster } from '@/components/ui/sonner';
import { Chatbot } from '@/components/shared/Chatbot';

const PORTAL_PREFIXES = ['/admin', '/investor', '/login', '/forgot-password', '/reset-password'];

function isPortalPath(pathname: string) {
  return PORTAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function App() {
  const [pathname, setPathname] = useState<string>(typeof window !== 'undefined' ? window.location.pathname : '/');

  useEffect(() => {
    document.dispatchEvent(new Event('render-event'));
    const unsub = router.subscribe('onResolved', () => {
      setPathname(window.location.pathname);
    });
    return () => { unsub(); };
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
      {!isPortalPath(pathname) && <Chatbot />}
    </>
  );
}

export default App;
