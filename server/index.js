import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3001
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
if (!API_KEY) {
  console.warn('[warn] GOOGLE_API_KEY is not set. /api/recipe will fail until you configure it.')
}
const MODEL_ID = process.env.MODEL_ID || 'gemini-1.5-flash'
const SYSTEM_INSTRUCTION = `You are a professional 5-star chef AI.
Return ONLY JSON (no markdown, no commentary).

Goal and order:
1) Provide a concise, refined description of the dish that will be made (summary). Include flavor profile, texture, key techniques, and presentation.
2) Then list the ingredients with practical kitchen quantities and sizes.
3) Then provide clear step-by-step instructions.

Validation & normalization:
- Correct obvious typos in ingredient names (e.g., "tomto" -> "tomato").
- Ignore non-food/random words (e.g., people names like "Dey Dey").
- If after correction fewer than 2 valid ingredients remain, do not generate a recipe. Return this minimal object instead:
  {"title":"Invalid ingredients","summary":"No valid ingredients detected. Please provide real food ingredients.","time":"-","servings":0,"ingredients":[],"steps":["No recipe can be made with the provided inputs."],"extrasMentioned":[]}

Rules:
- Use only the provided ingredients as the core. You may add minimal pantry items (salt, pepper, oil, stock, herbs) only if necessary. If you add extras, include them in extrasMentioned and also in ingredients with quantities.
- Fields to produce: title, summary, time, servings, ingredients (array of { name, quantity }), steps (array of strings), extrasMentioned (array of strings).
- Do NOT prefix steps with numbers or bullets; the client will number them.
- Keep tone concise and refined.`

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

function buildUrl(modelId) {
  const u = new URL(`${BASE_URL}/models/${encodeURIComponent(modelId)}:generateContent`)
  u.searchParams.set('key', API_KEY)
  return u.toString()
}

async function callGeminiREST({ prompt, structured = false, responseSchema }) {
  if (!globalThis.fetch) {
    throw new Error('fetch is not available in this Node runtime. Use Node 18+ or add a fetch polyfill.')
  }

  const body = {
    contents: [
      { role: 'user', parts: [{ text: prompt }] },
    ],
    system_instruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
    generation_config: {
      temperature: 0.7,
      ...(structured
        ? { response_mime_type: 'application/json', response_schema: responseSchema }
        : {}),
    },
  }

  const resp = await fetch(buildUrl(MODEL_ID), {
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

  // Extract text from candidates
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
        properties: {
          name: { type: 'string' },
          quantity: { type: 'string' },
        },
        required: ['name']
      }
    },
    steps: { type: 'array', items: { type: 'string' } },
    extrasMentioned: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'summary', 'time', 'servings', 'ingredients', 'steps']
}

