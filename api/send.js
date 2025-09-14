export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

  const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL
  const BRAND_NAME = process.env.BRAND_NAME || 'DeyCook'
    if (!ZAPIER_WEBHOOK_URL) return res.status(500).json({ error: 'Missing ZAPIER_WEBHOOK_URL' })

    // Parse body (Vercel sometimes provides as already-parsed object, or as a string)
    let body = req.body
    if (!body) {
      const chunks = []
      for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      const raw = Buffer.concat(chunks).toString('utf8')
      try { body = JSON.parse(raw) } catch { body = {} }
    } else if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch { body = {} }
    }

    const { email, recipe } = body || {}
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

    let out
    try { out = await resp.json() } catch { out = null }

    res.setHeader('Content-Type', 'application/json')
    if (!resp.ok) return res.status(resp.status).json({ error: out?.message || 'Zapier webhook failed', details: out })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[vercel send] failed:', err)
    return res.status(500).json({ error: 'Failed to send via Zapier' })
  }
}
