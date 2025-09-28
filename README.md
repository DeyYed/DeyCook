# DeyCook — AI Five‑Star Chef

Premium, responsive white‑theme app where you add ingredients and an AI chef composes a refined recipe. Initially shipped with an Express backend; now uses serverless‑style function handlers in `api/` that run in‑process via a Vite middleware plugin for local dev.

## Features

- Clean, mobile‑first UI with professional chef aesthetic
- Add ingredients one‑by‑one or paste bulk (comma/newline)
- “Get recipe” after 3+ ingredients
- Animated Chef Hat loader (no generic spinner)
- Recipe JSON includes: title, detailed summary, time, servings, ingredients with quantities, and clean steps (client numbers them)
- Backend diagnostics: health and ping endpoints; robust error surfacing and fallback

## Stack

- Frontend: Vite + React 19 + Tailwind v4 (`@tailwindcss/vite`)
- Backend: Serverless‑style functions (`/api/*.js`) run via Vite middleware in dev (no separate port). Legacy `Express` implementation retained in `server/` (optional).
- AI: Google Generative Language API (Gemini 2.5 Flash Lite) via REST
- Dev proxy: Vite proxies `/api` → `http://localhost:3001`

## Prerequisites

- Node 18+ (for global `fetch`) and npm

## Setup

1) Install dependencies

```powershell
npm install
- Optional video‑guided mode: finds a related YouTube tutorial then adapts recipe (may add up to 3 common ingredients)
```

2) Environment

 Copy `.env.example` to `.env`, then set:

 - `GOOGLE_API_KEY` — your Gemini API key
 - `MODEL_ID` — default `gemini-2.5-flash-lite`
 - `YOUTUBE_API_KEY` — optional (enables video guided toggle)
 - `PORT` — default `3001`
	(no mock mode; an API key is required)

PowerShell (Windows) example:

```powershell
$env:GOOGLE_API_KEY = 'your_key_here'
```

## Run

Dev (single process; Vite serves UI + API):

```powershell
npm run start:all   # alias for npm run dev
```

Optional legacy split (if you still want Express server):

```powershell
npm run server   # Express on http://localhost:3001
npm run dev      # Vite (will ALSO serve /api itself, so avoid calling both unless testing)
```

Restart helper (mainly clears port 5173):

```powershell
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
With video guided toggle:

```json
{ "ingredients": ["egg", "rice", "soy sauce"], "includeVideo": true }
```
	"extrasMentioned": ["salt", "pepper", "oil"]
}
```

Health and diagnostics (via serverless handlers now):

- GET `/api/health` → `{ ok: true }`
- GET `/api/ping-gemini` → `{ ok: true, model, sample }`

## Build

```powershell
npm run build
npm run preview
```

## Deploy (Vercel)

1. Push this repo to GitHub (public or private).
2. In Vercel: New Project → Import the repository.
3. Set build settings:
	- Framework Preset: Other (Vite)
	- Build Command: `npm run build`
	- Output Directory: `dist`
4. Add Environment Variables (same for Preview + Production):
	- `GOOGLE_API_KEY`
	- `MODEL_ID` (optional, defaults to gemini-2.5-flash-lite)
	- `YOUTUBE_API_KEY` (optional for video guided mode)
	- `BRAND_NAME` (optional)
	- `ZAPIER_WEBHOOK_URL` (optional for email sending)
5. Deploy.

API routes under `api/` automatically become serverless functions (e.g. `/api/recipe`). The `vercel.json` ensures SPA rewrites so deep links resolve to `index.html`.

### Notes
* If you change or add new files under `api/`, redeploy or trigger a rebuild.
* YouTube quota errors will silently fall back to a normal recipe.
* To debug a failing function, open Vercel → Project → Functions → select the function → view logs.
* For faster cold starts keep code in `api/` lean—avoid large unused imports.

## Troubleshooting

- 500 on `/api/recipe`:
	- Missing/invalid `GOOGLE_API_KEY`? Set a valid key in your environment.
	- Gemini structured outputs not permitted on your account? The server auto‑falls back to a plain JSON prompt; check the response body for `error/details` hints.
- Port in use (5173):
	- `npm run stop:all` (frees 5173) then re-run dev.
- 403 SERVICE_DISABLED:
	- Enable “Generative Language API” for the same project tied to your key in Google AI Studio.

## Notes on serverless local mode

- Each file in `api/` exporting a default `handler(req, res)` is mounted at `/api/<filename>`.
- Hot reload: edits to an `api/*.js` file are picked up on next request.
- Minimal response helpers (`res.status(..).json(..)`) are polyfilled.
- For production deployment to a serverless platform (e.g. Vercel / Netlify), the same files should work directly.

## UI notes

- Animated Chef Hat shows during generation (button and recipe panel)
- Steps render with automatic numbering; the backend outputs unnumbered lines to avoid `1. 1.` duplicates
- Ingredients list shows names and practical quantities/units

## License

MIT
