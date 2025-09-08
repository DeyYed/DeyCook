import Header from './components/Header'
import Hero from './components/Hero'
import IngredientForm from './components/IngredientForm'
import Tips from './components/Tips'
import Basket from './components/Basket'
import RecipeSection from './components/RecipeSection'
import Footer from './components/Footer'
import { useState, useMemo } from 'react'
const MIN_INGREDIENTS_FOR_RECIPE = 3

function App() {
  const [ingredientInput, setIngredientInput] = useState('')
  const [bulkInput, setBulkInput] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(false)
  const [recipe, setRecipe] = useState(null)

  const canGetRecipe = useMemo(
    () => ingredients.filter((i) => i?.trim()).length >= MIN_INGREDIENTS_FOR_RECIPE,
    [ingredients]
  )

  function addIngredient(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    setIngredients((prev) => Array.from(new Set([...prev, trimmed])))
  }

  function removeIngredient(name) {
    setIngredients((prev) => prev.filter((i) => i !== name))
  }

  function handleAddSingle(e) {
    e?.preventDefault()
    addIngredient(ingredientInput)
    setIngredientInput('')
  }

  function handleAddBulk() {
    const parts = bulkInput
      .split(/\n|,|;|\||·|•|—|–|\t/)
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length) setIngredients((prev) => Array.from(new Set([...prev, ...parts])))
    setBulkInput('')
  }

  async function getRecipe() {
    setLoading(true)
    setRecipe(null)
    try {
      const clean = ingredients.map((i) => String(i ?? '').trim()).filter(Boolean)
      const res = await fetch('/api/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: clean }),
      })
      if (!res.ok) {
        let info = 'Failed to generate'
        try { const data = await res.json(); info = data?.error || JSON.stringify(data) } catch {}
        throw new Error(info)
      }
      const data = await res.json()
      setRecipe(data)
    } catch (e) {
      setRecipe({
        title: 'Recipe unavailable',
        summary: String(e?.message || 'There was a problem generating the recipe. Please try again.'),
        time: '-',
        servings: 2,
        steps: ['Check your API key configuration and network connection.'],
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-white">
      <Header />
      <Hero />
      <main id="ingredients" className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-5">
          <section className="md:col-span-3 space-y-6">
            <IngredientForm
              ingredientInput={ingredientInput}
              setIngredientInput={setIngredientInput}
              bulkInput={bulkInput}
              setBulkInput={setBulkInput}
              onAddSingle={handleAddSingle}
              onAddBulk={handleAddBulk}
              onClear={() => setIngredients([])}
            />
            <Tips minIngredients={MIN_INGREDIENTS_FOR_RECIPE} />
          </section>
          <aside className="md:col-span-2 space-y-4">
            <Basket
              ingredients={ingredients}
              canGetRecipe={canGetRecipe}
              loading={loading}
              onRemove={removeIngredient}
              onGetRecipe={getRecipe}
              minIngredients={MIN_INGREDIENTS_FOR_RECIPE}
            />
          </aside>
        </div>
        <RecipeSection loading={loading} recipe={recipe} />
      </main>
      <Footer />
    </div>
  )
}

export default App
