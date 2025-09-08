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
3) Then provide clear step-by-step instructions.

Rules:
- Use only the provided ingredients as the core. You may add minimal pantry items (salt, pepper, oil, stock, herbs) only if necessary. If you add extras, include them in extrasMentioned and also in ingredients with quantities.
- Fields to produce: title, summary, time, servings, ingredients (array of { name, quantity }), steps (array of strings), extrasMentioned (array of strings).
- Do NOT prefix steps with numbers or bullets; the client will number them.
- Keep tone concise and refined.`

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  const MODEL_ID = process.env.MODEL_ID || 'gemini-1.5-flash'
  const MOCK_MODE = process.env.MOCK_MODE === 'true' || !API_KEY

  try {
    const body = req.body || {}
    const { ingredients } = body

    let list = []
    if (Array.isArray(ingredients)) list = ingredients
    else if (typeof ingredients === 'string') list = ingredients.split(/\n|,|;|\||·|•|—|–|\t/)
    else if (Array.isArray(body)) list = body

    list = list.map((i) => String(i ?? '').trim()).filter(Boolean)
    if (list.length < 1) {
      return res.status(400).json({ error: 'ingredients is required as array or comma/newline string', received: body })
    }

    const userList = list.map((i) => `- ${String(i).trim()}`).join('\n')
    const userPrompt = `Ingredients:\n${userList}\n\nConstraints:\n- Output JSON ONLY with fields: title (string), summary (string), time (string), servings (number), ingredients (array of { name, quantity? }), steps (string[]), extrasMentioned (string[]).\n- Ingredients: include the provided items; add minimal pantry items only if needed. Provide quantities in common kitchen units (g, ml, tsp, tbsp, cups, pieces).\n- Servings: default to 2 if unspecified.\n- Time: realistic estimate.\n- Steps: clear instructions as an array of strings (do NOT include leading numbers or bullets; the client will number them).`

    if (MOCK_MODE) {
      const title = `${list[0] ? list[0][0].toUpperCase() + list[0].slice(1) : 'Chef'}-style ${list.length > 1 ? 'fusion ' : ''}recipe`
      const mock = {
        title,
        summary: `A refined, minimalist dish featuring ${list.join(', ')} with balanced seasoning and clean presentation.`,
        time: '20 minutes',
        servings: 2,
        ingredients: [
          ...list.map((name) => ({ name, quantity: 'to taste' })),
          { name: 'olive oil', quantity: '1 tbsp' },
          { name: 'salt', quantity: 'to taste' },
          { name: 'black pepper', quantity: 'to taste' },
          { name: 'fresh herbs', quantity: 'few sprigs' },
        ],
        steps: [
          'Prep all ingredients and set out your cookware.',
          `Season ${list.join(', ')} lightly with salt and pepper.`,
          'Cook over medium heat with a touch of olive oil until aromatic and tender.',
          'Adjust seasoning, plate neatly, garnish with herbs, and serve warm.',
        ],
        extrasMentioned: ['salt', 'pepper', 'olive oil', 'herbs'],
      }
      return res.status(200).json(mock)
    }

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
    return res.status(200).json(data)
  } catch (err) {
    const status = err?.status || 500
    const payload = { error: err?.statusText || 'Failed to generate recipe' }
    if (err?.errorDetails) payload.details = err.errorDetails
    if (status === 403) {
      payload.hint = 'Enable Generative Language API for the project tied to your API key in Google AI Studio.'
    }
    return res.status(status).json(payload)
  }
}
