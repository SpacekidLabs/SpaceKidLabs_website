import {StrictMode} from 'react';
import {createRoot, hydrateRoot} from 'react-dom/client';
import App, {ROUTE_PRELOADERS} from './App.tsx';
// Fonts are bundled with the site (no Google Fonts requests). Same weights the site used before.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import './index.css';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (root.hasChildNodes()) {
  // The page was pre-rendered at build time (scripts/prerender.ts): fetch this page's code, then take over the
  // existing HTML instead of redrawing it, so there's no blank flash.
  const preload = ROUTE_PRELOADERS.find(([pattern]) => pattern.test(location.pathname))?.[1];
  (preload ? preload() : Promise.resolve()).finally(() => hydrateRoot(root, app));
} else {
  createRoot(root).render(app);
}
