import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { usePageTitle } from '../lib/usePageTitle';

/**
 * /privacy: what the site collects and what it doesn't. Keep it true to the code: if the site starts storing,
 * counting or loading something new, update this page and LAST_UPDATED. Event counts (#19) are worker/events.ts.
 */

const LAST_UPDATED = '28 November 2026';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display font-bold text-xl text-white">{title}</h2>
      <div className="space-y-3 font-sans font-light text-zinc-300 leading-relaxed">{children}</div>
    </section>
  );
}

const ext = 'text-brand-orange hover:underline';

export function PrivacyPage() {
  usePageTitle('Privacy');
  return (
    <Layout>
      <div className="pt-24 pb-24 max-w-3xl mx-auto px-6 w-full">
        <Link to="/" className="inline-block text-zinc-400 hover:text-white font-mono text-sm uppercase tracking-widest transition-colors mb-10">
          ← Home
        </Link>
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">// Last updated {LAST_UPDATED}</p>
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-widest text-white uppercase mb-6">Privacy</h1>
        <p className="font-sans font-light text-zinc-300 text-lg leading-relaxed mb-12">
          The short version: no cookies, no ads, no trackers, and nothing is sold or shared. Here's exactly what happens.
        </p>

        <div className="space-y-12">
          <Section title="Traffic numbers">
            <p>
              The site is hosted on Cloudflare. Cloudflare counts requests as they reach its servers, and I see totals
              only: how many visitors and page views per day, which pages, which countries and which browsers. There's no
              tracking script and no cookie, and I can't see or follow individual visitors.
            </p>
            <p>
              Cloudflare handles the connection itself under its own{' '}
              <a className={ext} href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">privacy policy</a>.
            </p>
          </Section>

          <Section title="Plays and downloads">
            <p>
              The site counts a few actions: playing or downloading a sample, downloading a pack or DATABEND, starting a
              lab, and sending the contact form. Each one adds one to a counter, together with which sample, pack, lab
              or file it was. Nothing else is stored with it: no cookie, no IP address, no browser details and no id, so
              a count can't be traced back to you or linked to your other visits.
            </p>
            <p>
              The counters live in Cloudflare (Workers Analytics Engine) and are kept for three months. I see totals,
              like "this sample was played 40 times this week".
            </p>
          </Section>

          <Section title="The contact form">
            <p>
              When you send a message, what you typed (name, email, what it's about, message and any links) and the page
              you sent it from are emailed to me. The site doesn't keep a copy. I use it only to reply, and I'll delete
              our emails if you ask.
            </p>
          </Section>

          <Section title="In your browser">
            <p>
              The site stores nothing in your browser: no cookies, no local storage. Audio you load into a lab or tool is
              processed on your own device and never uploaded.
            </p>
          </Section>

          <Section title="Other services you might reach">
            <ul className="list-disc pl-6 space-y-2 marker:text-brand-orange/60">
              <li>
                <strong className="font-medium text-zinc-200">YouTube and Spotify:</strong> on pages with music, the video
                preview images load from YouTube. The players themselves load only when you press play; YouTube videos use
                its privacy-enhanced (no-cookie) mode.
              </li>
              <li>
                <strong className="font-medium text-zinc-200">Downloads:</strong> sample downloads come from Google Drive,
                and DATABEND downloads come from GitHub.
              </li>
              <li>
                <strong className="font-medium text-zinc-200">Links:</strong> links to other sites open those sites, with
                their own rules.
              </li>
            </ul>
            <p>Those services follow their own privacy policies.</p>
          </Section>

          <Section title="Owner tools">
            <p>
              The /dev page is a dashboard for the site's owner. Logging in to it sets one cookie, used only to keep the
              owner logged in. Visitors never get it.
            </p>
          </Section>

          <Section title="Questions">
            <p>
              Ask anything through the <Link className={ext} to="/#contact">contact form</Link>.
            </p>
          </Section>
        </div>
      </div>
    </Layout>
  );
}
