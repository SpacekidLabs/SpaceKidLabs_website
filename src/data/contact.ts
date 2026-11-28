/**
 * Contact settings. The form (src/components/ContactForm.tsx) posts to the Cloudflare Worker in worker/index.ts,
 * which emails the message. Keep SERVICES in step with the list in the Worker.
 */
export const CONTACT_FORM_ACTION = '/api/contact';

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
