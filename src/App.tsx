import { useEffect } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { Toaster } from '@/components/ui/sonner';
import { Chatbot } from '@/components/shared/Chatbot';

function App() {
  useEffect(() => {
    document.dispatchEvent(new Event('render-event'));
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
      <Chatbot />
    </>
  );
}

export default App;
