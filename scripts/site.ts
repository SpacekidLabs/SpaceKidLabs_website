/** Shared settings for the build scripts. */

/** The site's public address. Set SITE_URL to build for another address (e.g. a preview). */
export const SITE_URL = (process.env.SITE_URL || 'https://spacekidlabs.com').replace(/\/$/, '');

export const SITE_NAME = 'SPACEKID LABS';

export const DEFAULT_DESCRIPTION =
  'Experimental audio research, music production and interactive DSP experiments by SPACEKID.';

/** Pages that aren't archive posts. Keep in sync with the routes in src/App.tsx. */
export const STATIC_PAGES: Array<{ path: string; title?: string; description: string }> = [
  { path: '/', description: DEFAULT_DESCRIPTION },
  {
    path: '/archive',
    title: 'Archive',
    description:
      'A log of thoughts, esoteric tools, recommended reading, and unorganized debris from the production process, with interactive audio labs.',
  },
  {
    path: '/samples',
    title: 'Samples',
    description:
      'Sample packs by SPACEKID, including the DataBend Process Pack. Not pristine. Not genre-correct. Just useful chaos. Preview every sample in the browser.',
  },
  {
    path: '/sketches',
    title: 'Sketches',
    description: 'Rough demos and loose ideas by SPACEKID. Unfinished on purpose.',
  },
  { path: '/services', title: 'Services', description:
      'Music production, mixing, mastering, sound design and audio software by SPACEKID: examples of the work, how a project runs, and how to get a quote.' },
  {
    path: '/download',
    title: 'Download',
    description:
      'Download DATABEND, an offline experimental audio destroyer for glitch, noise and sound design.',
  },
  {
    path: '/privacy',
    title: 'Privacy',
    description: 'What spacekidlabs.com collects and what it doesn\'t: no cookies, no ads, no trackers, nothing sold or shared.',
  },
  {
    path: '/waveset-quantizer',
    title: 'Waveset Quantizer',
    description:
      'Audio cycles are clustered using K-Means and rebuilt from their centroids, creating metallic hybrid timbres. Runs in the browser.',
  },
];
