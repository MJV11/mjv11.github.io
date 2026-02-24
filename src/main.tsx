import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import { NavProvider } from './contexts/NavContext.tsx';
import { PortfolioImagesProvider } from './contexts/PortfolioImagesContext.tsx';
import { ColorProvider } from './contexts/ColorContext.tsx';
import { PostHogProvider } from '@posthog/react';

const queryClient = new QueryClient();

const posthogOptions = {
  api_host: 'https://us.i.posthog.com',
  defaults: '2026-01-30',
} as const

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={posthogOptions}>
      <ColorProvider>
        <NavProvider>
          <PortfolioImagesProvider>
            <QueryClientProvider client={queryClient}>
              <App />
            </QueryClientProvider>
          </PortfolioImagesProvider>
        </NavProvider>
      </ColorProvider>
    </PostHogProvider>
  </StrictMode>,
)
