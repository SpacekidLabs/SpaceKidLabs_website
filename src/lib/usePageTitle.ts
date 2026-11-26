import { useEffect } from 'react';

const SITE_NAME = 'SPACEKID LABS';

/**
 * Sets the browser tab title for the current page.
 * Pass a page name to get "Name — SPACEKID LABS", `undefined` for the plain site name,
 * or `null` to leave the title alone (when a child component sets it instead).
 */
export function usePageTitle(title: string | null | undefined) {
  useEffect(() => {
    if (title === null) return;
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
