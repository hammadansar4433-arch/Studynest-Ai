import { GoogleGenAI } from '@google/genai';

// Tries models in order. Set GEMINI_MODEL in Vercel to force a specific one.
const MODELS = [process.env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'].filter(Boolean);
let good = null; // remembers the model that worked

const msg = e => String(e?.message || e);

export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;

  // Health check: open  /api/ai  (key present?)  or  /api/ai?test=1  (tries each model)
  if (req.method === 'GET') {
    if (!key) return res.status(200).json({ keyFound: false, fix: 'Add GEMINI_API_KEY in Vercel > Settings > Environment Variables, then Redeploy.' });
    if (!req.query?.test) return res.status(200).json({ keyFound: true, modelsToTry: MODELS });
    const ai = new GoogleGenAI({ apiKey: key });
    const results = {};
    for (const m of MODELS) {
      try { const r = await ai.models.generateContent({ model: m, contents: 'Reply with the single word OK' }); results[m] = 'works: ' + String(r.text).slice(0, 20); }
      catch (e) { results[m] = 'failed: ' + msg(e).slice(0, 160); }
    }
    return res.status(200).json({ keyFound: true, results });
  }

  if (req.method !== 'POST') return res.status(405).end();
  if (!key) return res.status(500).json({ error: 'no_key' });

  const contents = (req.body?.messages || []).slice(-10).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content).slice(0, 4000) }],
  }));
  if (!contents.length) return res.status(400).json({ error: 'empty' });

  const ai = new GoogleGenAI({ apiKey: key });
  const order = good ? [good, ...MODELS.filter(m => m !== good)] : MODELS;
  let last;
  for (const model of order) {
    try {
      const r = await ai.models.generateContent({ model, contents });
      good = model;
      return res.json({ text: r.text });
    } catch (e) {
      last = e;
      const m = msg(e);
      if (/API key|API_KEY|PERMISSION_DENIED|UNAUTHENTICATED|\b401\b|\b403\b/i.test(m)) return res.status(500).json({ error: 'bad_key' });
      if (/\b429\b|RESOURCE_EXHAUSTED|quota/i.test(m)) return res.status(429).json({ error: 'rate_limited' });
      // otherwise (404 / model not available) try the next model
    }
  }
  console.error(last);
  res.status(500).json({ error: 'model_unavailable', detail: msg(last).slice(0, 200) });
}
