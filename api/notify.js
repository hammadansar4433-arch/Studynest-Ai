// Saves one row per visit into your Neon (Postgres) database.
// Needs the environment variable DATABASE_URL (Vercel adds it for you if you connect Neon from the Storage tab).
import { neon } from '@neondatabase/serverless';

let ready = false;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.DATABASE_URL) return res.status(204).end();

  const h = req.headers, b = req.body || {};
  const host = String(h.host || ''), from = String(h.origin || h.referer || '');
  if (from && !from.includes(host)) return res.status(204).end(); // ignore other websites

  const ua = String(h['user-agent'] || '');
  const device = /ipad|tablet/i.test(ua) ? 'Tablet' : /mobile|android|iphone/i.test(ua) ? 'Mobile' : 'Computer';
  const browser = /edg\//i.test(ua) ? 'Edge' : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : /firefox/i.test(ua) ? 'Firefox' : 'Other';
  let city = ''; try { city = decodeURIComponent(h['x-vercel-ip-city'] || ''); } catch (e) {}
  const vid = /^[a-z0-9-]{8,40}$/i.test(b.vid || '') ? b.vid : null;

  try {
    const sql = neon(process.env.DATABASE_URL);
    if (!ready) {
      await sql`CREATE TABLE IF NOT EXISTS visits (
        id bigserial PRIMARY KEY, ts timestamptz NOT NULL DEFAULT now(), vid text, is_new boolean,
        country text, city text, device text, browser text, cls text, ref text)`;
      ready = true;
    }
    await sql`INSERT INTO visits (vid, is_new, country, city, device, browser, cls, ref)
      VALUES (${vid}, ${!!b.n}, ${String(h['x-vercel-ip-country'] || '').slice(0, 2)}, ${city.slice(0, 60)}, ${device}, ${browser},
              ${String(b.c || '').slice(0, 12)}, ${String(b.r || '').slice(0, 120)})`;
  } catch (e) { console.error(e); }
  res.status(204).end();
}
