// Email + password accounts stored in Neon. Passwords are hashed (scrypt), never saved as text.
// Needs: DATABASE_URL (from Neon) and AUTH_SECRET (any long random text you choose) in Vercel.
import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const SECRET = process.env.AUTH_SECRET;
const MONTH = 30 * 864e5;
let ready = false;

const sign = s => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
const token = uid => { const p = Buffer.from(JSON.stringify({ u: uid, e: Date.now() + MONTH })).toString('base64url'); return p + '.' + sign(p); };
function who(req) {
  const m = /(?:^|;\s*)sn_session=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  const [p, sg] = m[1].split('.');
  if (!p || !sg) return null;
  const a = Buffer.from(sg), b = Buffer.from(sign(p));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const o = JSON.parse(Buffer.from(p, 'base64url').toString()); return o.e > Date.now() ? o.u : null; } catch (e) { return null; }
}
const hash = async pw => { const salt = crypto.randomBytes(16).toString('hex'); return salt + ':' + (await scrypt(pw, salt, 64)).toString('hex'); };
async function check(pw, stored) {
  const [salt, h] = String(stored || 'x:y').split(':');
  const a = await scrypt(pw, salt || 'x', 64), b = Buffer.from(h || '', 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const cookie = (req, v, age) => `sn_session=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}` + (String(req.headers['x-forwarded-proto']).includes('https') ? '; Secure' : '');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.DATABASE_URL || !SECRET) return res.status(200).json({ error: 'not_configured' });
  const sql = neon(process.env.DATABASE_URL);
  if (!ready) {
    await sql`CREATE TABLE IF NOT EXISTS users (id bigserial PRIMARY KEY, email text UNIQUE NOT NULL, name text, pass_hash text NOT NULL,
      fails int NOT NULL DEFAULT 0, locked_until timestamptz, created_at timestamptz NOT NULL DEFAULT now(), last_login timestamptz, data jsonb, data_updated timestamptz)`;
    ready = true;
  }
  const bad = (code, msg) => res.status(code).json({ msg });
  try {
    if (req.method === 'GET') {
      const uid = who(req);
      if (!uid) return res.json({ user: null });
      const [u] = await sql`SELECT id, email, name FROM users WHERE id = ${uid}`;
      return res.json({ user: u ? { email: u.email, name: u.name } : null });
    }
    if (req.method !== 'POST') return res.status(405).end();
    const host = String(req.headers.host || ''), from = String(req.headers.origin || req.headers.referer || '');
    if (from && !from.includes(host)) return bad(403, 'Not allowed');
    const b = req.body || {}, a = b.a;

    if (a === 'signup') {
      const email = String(b.email || '').trim().toLowerCase(), pw = String(b.password || '');
      if (!/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) return bad(400, 'Please enter a valid email address.');
      if (pw.length < 8 || pw.length > 100) return bad(400, 'Password must be at least 8 characters.');
      try {
        const [u] = await sql`INSERT INTO users (email, name, pass_hash, last_login) VALUES (${email}, ${String(b.name || '').slice(0, 40)}, ${await hash(pw)}, now()) RETURNING id, email, name`;
        res.setHeader('Set-Cookie', cookie(req, token(u.id), MONTH / 1000));
        return res.json({ user: { email: u.email, name: u.name } });
      } catch (e) {
        if (e?.code === '23505' || /duplicate|unique/i.test(String(e?.message))) return bad(409, 'An account with this email already exists. Please log in instead.');
        throw e;
      }
    }
    if (a === 'login') {
      const email = String(b.email || '').trim().toLowerCase(), pw = String(b.password || '').slice(0, 100);
      const [u] = await sql`SELECT id, email, name, pass_hash, fails, locked_until FROM users WHERE email = ${email}`;
      if (u?.locked_until && new Date(u.locked_until) > new Date()) return bad(429, 'Too many wrong attempts. Try again in 10 minutes.');
      const ok = await check(pw, u?.pass_hash); // runs even when the email is unknown, so timing does not reveal accounts
      if (!u || !ok) {
        if (u) { const f = (u.fails || 0) + 1; await sql`UPDATE users SET fails = ${f >= 5 ? 0 : f}, locked_until = ${f >= 5 ? new Date(Date.now() + 10 * 6e4).toISOString() : null} WHERE id = ${u.id}`; }
        return bad(401, 'Wrong email or password.');
      }
      await sql`UPDATE users SET fails = 0, locked_until = NULL, last_login = now() WHERE id = ${u.id}`;
      res.setHeader('Set-Cookie', cookie(req, token(u.id), MONTH / 1000));
      return res.json({ user: { email: u.email, name: u.name } });
    }
    if (a === 'logout') { res.setHeader('Set-Cookie', cookie(req, '', 0)); return res.json({ ok: true }); }

    const uid = who(req);
    if (!uid) return bad(401, 'Please log in again.');
    if (a === 'load') { const [u] = await sql`SELECT data FROM users WHERE id = ${uid}`; return res.json({ data: u?.data || null }); }
    if (a === 'save') {
      const d = b.data;
      if (!d || typeof d !== 'object') return bad(400, 'Bad data');
      const s = JSON.stringify(d);
      if (s.length > 300000) return bad(413, 'Data too large');
      await sql`UPDATE users SET data = ${s}::jsonb, name = coalesce(nullif(${String(d.name || '').slice(0, 40)}, ''), name), data_updated = now() WHERE id = ${uid}`;
      return res.json({ ok: true });
    }
    if (a === 'delete') { await sql`DELETE FROM users WHERE id = ${uid}`; res.setHeader('Set-Cookie', cookie(req, '', 0)); return res.json({ ok: true }); }
    return bad(400, 'Unknown action');
  } catch (e) { console.error(e); return bad(500, 'Something went wrong. Please try again.'); }
}
