import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import { PhotoProvider } from './contexts/PhotoContext.tsx';
import { NavProvider } from './contexts/NavContext.tsx';
import { PortfolioImagesProvider } from './contexts/PortfolioImagesContext.tsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NavProvider>
      <PortfolioImagesProvider>
        <QueryClientProvider client={queryClient}>
          <PhotoProvider>
            <App />
          </PhotoProvider>
        </QueryClientProvider>
      </PortfolioImagesProvider>
    </NavProvider>
  </StrictMode>,
)
