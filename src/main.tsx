import './index.css';

import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import AsciiRipple from './AsciiRipple';

const StyleInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    document.documentElement.classList.remove('loading');
    document.documentElement.classList.add('loaded');
  }, []);

  return <>{children}</>;
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <StyleInitializer>
      <AsciiRipple />
    </StyleInitializer>
  </StrictMode>
);
