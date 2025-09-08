export default function IngredientForm({ ingredientInput, setIngredientInput, bulkInput, setBulkInput, onAddSingle, onAddBulk, onClear }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Add ingredients</h2>
      <p className="mt-1 text-sm text-neutral-600">Add one-by-one or paste a list (comma or new-line separated).</p>

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
    </div>
  )
}
