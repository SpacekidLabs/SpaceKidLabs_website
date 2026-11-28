import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { lazyNamed } from './lib/lazyNamed';

// Each page is downloaded only when someone opens it.
const Landing = lazyNamed(() => import('./pages/Landing'), 'Landing');
const Archive = lazyNamed(() => import('./pages/Archive'), 'Archive');
const WavesetQuantizer = lazyNamed(() => import('./pages/WavesetQuantizer'), 'WavesetQuantizer');
const DownloadPage = lazyNamed(() => import('./pages/Download'), 'DownloadPage');
const ServicesPage = lazyNamed(() => import('./pages/Services'), 'ServicesPage');
const SamplesPage = lazyNamed(() => import('./pages/Samples'), 'SamplesPage');
const SketchesPage = lazyNamed(() => import('./pages/Sketches'), 'SketchesPage');
const NotFoundPage = lazyNamed(() => import('./pages/NotFound'), 'NotFoundPage');

/** Page loaders by route, so the browser can fetch the current page's code before hydrating pre-rendered HTML. */
export const ROUTE_PRELOADERS: Array<[RegExp, () => Promise<unknown>]> = [
  [/^\/$/, () => import('./pages/Landing')],
  [/^\/archive(\/.*)?$/, () => import('./pages/Archive')],
  [/^\/waveset-quantizer$/, () => import('./pages/WavesetQuantizer')],
  [/^\/download$/, () => import('./pages/Download')],
  [/^\/services$/, () => import('./pages/Services')],
  [/^\/samples$/, () => import('./pages/Samples')],
  [/^\/sketches$/, () => import('./pages/Sketches')],
];

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

/** The site's pages, without a router. Rendered by BrowserRouter in the browser and StaticRouter at build time. */
export function AppRoutes() {
  return (
    // reducedMotion="user": animations become instant fades for visitors whose system asks for less motion.
    <MotionConfig reducedMotion="user">
      <ScrollToTop />
      {/* Shown only on the very first page load; later navigations keep the current page up while the next one loads. */}
      <Suspense fallback={<div className="min-h-screen bg-brand-dark" />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/archive/:slug" element={<Archive />} />
          <Route path="/waveset-quantizer" element={<WavesetQuantizer />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/samples" element={<SamplesPage />} />
          <Route path="/sketches" element={<SketchesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
