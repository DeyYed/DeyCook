import { useCallback } from 'react'
import { ChefHat, Sparkles, Clock, Users } from './Icons'
import jsPDF from 'jspdf'

export default function RecipeSection({ loading, recipe }) {
  const handleDownload = useCallback(() => {
    if (!recipe) return
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })

    // Brand header: logo + name
    const logoUrl = '/chef-icon-logo.png'
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 48
    const startY = margin

    // Title area
    const title = recipe.title || 'Recipe'
    const subtitle = `${recipe.time || '-'} • Serves ${recipe.servings ?? '-'}`

    // Try to load logo (optional)
    // jsPDF needs base64 or HTMLImageElement; we'll attempt dynamic image loading
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
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleDownload}
            className="rounded-xl border border-neutral-200 bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
          >
            Download PDF
          </button>
        </div>
        </>
      )}
    </section>
  )
}
