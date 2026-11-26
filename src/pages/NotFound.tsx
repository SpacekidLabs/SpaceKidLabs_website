import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { usePageTitle } from '../lib/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <Layout>
      <div className="flex-grow flex items-center justify-center px-6 py-32">
        <div className="text-center max-w-md">
          <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">
            // ERROR 404: SIGNAL LOST
          </p>
          <h1 className="font-display font-black text-5xl md:text-6xl text-white tracking-tight mb-6">
            Nothing here
          </h1>
          <p className="text-zinc-400 mb-10">
            This page doesn't exist, or it moved. Try the archive or head back home.
          </p>
          <div className="flex items-center justify-center gap-4 font-mono text-xs uppercase tracking-wider">
            <Link to="/" className="px-5 py-3 bg-brand-orange text-black font-bold hover:bg-brand-gold transition-colors">
              Home
            </Link>
            <Link to="/archive" className="px-5 py-3 border border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors">
              Archive
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
