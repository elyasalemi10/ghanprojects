import { useEffect } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { Toaster } from '@/components/ui/sonner';

function App() {
  useEffect(() => {
    // Emit event for pre-renderer to know the page is ready
    document.dispatchEvent(new Event('render-event'));
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  );
}

export default App;
