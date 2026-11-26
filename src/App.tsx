import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { DownloadPage } from './pages/Download';
import { ServicesPage } from './pages/Services';
import { SamplesPage } from './pages/Samples';
import { Archive } from './pages/Archive';

import { WavesetQuantizer } from './pages/WavesetQuantizer';
import { NotFoundPage } from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/archive/:slug" element={<Archive />} />
        <Route path="/waveset-quantizer" element={<WavesetQuantizer />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/samples" element={<SamplesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
