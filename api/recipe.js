const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

function buildUrl(modelId, apiKey) {
  const u = new URL(`${BASE_URL}/models/${encodeURIComponent(modelId)}:generateContent`)
  u.searchParams.set('key', apiKey)
  return u.toString()
}

async function callGeminiREST({ apiKey, modelId, systemInstruction, prompt, structured = false, responseSchema }) {
  const body = {
    contents: [
      { role: 'user', parts: [{ text: prompt }] },
    ],
    system_instruction: { role: 'system', parts: [{ text: systemInstruction }] },
    generation_config: {
      temperature: 0.7,
      ...(structured ? { response_mime_type: 'application/json', response_schema: responseSchema } : {}),
    },
  }

  const resp = await fetch(buildUrl(modelId, apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    const err = new Error(json?.error?.message || resp.statusText || 'Gemini API error')
    err.status = resp.status
    err.statusText = json?.error?.message || resp.statusText
    err.errorDetails = json?.error?.details
    throw err
  }
  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
  return text
}

const responseSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    time: { type: 'string' },
    servings: { type: 'integer' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, quantity: { type: 'string' } },
        required: ['name'],
      },
    },
    steps: { type: 'array', items: { type: 'string' } },
    extrasMentioned: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'summary', 'time', 'servings', 'ingredients', 'steps'],
}

