import { ChefHat, Sparkles, Clock, Users } from './Icons'

export default function RecipeSection({ loading, recipe }) {
  return (
    <section id="recipe" className="mt-10">
    {loading && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm flex items-center gap-3">
      <ChefHat className="h-5 w-5 animate-pulse" />
          <div className="text-sm text-neutral-700">Your AI chef is composing a recipe…</div>
        </div>
      )}
      {recipe && !loading && (
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
          <p className="mt-2 text-neutral-700">{recipe.summary}</p>
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
      )}
    </section>
  )
}
