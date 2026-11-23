
function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      configured: Boolean(
        process.env.AZURE_SPEECH_KEY &&
        process.env.AZURE_SPEECH_REGION
      )
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!key || !region) {
    return res.status(500).json({ error: 'speech_not_configured' });
  }

  const text = String(req.body?.text || '').trim();

  if (!text || text.length > 3000) {
    return res.status(400).json({ error: 'invalid_text' });
  }

  const ssml = `
    <speak version="1.0" xml:lang="ur-PK">
      <voice name="ur-PK-UzmaNeural" xml:lang="ur-PK">
        ${escapeXml(text)}
      </voice>
    </speak>
  `;

  try {
    const response = await fetch(
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'StudyNest-ZENO'
        },
        body: ssml
      }
    );

    if (!response.ok) {
      console.error('Azure speech error:', response.status);
      return res.status(502).json({ error: 'speech_generation_failed' });
    }

    const audio = Buffer.from(await response.arrayBuffer());

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(audio);

  } catch (error) {
    console.error('Speech request failed:', error);
    return res.status(500).json({ error: 'speech_server_error' });
  }
}
