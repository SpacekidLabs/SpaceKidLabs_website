import { useId, useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { CONTACT_FORM_ACTION, CONTACT_FORM_NAME, SERVICES, contactEmail, type Service } from '../data/contact';

type Status = 'idle' | 'sending' | 'sent' | 'error';

interface Props {
  /** Pass both to control the service from outside (e.g. "Ask about mixing" links on the Services page). */
  service?: Service | '';
  onServiceChange?: (service: Service | '') => void;
}

const fieldClass =
  'w-full bg-black/60 border border-zinc-700 px-4 py-3 font-sans text-white placeholder:text-zinc-600 ' +
  'focus:border-brand-orange focus:outline-none transition-colors';
const labelClass = 'block font-mono text-xs uppercase tracking-widest text-zinc-400 mb-2';

/**
 * Contact form, sent through Netlify Forms (no backend). Submissions are emailed via the form notification
 * set up in the Netlify dashboard. See src/data/contact.ts.
 */
export function ContactForm({ service: controlledService, onServiceChange }: Props) {
  const id = useId();
  const [ownService, setOwnService] = useState<Service | ''>('');
  const service = controlledService ?? ownService;
  const setService = onServiceChange ?? setOwnService;
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    data.set('form-name', CONTACT_FORM_NAME);
    data.set('page', window.location.pathname);
    setStatus('sending');
    try {
      const res = await fetch(CONTACT_FORM_ACTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data as unknown as Record<string, string>).toString(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      setService('');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="border border-brand-orange/40 bg-brand-orange/5 p-8 text-center">
        <CheckCircle2 className="w-8 h-8 text-brand-orange mx-auto mb-4" aria-hidden />
        <p className="font-display font-bold text-white uppercase tracking-widest mb-2">Message sent</p>
        <p className="font-sans font-light text-zinc-400 mb-6">Thanks. I'll get back to you by email, usually within a few days.</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="font-mono text-sm text-brand-orange hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  const sending = status === 'sending';

  return (
    <form
      name={CONTACT_FORM_NAME}
      method="POST"
      action={CONTACT_FORM_ACTION}
      onSubmit={handleSubmit}
      className="grid gap-5 text-left"
    >
      <input type="hidden" name="form-name" value={CONTACT_FORM_NAME} />
      {/* Honeypot: hidden from people, filled in by bots; Netlify drops any submission that has it. */}
      <p className="hidden" aria-hidden>
        <label>
          Leave this empty: <input name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className={labelClass}>Name</label>
          <input id={`${id}-name`} name="name" required autoComplete="name" className={fieldClass} />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className={labelClass}>Email</label>
          <input id={`${id}-email`} name="email" type="email" required autoComplete="email" className={fieldClass} />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-service`} className={labelClass}>What it's about</label>
        <select
          id={`${id}-service`}
          name="service"
          required
          value={service}
          onChange={e => setService(e.target.value as Service | '')}
          className={fieldClass}
        >
          <option value="" disabled>Choose one…</option>
          {SERVICES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${id}-message`} className={labelClass}>Message</label>
        <textarea
          id={`${id}-message`}
          name="message"
          required
          rows={6}
          placeholder="What you're working on, what you need, and your deadline."
          className={`${fieldClass} resize-y`}
        />
      </div>

      <div>
        <label htmlFor={`${id}-links`} className={labelClass}>
          Links <span className="normal-case tracking-normal text-zinc-600">(optional: demo, references, stems)</span>
        </label>
        <input id={`${id}-links`} name="links" placeholder="https://…" className={fieldClass} />
      </div>

      {status === 'error' && (
        <p role="alert" className="font-sans text-sm text-red-400">
          The message didn't go through. Please try again, or email{' '}
          <a href={`mailto:${contactEmail()}`} className="text-brand-orange hover:underline">{contactEmail()}</a>.
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-3 px-8 py-4 border border-brand-orange text-brand-orange font-bold uppercase tracking-widest text-sm hover:bg-brand-orange hover:text-black transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />}
          {sending ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  );
}