const SYSTEM_INSTRUCTION = `You are a professional 5-star chef AI.
Return ONLY JSON (no markdown, no commentary).

Goal and order:
1) Provide a concise, refined description of the dish that will be made (summary). Include flavor profile, texture, key techniques, and presentation.
2) Then list the ingredients with practical kitchen quantities and sizes.
3) Then provide clear and detailed step-by-step instructions.

Validation & normalization:
- Correct obvious typos in ingredient names (e.g., "tomto" -> "tomato").
- Ignore non-food/random words (e.g., people names like "Dey Dey").
- If after correction fewer than 2 valid ingredients remain, do not generate a recipe. Return this minimal object instead:
  {"title":"Invalid ingredients","summary":"No valid ingredients detected. Please provide real food ingredients.","time":"-","servings":0,"ingredients":[],"steps":["No recipe can be made with the provided inputs."],"extrasMentioned":[]}

Rules:
- Use all ingredients provided by the user
- Use only the provided ingredients as the core. If additions are needed, allow a maximum of 2 very common pantry items (e.g. salt, pepper, oil, stock, herbs). Do not introduce uncommon or luxury extras. If you add extras, include them in extrasMentioned and also in ingredients with quantities.
- Fields to produce: title, summary, time, servings, ingredients (array of { name, quantity }), steps (array of strings), extrasMentioned (array of strings).
- Do NOT prefix steps with numbers or bullets; the client will number them.
- Keep tone concise and refined.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  // Default model updated to Gemini 2.5 Flash Lite
  const MODEL_ID = process.env.MODEL_ID || 'gemini-2.5-flash-lite'
  const YT_KEY = process.env.YOUTUBE_API_KEY

  try {
    // Body parsing guard for Vercel Node functions
    async function getParsedBody(rq) {
      if (!rq) return {}
      if (typeof rq.body === 'object' && rq.body !== null) return rq.body
      if (typeof rq.body === 'string') {
        try { return JSON.parse(rq.body) } catch { return {} }
      }
      // Fallback: read stream
      const chunks = []
      for await (const chunk of rq) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return {}
      try { return JSON.parse(raw) } catch { return {} }
    }

  const body = await getParsedBody(req)
  if (!API_KEY) return res.status(500).json({ error: 'Missing GOOGLE_API_KEY' })
    const { ingredients, includeVideo } = body

    let list = []
    if (Array.isArray(ingredients)) list = ingredients
    else if (typeof ingredients === 'string') list = ingredients.split(/\n|,|;|\||·|•|—|–|\t/)
    else if (Array.isArray(body)) list = body

    list = list.map((i) => String(i ?? '').trim()).filter(Boolean)
    if (list.length < 1) {
      return res.status(400).json({ error: 'ingredients is required as array or comma/newline string', received: body })
    }

    const userList = list.map((i) => `- ${String(i).trim()}`).join('\n')

    let videoMeta = null
    if (includeVideo && YT_KEY) {
      try {
        const query = encodeURIComponent(list.slice(0,6).join(' ')+ ' recipe')
        const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${query}&key=${YT_KEY}`
        const ytResp = await fetch(ytUrl)
        const ytJson = await ytResp.json().catch(()=>({}))
        const item = ytJson?.items?.[0]
        if (item?.id?.videoId) {
          videoMeta = {
            id: item.id.videoId,
            title: item.snippet?.title || '',
            channel: item.snippet?.channelTitle || '',
            description: (item.snippet?.description || '').slice(0, 800),
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
          }
        }
      } catch (e) {
        console.warn('[youtube] search failed:', e?.message)
      }
    }

    function cleanVideoTitle(raw) {
      if (!raw) return ''
      let t = raw
      // Remove common YouTube clutter
  t = t.replace(/official video|full tutorial|easy recipe|\brecipe\b|how to (?:make|cook)\b/gi, '')
      t = t.replace(/\b(best|easy|ultimate|perfect|quick|simple|homemade|authentic)\b/gi, '')
      t = t.replace(/\[[^\]]+\]|\([^)]*\)|\{[^}]*\}/g, '') // remove bracketed
      t = t.replace(/[#@].+$/g, '')
      t = t.replace(/[-–—_.]+/g, ' ')
      t = t.replace(/\s{2,}/g, ' ').trim()
      // Capitalize first letters
      t = t.split(' ').map(w => w ? w[0].toUpperCase()+w.slice(1).toLowerCase() : w).join(' ')
      // Remove trailing generic words
      t = t.replace(/\b(Recipe|Video|Tutorial)\b$/i, '').trim()
      return t || raw
    }

  const videoContext = videoMeta ? `\nA relevant YouTube cooking tutorial was found. Use it as authoritative style guidance. VIDEO TITLE: ${videoMeta.title}\nCHANNEL: ${videoMeta.channel}\nVIDEO DESCRIPTION (may contain extra or missing ingredients, adapt intelligently):\n"""${videoMeta.description}"""\nAdjust steps to reflect professional best practice while respecting the user's ingredient list primarily. If the video introduces additional common ingredients that substantially improve the dish, you MAY add up to 3 of them, listing them ALSO inside extrasMentioned. If any of the user's ingredients are absent from the video but still compatible, incorporate them logically. Provide a short adaptation note explaining deviations.` : ''

  const userPrompt = `Ingredients:\n${userList}\n${includeVideo ? '\nUser requested video-guided recipe generation (may add or omit some items to align with tutorial).':''}\n\nConstraints:\n- Correct obvious typos in ingredient names and ignore non-food/random words.\n- If fewer than 2 valid ingredients remain after correction, produce the minimal refusal object specified in the system instructions.\n- Output JSON ONLY with fields: title (string), summary (string), time (string), servings (number), ingredients (array of { name, quantity? }), steps (string[]), extrasMentioned (string[]), adaptationNote (string optional).\n- Ingredients: include the provided items; add minimal pantry items only if needed. Provide quantities in common kitchen units (g, ml, tsp, tbsp, cups, pieces).\n- Servings: default to 2 if unspecified.\n- Time: realistic estimate.\n- Steps: clear instructions as an array of strings (do NOT include leading numbers or bullets; the client will number them).${videoContext}`

  // Live API only

    let text
    try {
      text = await callGeminiREST({ apiKey: API_KEY, modelId: MODEL_ID, systemInstruction: SYSTEM_INSTRUCTION, prompt: userPrompt, structured: true, responseSchema })
    } catch (err) {
      const fallbackPrompt = `${userPrompt}\n\nReturn ONLY a valid JSON object with these fields: {"title":"","summary":"","time":"","servings":2,"ingredients":[{"name":"","quantity":""}],"steps":["..."],"extrasMentioned":["..."]}`
      text = await callGeminiREST({ apiKey: API_KEY, modelId: MODEL_ID, systemInstruction: SYSTEM_INSTRUCTION, prompt: fallbackPrompt, structured: false })
    }

  let data
    try { data = JSON.parse(text) } catch {
      const match = text.match(/\{[\s\S]*\}/)
      data = match ? JSON.parse(match[0]) : null
    }

  if (!data) return res.status(502).json({ error: 'Invalid model response', raw: text })
  if (videoMeta) {
    data.video = videoMeta
    if (includeVideo && !data.adaptationNote) {
      data.adaptationNote = 'Recipe adapted using a YouTube tutorial; minor ingredient adjustments may have been applied.'
    }
    // Override title from cleaned video title if we can extract a concise dish name
    const cleaned = cleanVideoTitle(videoMeta.title)
    if (cleaned && typeof data.title === 'string' && cleaned.length <= 70) {
      data.title = cleaned
    }
  }
  data.includeVideo = !!includeVideo
  res.setHeader('Content-Type', 'application/json')
  return res.status(200).json(data)
  } catch (err) {
    const status = err?.status || 500
    const payload = { error: err?.statusText || 'Failed to generate recipe' }
    if (err?.errorDetails) payload.details = err.errorDetails
    if (status === 403) {
      payload.hint = 'Enable Generative Language API for the project tied to your API key in Google AI Studio.'
    }
  res.setHeader('Content-Type', 'application/json')
  return res.status(status).json(payload)
  }
}
