# DeyCook — AI Five‑Star Chef

Premium, responsive white‑theme app where you add ingredients and an AI chef composes a refined recipe. Includes an Express backend that calls Google Gemini via REST (with a local mock mode).

## Features

- Clean, mobile‑first UI with professional chef aesthetic
- Add ingredients one‑by‑one or paste bulk (comma/newline)
- “Get recipe” after 3+ ingredients
- Animated Chef Hat loader (no generic spinner)
- Recipe JSON includes: title, detailed summary, time, servings, ingredients with quantities, and clean steps (client numbers them)
- Backend diagnostics: health and ping endpoints; robust error surfacing and fallback

## Stack

- Frontend: Vite + React 19 + Tailwind v4 (`@tailwindcss/vite`)
- Backend: Express (Node 18+ global fetch)
- AI: Google Generative Language API (Gemini 1.5 Flash) via REST
- Dev proxy: Vite proxies `/api` → `http://localhost:3001`

## Prerequisites

- Node 18+ (for global `fetch`) and npm

## Setup

1) Install dependencies

```powershell
npm install
```

2) Environment

Copy `.env.example` to `.env`, then set:

- `GOOGLE_API_KEY` — your Gemini API key
- `MODEL_ID` — default `gemini-1.5-flash`
- `PORT` — default `3001`
- `MOCK_MODE` — `true` to bypass AI calls and return a local recipe (great for dev)

PowerShell (Windows) example:

```powershell
# Use mock mode for local testing
$env:MOCK_MODE = 'true'

# Or with a real key
$env:GOOGLE_API_KEY = 'your_key_here'
```

## Run

Option A — one command (server + client):

```powershell
npm run start:all
```

Option B — separate:

```powershell
npm run server   # starts Express on http://localhost:3001
npm run dev      # starts Vite on http://localhost:5173 (proxy /api)
```

Stop/Restart helpers:

```powershell
npm run stop:all
npm run restart:all
```

## API

POST `/api/recipe`

Request (any of these):

```json
{ "ingredients": ["egg", "rice", "soy sauce"] }
```

```json
{ "ingredients": "egg, rice, soy sauce" }
```

Response:

```json
{
	"title": "Simple Fried Rice",
	"summary": "A refined description with flavors, texture, technique, and presentation.",
	"time": "15 minutes",
	"servings": 2,
	"ingredients": [
		{ "name": "rice", "quantity": "2 cups cooked" },
		{ "name": "egg", "quantity": "2 pcs" },
		{ "name": "soy sauce", "quantity": "1 tbsp" }
	],
	"steps": [
		"Cook rice and let it cool.",
		"Whisk eggs and season lightly.",
		"Stir‑fry rice, then add eggs and soy sauce; finish and plate."
	],
	"extrasMentioned": ["salt", "pepper", "oil"]
}
```

Health and diagnostics:

- GET `/api/health` → `{ ok: true }`
- GET `/api/ping-gemini` → `{ ok: true, model, sample }` (or `{ ok: true, model: "mock" }` in mock mode)

## Build

```powershell
npm run build
npm run preview
```

## Troubleshooting

- 500 on `/api/recipe`:
	- Missing/invalid `GOOGLE_API_KEY`? Use `MOCK_MODE=true` or set a valid key.
	- Gemini structured outputs not permitted on your account? The server auto‑falls back to a plain JSON prompt; check the response body for `error/details` hints.
- Port in use (3001/5173):
	- `npm run stop:all` to free ports (uses kill‑port), then start again.
- 403 SERVICE_DISABLED:
	- Enable “Generative Language API” for the same project tied to your key in Google AI Studio.

## UI notes

- Animated Chef Hat shows during generation (button and recipe panel)
- Steps render with automatic numbering; the backend outputs unnumbered lines to avoid `1. 1.` duplicates
- Ingredients list shows names and practical quantities/units

## License

MIT