app.post('/api/recipe', async (req, res) => {
  try {
  if (!API_KEY) return res.status(500).json({ error: 'Missing GOOGLE_API_KEY' })
    const { ingredients } = req.body || {}
    console.log('[recipe] incoming body:', req.body)

    // Accept array or delimited string and sanitize
    let list = []
    if (Array.isArray(ingredients)) list = ingredients
    else if (typeof ingredients === 'string') list = ingredients.split(/\n|,|;|\||·|•|—|–|\t/)
    else if (Array.isArray(req.body)) list = req.body

    list = list.map((i) => String(i ?? '').trim()).filter(Boolean)
    if (list.length < 1) {
      return res.status(400).json({ error: 'ingredients is required as array or comma/newline string', received: req.body })
    }

    const userList = list.map((i) => `- ${String(i).trim()}`).join('\n')
  const userPrompt = `Ingredients:\n${userList}\n\nConstraints:\n- Correct obvious typos in ingredient names and ignore non-food/random words.\n- If fewer than 2 valid ingredients remain after correction, produce the minimal refusal object specified in the system instructions.\n- Output JSON ONLY with fields: title (string), summary (string), time (string), servings (number), ingredients (array of { name, quantity? }), steps (string[]), extrasMentioned (string[]).\n- Ingredients: include the provided items; add minimal pantry items only if needed. Provide quantities in common kitchen units (g, ml, tsp, tbsp, cups, pieces).\n- Servings: default to 2 if unspecified.\n- Time: realistic estimate.\n- Steps: clear instructions as an array of strings (do NOT include leading numbers or bullets; the client will number them).`

  // Proceed with live API only

    let text
    try {
      text = await callGeminiREST({ prompt: userPrompt, structured: true, responseSchema })
    } catch (err) {
      // Fallback if structured outputs are not permitted for the account/model
      console.warn('[gemini] structured outputs failed, falling back to plain JSON prompt:', err?.status, err?.statusText)
  const fallbackPrompt = `${userPrompt}\n\nReturn ONLY a valid JSON object with these fields: {"title":"","summary":"","time":"","servings":2,"ingredients":[{"name":"","quantity":""}],"steps":["..."],"extrasMentioned":["..."]}`
      text = await callGeminiREST({ prompt: fallbackPrompt, structured: false })
    }

    let data
    try {
      data = JSON.parse(text)
    } catch {
      // Best-effort: in case model added trailing text, extract JSON block
      const match = text.match(/\{[\s\S]*\}/)
      data = match ? JSON.parse(match[0]) : null
    }
    if (!data) return res.status(502).json({ error: 'Invalid model response', raw: text })

    return res.json(data)
  } catch (err) {
    console.error(err)
    const status = err?.status || 500
    const payload = { error: err?.statusText || 'Failed to generate recipe' }
    if (err?.errorDetails) {
      payload.details = err.errorDetails
      const help = err.errorDetails.find((d) => d['@type']?.includes('Help'))
      if (help?.links?.length) payload.help = help.links
    }
    if (status === 403) {
      payload.hint = '403 Forbidden from Gemini. Ensure the Generative Language API is enabled for the SAME project tied to your API key in AI Studio, or create a new key and enable the API for that project.'
    }
    return res.status(status).json(payload)
  }
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Optional: quick Gemini ping to validate API key/project setup
app.get('/api/ping-gemini', async (_req, res) => {
  try {
  if (!API_KEY) return res.status(500).json({ ok: false, error: 'Missing GOOGLE_API_KEY' })
  const sample = await callGeminiREST({ prompt: 'ping', structured: false })
  return res.json({ ok: true, model: MODEL_ID, sample: sample?.slice(0, 40) || '' })
  } catch (err) {
    const status = err?.status || 500
    return res.status(status).json({ ok: false, error: err?.statusText || 'Ping failed', details: err?.errorDetails })
  }
})

// Send recipe via Zapier (Webhooks by Zapier -> Catch Hook)
app.post('/api/send', async (req, res) => {
  try {
    const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL
    if (!ZAPIER_WEBHOOK_URL) return res.status(500).json({ error: 'Missing ZAPIER_WEBHOOK_URL' })
  const BRAND_NAME = process.env.BRAND_NAME || 'DeyCook'

    const { email, recipe } = req.body || {}
    const emailStr = String(email || '').trim()
    const isEmail = /.+@.+\..+/.test(emailStr)
    if (!isEmail) return res.status(400).json({ error: 'A valid email is required' })
    if (!recipe || !Array.isArray(recipe?.steps) || recipe.steps.length === 0) {
      return res.status(400).json({ error: 'Recipe is required' })
    }

    const safeRecipe = {
      title: recipe.title || 'Your Recipe',
      summary: recipe.summary || '',
      time: recipe.time || '-',
      servings: recipe.servings ?? 2,
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.map(i => ({ name: String(i?.name||''), quantity: i?.quantity ? String(i.quantity) : '' })) : [],
      steps: recipe.steps.map(s => String(s)),
    }

    const brandHeader = `<div style="font-weight:600;font-size:14px;margin-bottom:10px">${BRAND_NAME}</div>`

    const htmlBody = `
      <div style="font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;color:#111">
        ${brandHeader}
        <h2 style="margin:0 0 8px 0">${safeRecipe.title}</h2>
        <div style="color:#555;margin-bottom:8px">${safeRecipe.time} • Serves ${safeRecipe.servings}</div>
        <p style="margin:0 0 12px 0">${safeRecipe.summary}</p>
        ${safeRecipe.ingredients.length ? `<h3 style=\"margin:16px 0 6px 0\">Ingredients</h3><ul>${safeRecipe.ingredients.map(i=>`<li>${i.name}${i.quantity?` — ${i.quantity}`:''}</li>`).join('')}</ul>`:''}
        <h3 style="margin:16px 0 6px 0">Steps</h3>
        <ol>${safeRecipe.steps.map((s, i)=>`<li>${s.replace(/^(\\s*(?:\\d+\\s*[\\.)-]|[\\-•\\u2022])\\s*)+/, '')}</li>`).join('')}</ol>
        <p style="margin-top:16px;color:#666">Sent via ${BRAND_NAME}</p>
      </div>
    `

    const payload = {
      email: emailStr,
      recipe: safeRecipe,
      htmlBody,
      subject: `Your ${BRAND_NAME} Recipe: ${safeRecipe.title}`,
    }

    const resp = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const out = await resp.json().catch(() => ({}))
    if (!resp.ok) return res.status(resp.status).json({ error: out?.message || 'Zapier webhook failed', details: out })
    return res.json({ ok: true })
  } catch (err) {
    console.error('[send] failed:', err)
    return res.status(500).json({ error: 'Failed to send via Zapier' })
  }
})

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`)
})
