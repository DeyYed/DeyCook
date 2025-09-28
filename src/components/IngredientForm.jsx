import Switch from './Switch'
import { useState, useEffect, useRef } from 'react'

export default function IngredientForm({ ingredientInput, setIngredientInput, bulkInput, setBulkInput, onAddSingle, onAddBulk, onClear, includeVideo, setIncludeVideo }) {
  const [infoOpen, setInfoOpen] = useState(false)
  const closeBtnRef = useRef(null)
  useEffect(()=>{ if(infoOpen) closeBtnRef.current?.focus() },[infoOpen])
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Add ingredients</h2>
          <p className="mt-1 text-sm text-neutral-600">Add one-by-one or paste a list (comma or new-line separated).</p>
        </div>
        <div className="flex flex-col items-end text-right">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-700">Video guided</span>
            <Switch checked={includeVideo} onChange={setIncludeVideo} label="Video guided recipe" />
          </div>
          <div className="mt-1 flex flex-col items-end">
            {includeVideo && (
              <span className="max-w-[200px] text-xs text-amber-600">May add / omit ingredients to align with selected tutorial.</span>
            )}
            <button
              type="button"
              onClick={()=>setInfoOpen(true)}
              className="mt-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-800 focus:outline-none focus:underline"
            >Learn more</button>
          </div>
        </div>
      </div>

      {/* Single add */}
      <form onSubmit={onAddSingle} className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="e.g., chicken breast"
          value={ingredientInput}
          onChange={(e) => setIngredientInput(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none ring-0 focus:border-neutral-400"
        />
        <button
          type="submit"
          className="rounded-xl border border-neutral-200 bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-black"
          aria-label="Add ingredient"
        >
          Add
        </button>
      </form>

      {/* Bulk add */}
      <div className="mt-4">
        <textarea
          rows={4}
          placeholder="tomato\nmozzarella\nolive oil, basil"
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-400"
        />
        <div className="mt-2 flex justify-between gap-2">
          <button
            type="button"
            onClick={onAddBulk}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium hover:bg-neutral-100"
          >
            Add list
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            Clear all
          </button>
        </div>
      </div>
    {infoOpen && (
      <div className="fixed inset-0 z-40 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={()=>setInfoOpen(false)} />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-guide-title"
          className="relative z-50 w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl"
        >
          <h3 id="video-guide-title" className="text-base font-semibold">Video‑guided mode</h3>
          <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
            When enabled, the app searches YouTube for a single relevant cooking tutorial using your first ingredients. The AI adapts the dish based on that video’s style and may:
          </p>
          <ul className="mt-3 list-disc pl-5 text-xs text-neutral-700 space-y-1">
            <li>Add up to 3 common pantry or video‑inspired ingredients (they appear in <span class="font-medium">extrasMentioned</span>).</li>
            <li>Alter or omit an ingredient if the tutorial’s method conflicts heavily.</li>
            <li>Adjust technique sequencing to mirror professional steps seen in the video.</li>
          </ul>
          <p className="mt-3 text-xs text-neutral-600">
            Your original ingredients stay primary. Added items are minimal and optional. If no suitable video is found, a normal AI recipe is generated.
          </p>
          <p className="mt-3 text-[11px] text-neutral-500">
            We only send ingredient text plus the video metadata snippet to the model. No personal data is included.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              ref={closeBtnRef}
              onClick={()=>setInfoOpen(false)}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            >Close</button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
