import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {execSync} from 'node:child_process';
import {defineConfig} from 'vite';

/** The commit this build is made from, shown on /dev to tell whether the live site is up to date. */
function buildCommit(): string {
  if (process.env.WORKERS_CI_COMMIT_SHA) return process.env.WORKERS_CI_COMMIT_SHA; // set by Cloudflare Workers Builds
  try {
    return execSync('git rev-parse HEAD', {stdio: ['ignore', 'pipe', 'ignore']}).toString().trim();
  } catch {
    return '';
  }
}

export default defineConfig(() => {
  return {
    define: {
      __BUILD_COMMIT__: JSON.stringify(buildCommit()),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
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
