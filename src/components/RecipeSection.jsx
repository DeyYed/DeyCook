import { useCallback, useMemo, useState } from 'react'
import { ChefHat, Sparkles, Clock, Users, Mail } from './Icons'
import jsPDF from 'jspdf'

export default function RecipeSection({ loading, recipe }) {
  const [emailOpen, setEmailOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendMsg, setSendMsg] = useState('')

  const handleDownload = useCallback(() => {
    if (!recipe) return
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })

    const logoUrl = '/chef-icon-logo.png'
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 48
    const startY = margin

    const title = recipe.title || 'Recipe'
    const subtitle = `${recipe.time || '-'} • Serves ${recipe.servings ?? '-'}`

    const addHeader = (img) => {
      if (img) {
        const logoW = 36, logoH = 36
        doc.addImage(img, 'PNG', margin, startY - 8, logoW, logoH)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.text('DeyCook — Private Chef Assistant', margin + logoW + 12, startY + 16)
      } else {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.text('DeyCook — Private Chef Assistant', margin, startY)
      }
    }

    const addBody = () => {
      let y = startY + 40
      const pageHeight = doc.internal.pageSize.getHeight()
      const ensureSpace = (needed = 20) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage()
          y = margin
        }
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.text(title, margin, y)
      y += 20
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(90)
      doc.text(subtitle, margin, y)
      y += 18

      // Summary
      doc.setTextColor(0)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('Summary', margin, y)
      y += 14
      doc.setFont('helvetica', 'normal')
      const summary = recipe.summary || ''
      const summaryLines = doc.splitTextToSize(summary, pageWidth - margin * 2)
      summaryLines.forEach((line) => {
        ensureSpace(14)
        doc.text(line, margin, y)
        y += 14
      })
      y += 10

      // Ingredients
      if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
        doc.setFont('helvetica', 'bold')
        doc.text('Ingredients', margin, y)
        y += 14
        doc.setFont('helvetica', 'normal')
        const ingLines = recipe.ingredients.map((i) => `• ${i.name}${i.quantity ? ` — ${i.quantity}` : ''}`)
        const wrapped = doc.splitTextToSize(ingLines.join('\n'), pageWidth - margin * 2)
        wrapped.forEach((line) => {
          ensureSpace(14)
          doc.text(line, margin, y)
          y += 14
        })
        y += 6
      }

      // Steps
      if (Array.isArray(recipe.steps) && recipe.steps.length) {
        doc.setFont('helvetica', 'bold')
        doc.text('Steps', margin, y)
        y += 14
        doc.setFont('helvetica', 'normal')
        recipe.steps.forEach((s, idx) => {
          const cleaned = String(s).replace(/^(\s*(?:\d+\s*[\.)-]|[\-•\u2022])\s*)+/, '')
          const text = `${idx + 1}. ${cleaned}`
          const lines = doc.splitTextToSize(text, pageWidth - margin * 2)
          doc.text(lines, margin, y)
          y += lines.length * 14 + 6
          if (y > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage()
            y = margin
          }
        })
      }
    }

    const img = new Image()
    img.onload = () => { addHeader(img); addBody(); doc.save(`${title}.pdf`) }
    img.onerror = () => { addHeader(null); addBody(); doc.save(`${title}.pdf`) }
    img.src = logoUrl
  }, [recipe])

  const canSend = useMemo(() => /.+@.+\..+/.test(email.trim()), [email])

  const handleSend = useCallback(async () => {
    if (!recipe || !canSend) return
    setSendLoading(true)
    setSendMsg('')
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), recipe }),
      })
      if (!res.ok) {
        let info = 'Failed to send'
        try { const data = await res.json(); info = data?.error || JSON.stringify(data) } catch {}
        throw new Error(info)
      }
      setSendMsg('Sent! Please check your inbox.')
      setEmail('')
      setTimeout(() => setEmailOpen(false), 1200)
    } catch (e) {
      setSendMsg(String(e?.message || 'Send failed'))
    } finally {
      setSendLoading(false)
    }
  }, [email, recipe, canSend])
  return (
    <section id="recipe" className="mt-10">
    {loading && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm flex items-center gap-3">
      <ChefHat className="h-5 w-5 animate-pulse" />
          <div className="text-sm text-neutral-700">Your AI chef is composing a recipe…</div>
        </div>
      )}
      {recipe && !loading && (
        <>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <span>{recipe.title}</span>
            </h2>
            <div className="text-sm text-neutral-600 flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{recipe.time}</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />Serves {recipe.servings}</span>
            </div>
          </div>
          <div className="mt-2 text-neutral-700">{recipe.summary}</div>
          {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-neutral-800">Ingredients</h3>
              <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-800">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-neutral-300" />
                    <span>
                      <span className="font-medium">{ing.name}</span>
                      {ing.quantity ? <span className="text-neutral-600"> — {ing.quantity}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-neutral-800">
            {recipe.steps.map((s, i) => {
              // Remove any repeated leading numbers/bullets like "1. ", "1) ", "- ", "• ", including accidental double prefixes
              const cleaned = String(s).replace(/^(\s*(?:\d+\s*[\.)-]|[\-•\u2022])\s*)+/,'')
              return <li key={i}>{cleaned}</li>
            })}
          </ol>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setEmailOpen(true)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 inline-flex items-center gap-2"
          >
            <Mail className="h-4 w-4" /> Send to email
          </button>
          <button
            onClick={handleDownload}
            className="rounded-xl border border-neutral-200 bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
          >
            Download PDF
          </button>
        </div>

        {/* Email Modal */}
        {emailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20" onClick={() => setEmailOpen(false)} />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
              <h3 className="text-base font-semibold">Send to email</h3>
              <p className="mt-1 text-sm text-neutral-600">Enter your email address and we’ll send this recipe.</p>
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none ring-0 focus:border-neutral-400"
                />
              </div>
              {sendMsg && <div className="mt-2 text-sm text-neutral-700">{sendMsg}</div>}
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setEmailOpen(false)} className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50">Cancel</button>
                <button
                  disabled={!canSend || sendLoading}
                  onClick={handleSend}
                  className="rounded-xl border border-neutral-200 bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
                >
                  {sendLoading ? 'Sending…' : 'Send email'}
                </button>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </section>
  )
}
