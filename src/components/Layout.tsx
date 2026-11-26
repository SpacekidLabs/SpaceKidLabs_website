import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col selection:bg-brand-orange/30 selection:text-brand-orange relative overflow-x-hidden">
      {/* Heavy noise overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"}}></div>
      {/* CRT Scanline overlay */}
      <div className="fixed inset-0 z-[100] pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.1)_51%)] bg-[length:100%_4px] opacity-20 mix-blend-overlay"></div>
      
      <Navbar />
      <main className="flex-grow pt-16 flex flex-col relative z-10 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
