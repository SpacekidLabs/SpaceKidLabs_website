/**
 * Contact settings. Messages go through the Netlify form named below (src/components/ContactForm.tsx).
 * Netlify finds the form in public/__forms.html at deploy time; keep its fields in step with SERVICES and
 * the inputs in ContactForm.
 */
export const CONTACT_FORM_NAME = 'contact';

/** Where the form posts. A real static file, so Netlify handles the POST before any redirect rule. */
export const CONTACT_FORM_ACTION = '/__forms.html';

export const SERVICES = [
  { value: 'production', label: 'Production' },
  { value: 'mixing', label: 'Mixing' },
  { value: 'mastering', label: 'Mastering' },
  { value: 'sound-design', label: 'Sound design / samples' },
  { value: 'software', label: 'Audio software' },
  { value: 'other', label: 'Something else' },
] as const;

export type Service = (typeof SERVICES)[number]['value'];

/**
 * The email address, put together only in the browser and only when the form fails, so it never appears in
 * the pre-rendered HTML or as one plain string in the JS bundle for address-scraping bots.
 */
export function contactEmail(): string {
  return ['SpaceKid700', 'gmail.com'].join('@');
}
