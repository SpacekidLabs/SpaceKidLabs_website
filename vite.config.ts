import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Never inline font files into the CSS; browsers only download the character sets a page needs.
      assetsInlineLimit: (file: string) => (/\.woff2?$/.test(file) ? false : undefined),
      rollupOptions: {
        output: {
          // Libraries change far less often than the site, so give them their own files.
          // After a site update, returning visitors only re-download the parts that changed.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return 'react';
            if (/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion';
            // Keep the icons used across the site in one small file instead of dozens of tiny ones.
            if (id.includes('node_modules/lucide-react/')) return 'icons';
          },
        },
      },
    },
  };
});
