/**
 * Contact form messages, kept in D1 (same database as the idea inbox) so the /dev Messages tab can show them with an
 * answered / not answered state. Saved before the email is sent, so a failed email doesn't lose a message.
 * Kept for 12 months at most (deleted when the list is read), or until deleted in the dashboard. /privacy says so.
 */
import { dbReady, ideasDb, type IdeasEnv } from './ideas';

export const KEEP_DAYS = 365;

export interface ContactMessage {
  id: string; created: number; name: string; email: string; service: string; links: string; page: string; message: string;
  answered: number | null;
}

export class MessageError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function db(env: IdeasEnv) {
  const d = ideasDb(env);
  await dbReady();
  return d;
}

export async function saveMessage(env: IdeasEnv, m: Omit<ContactMessage, 'id' | 'created' | 'answered'>): Promise<string> {
  const d = await db(env);
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  await d.prepare('INSERT INTO messages (id, created, name, email, service, links, page, message, answered) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)')
    .bind(id, Date.now(), m.name, m.email, m.service, m.links, m.page, m.message).run();
  return id;
}

/** Unanswered (oldest first, so the longest wait is on top) or answered (newest first). Deletes expired ones first. */
export async function listMessages(env: IdeasEnv, status: unknown) {
  const d = await db(env);
  await d.prepare('DELETE FROM messages WHERE created < ?').bind(Date.now() - KEEP_DAYS * 86_400_000).run();
  const answered = status === 'answered';
  const messages = (await d.prepare(
    answered ? 'SELECT * FROM messages WHERE answered IS NOT NULL ORDER BY created DESC LIMIT 200'
      : 'SELECT * FROM messages WHERE answered IS NULL ORDER BY created ASC LIMIT 200',
  ).all<ContactMessage>()).results;
  return { messages, count: await messageCounts(env) };
}

export async function messageCounts(env: IdeasEnv) {
  const d = await db(env);
  const r = await d.prepare('SELECT SUM(answered IS NULL) AS open, SUM(answered IS NOT NULL) AS answered, MIN(CASE WHEN answered IS NULL THEN created END) AS oldest FROM messages')
    .first<{ open: number | null; answered: number | null; oldest: number | null }>();
  return { unanswered: r?.open ?? 0, answered: r?.answered ?? 0, oldestUnanswered: r?.oldest ?? null };
}

export async function markMessage(env: IdeasEnv, input: Record<string, unknown>) {
  const d = await db(env);
  const r = await d.prepare('UPDATE messages SET answered = ? WHERE id = ?').bind(input.answered ? Date.now() : null, String(input.id ?? '')).run();
  if (!r.meta.changes) throw new MessageError(404, 'No such message');
  return { ok: true };
}

export async function deleteMessage(env: IdeasEnv, id: unknown) {
  const d = await db(env);
  const r = await d.prepare('DELETE FROM messages WHERE id = ?').bind(String(id ?? '')).run();
  if (!r.meta.changes) throw new MessageError(404, 'No such message');
  return { ok: true };
}
