export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'MINIMAX_API_KEY not configured on the server.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { prompt } = body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  let minimaxRes;
  try {
    minimaxRes = await fetch('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 4096,
        temperature: 0.3
      })
    });
  } catch (e) {
    return res.status(502).json({ error: `Network error: ${e.message}` });
  }

  const rawText = await minimaxRes.text();

  if (!minimaxRes.ok) {
    return res.status(502).json({ error: `MiniMax error ${minimaxRes.status}: ${rawText.slice(0, 400)}` });
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    return res.status(502).json({ error: `Non-JSON response: ${rawText.slice(0, 400)}` });
  }

  const result = data.choices?.[0]?.message?.content ?? '';
  if (!result) {
    return res.status(502).json({ error: `Empty result. Keys: ${JSON.stringify(Object.keys(data))}` });
  }

  return res.status(200).json({ result });
}
