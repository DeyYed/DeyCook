const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

function buildUrl(modelId, apiKey) {
  const u = new URL(`${BASE_URL}/models/${encodeURIComponent(modelId)}:generateContent`)
  u.searchParams.set('key', apiKey)
  return u.toString()
}

module.exports = async (_req, res) => {
  try {
    const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    const MODEL_ID = process.env.MODEL_ID || 'gemini-1.5-flash'
    const MOCK_MODE = process.env.MOCK_MODE === 'true' || !API_KEY

    if (MOCK_MODE) return res.status(200).json({ ok: true, model: 'mock', sample: 'Pong!' })

    const body = {
      contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
      generation_config: { temperature: 0.2 },
    }

    const r = await fetch(buildUrl(MODEL_ID, API_KEY), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return res.status(r.status).json({ ok: false, error: j?.error?.message || r.statusText })
    const txt = j?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
    return res.status(200).json({ ok: true, model: MODEL_ID, sample: txt.slice(0, 40) })
  } catch (err) {
    const status = err?.status || 500
    return res.status(status).json({ ok: false, error: err?.statusText || 'Ping failed' })
  }
}
