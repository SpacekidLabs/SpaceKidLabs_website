/**
 * Build-time rendering, used by scripts/prerender.ts (never shipped to the browser).
 * Renders one URL to HTML, waiting for lazy-loaded pages and labs to finish.
 */
import { StrictMode } from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom';
import { AppRoutes } from './App';

export { POSTS } from './posts';

export async function render(url: string): Promise<string> {
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </StrictMode>,
  );
  let html = '';
  for await (const chunk of prelude) html += chunk;
  return html;
}
