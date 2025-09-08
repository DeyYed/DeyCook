# DeyCook — Private Chef Assistant

A responsive, premium white-theme web app where users enter ingredients and an AI (template hook) composes a refined recipe like a five‑star chef.

## Features

- Mobile‑first, responsive layout with a minimalist white aesthetic
- Add ingredients one‑by‑one or paste a bulk list (comma/newline separated)
- “Get recipe” unlocks after 3+ ingredients
- Placeholder AI generation (easy to swap with your preferred provider)

## Quick start

```powershell
npm install
npm run dev
```

Open http://localhost:5173.

## Where to plug in your AI

In `src/App.jsx`, replace the body of `getRecipe()` with your provider call. Suggested contract:

- input: `{ ingredients: string[] }`
- output: `{ title: string, summary: string, steps: string[], servings?: number, time?: string }`

Example sketch:

```js
async function getRecipe() {
	setLoading(true)
	setRecipe(null)
	// Call your AI here
	const res = await fetch('/api/recipe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ingredients }),
	})
	const data = await res.json()
	setRecipe(data)
	setLoading(false)
}
```

You can back this with any model provider (OpenAI, Azure OpenAI, Google, Anthropic, local, etc.). If you add a server, create an endpoint like `/api/recipe` and keep the output shape above.

## Build

```powershell
npm run build
npm run preview
```

## Tech

- Vite + React 19
- Tailwind CSS v4 (via `@tailwindcss/vite`)

## License

MIT
