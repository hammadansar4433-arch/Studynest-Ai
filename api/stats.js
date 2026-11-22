// Private numbers for admin.html. Needs DATABASE_URL and ADMIN_KEY (a password you choose) in Vercel.
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const admin = process.env.ADMIN_KEY;
  if (!admin || !process.env.DATABASE_URL) return res.status(500).json({ error: 'Add ADMIN_KEY and DATABASE_URL in Vercel, then redeploy.' });
  if (String(req.query?.key || '') !== admin) return res.status(401).json({ error: 'Wrong key' });
  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS visits (
      id bigserial PRIMARY KEY, ts timestamptz NOT NULL DEFAULT now(), vid text, is_new boolean,
      country text, city text, device text, browser text, cls text, ref text)`;
    const [tot] = await sql`SELECT count(*)::int AS visits, count(DISTINCT vid)::int AS people,
      count(*) FILTER (WHERE (ts AT TIME ZONE 'Asia/Karachi')::date = (now() AT TIME ZONE 'Asia/Karachi')::date)::int AS today,
      count(*) FILTER (WHERE ts > now() - interval '7 days')::int AS week FROM visits`;
    await sql`CREATE TABLE IF NOT EXISTS users (id bigserial PRIMARY KEY, email text UNIQUE NOT NULL, name text, pass_hash text NOT NULL,
      fails int NOT NULL DEFAULT 0, locked_until timestamptz, created_at timestamptz NOT NULL DEFAULT now(), last_login timestamptz, data jsonb, data_updated timestamptz)`;
    if (req.query?.csv) {
      const u = await sql`SELECT email, name, created_at, last_login FROM users ORDER BY created_at`;
      const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      return res.send('email,name,signed_up,last_login\n' + u.map(r => [r.email, r.name, r.created_at, r.last_login].map(q).join(',')).join('\n'));
    }
    const [uc] = await sql`SELECT count(*)::int AS total, count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS week FROM users`;
    const signups = await sql`SELECT to_char(created_at AT TIME ZONE 'Asia/Karachi', 'DD Mon HH24:MI') AS t, email, name FROM users ORDER BY created_at DESC LIMIT 30`;
    const days = await sql`SELECT to_char((ts AT TIME ZONE 'Asia/Karachi')::date, 'DD Mon') AS d, count(*)::int AS n
      FROM visits WHERE ts > now() - interval '14 days' GROUP BY (ts AT TIME ZONE 'Asia/Karachi')::date ORDER BY (ts AT TIME ZONE 'Asia/Karachi')::date`;
    const top = async col => col === 'country' ? await sql`SELECT coalesce(nullif(country,''),'?') AS k, count(*)::int AS n FROM visits GROUP BY 1 ORDER BY n DESC LIMIT 8`
      : col === 'device' ? await sql`SELECT device AS k, count(*)::int AS n FROM visits GROUP BY 1 ORDER BY n DESC LIMIT 8`
      : await sql`SELECT coalesce(nullif(cls,''),'not chosen') AS k, count(*)::int AS n FROM visits GROUP BY 1 ORDER BY n DESC LIMIT 8`;
    const recent = await sql`SELECT to_char(ts AT TIME ZONE 'Asia/Karachi', 'DD Mon HH24:MI') AS t, is_new, country, city, device, browser, cls, ref
      FROM visits ORDER BY ts DESC LIMIT 30`;
    res.json({ ...tot, users: uc, signups, days, countries: await top('country'), devices: await top('device'), classes: await top('cls'), recent });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Database error: ' + String(e.message || e).slice(0, 150) }); }
}
