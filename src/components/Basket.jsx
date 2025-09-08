import { ChefHat } from './Icons'

export default function Basket({ ingredients, canGetRecipe, loading, onRemove, onGetRecipe, minIngredients }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Your basket</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {ingredients.length === 0 && (
          <span className="text-sm text-neutral-500">No ingredients yet.</span>
        )}
        {ingredients.map((ing) => (
          <span key={ing} className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm shadow-sm">
            {ing}
            <button onClick={() => onRemove(ing)} className="text-neutral-500 hover:text-neutral-700" aria-label={`Remove ${ing}`}>
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="mt-4">
        <button
          onClick={onGetRecipe}
          disabled={!canGetRecipe || loading}
          className="w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #d4af37, #b58b2b)' }}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <ChefHat className="h-4 w-4 animate-pulse" />
              Generating…
            </span>
          ) : (
            canGetRecipe ? 'Get recipe' : `Add ${minIngredients}+ ingredients`
          )}
        </button>
      </div>
    </div>
  )
}
