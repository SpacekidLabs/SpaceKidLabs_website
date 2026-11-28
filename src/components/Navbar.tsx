import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Headphones, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when routing occurs
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Prevent background scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Keyboard: Esc closes the menu and returns focus to the button; Tab stays inside the open menu.
  useEffect(() => {
    if (!isOpen) return;
    menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || !menuRef.current) return;
      const items = [toggleRef.current, ...menuRef.current.querySelectorAll<HTMLElement>('a')].filter(Boolean) as HTMLElement[];
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
      e.preventDefault();
      items[next].focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const navLinks = [
    { label: 'MUSIC', path: '/#featured', isExternal: true },
    { label: 'SERVICES', path: '/services', isExternal: false },
    { label: 'SAMPLES', path: '/samples', isExternal: false },
    { label: 'SKETCHES', path: '/sketches', isExternal: false },
    { label: 'SOFTWARE', path: '/#code', isExternal: true },
    { label: 'ARCHIVE', path: '/archive', isExternal: false },
    { label: 'CONTACT', path: '/#contact', isExternal: true },
  ];

  return (
    <nav aria-label="Main" className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-brand-dark/60 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group z-50">
          <Headphones className="w-5 h-5 text-brand-orange group-hover:animate-pulse" aria-hidden="true" />
          <span className="font-display font-bold text-base md:text-xl tracking-widest text-white">
            SPACEKID
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            link.isExternal ? (
              <a
                key={link.label}
                href={link.path}
                className="text-sm font-mono tracking-wide text-zinc-400 hover:text-brand-orange transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.path}
                className="text-sm font-mono tracking-wide text-zinc-400 hover:text-brand-orange transition-colors"
              >
                {link.label}
              </Link>
            )
          ))}
          <Link
            to="/download"
            className={cn(
              "px-4 py-1.5 text-sm font-mono tracking-wide border transition-all duration-200 uppercase",
              location.pathname === '/download' 
                ? "border-brand-orange bg-brand-orange/10 text-brand-orange box-glow" 
                : "border-brand-orange text-brand-orange hover:bg-brand-orange focus:bg-brand-orange focus:text-black hover:text-black"
            )}
          >
            DATABEND
          </Link>
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="flex md:hidden items-center gap-4 z-50">
          <Link
            to="/download"
            className={cn(
              "px-3 py-1 text-xs font-mono tracking-wide border transition-all duration-200 uppercase",
              location.pathname === '/download' 
                ? "border-brand-orange bg-brand-orange/10 text-brand-orange box-glow" 
                : "border-brand-orange border-opacity-70 text-brand-orange hover:bg-brand-orange hover:text-black"
            )}
          >
            DATABEND
          </Link>
          <button
            ref={toggleRef}
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 -m-1 text-zinc-400 hover:text-brand-orange transition-colors"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-0 top-16 bg-black z-40 md:hidden flex flex-col justify-between py-12 px-8"
          >
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex flex-col space-y-6"
            >
              <div aria-hidden="true" className="text-[10px] font-mono text-zinc-600 tracking-widest uppercase mb-2 border-b border-white/5 pb-2">
                INDEX SYSTEM // NAVIGATION
              </div>
              {navLinks.map((link, idx) => (
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  key={link.label}
                >
                  {link.isExternal ? (
                    <a
                      href={link.path}
                      onClick={() => setIsOpen(false)}
                      className="text-2xl font-display font-black tracking-widest text-zinc-300 hover:text-brand-orange uppercase transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className="text-2xl font-display font-black tracking-widest text-zinc-300 hover:text-brand-orange uppercase transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="border-t border-white/5 pt-6 text-center"
            >
              <div className="text-[9px] font-mono text-zinc-600 tracking-widest">
                SPACEKID CREATIVE PORTFOLIO v2.6 // OFF-GRID RUNTIME
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
