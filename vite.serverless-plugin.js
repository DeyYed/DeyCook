// Vite middleware plugin to simulate serverless `api/*.js` function handlers locally
// Each file in /api must export default async function handler(req, res)
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { pathToFileURL } from 'url'

export default function serverlessApiPlugin() {
  const apiDir = path.resolve(process.cwd(), 'api')
  // Ensure .env is loaded once when Vite starts
  dotenv.config()
  // Fallback manual parse (in case dotenv missed due to cwd issues)
  const envPath = path.join(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8')
    raw.split(/\r?\n/).forEach(line => {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
    })
  }
  return {
    name: 'serverless-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next()

        // Normalize path: /api/recipe -> recipe.js
        const rel = req.url.split('?')[0].replace(/^\/api\//, '') || ''
        if (!rel) return next()
        const filePath = path.join(apiDir, rel + (rel.endsWith('.js') ? '' : '.js'))
        if (!fs.existsSync(filePath)) return next()
        
        try {
          // Parse JSON body (once) for POST/PUT/PATCH if not already
          if (!req.body && /^(POST|PUT|PATCH)$/i.test(req.method)) {
            const ctype = req.headers['content-type'] || ''
            const chunks = []
            for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
            const raw = Buffer.concat(chunks).toString('utf8')
            if (raw && ctype.includes('application/json')) {
              try { req.body = JSON.parse(raw) } catch { req.body = raw }
            } else if (raw) {
              req.body = raw
            }
          }

          // Use file:// URL for Windows compatibility + query param for cache busting
          const fileUrl = pathToFileURL(filePath).href + `?t=${Date.now()}`
          const mod = await import(fileUrl)
          const handler = mod.default
          if (typeof handler !== 'function') {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Handler not a function for ' + rel }))
            return
          }
          // Provide minimal Express-like helpers
          if (!res.status) {
            res.status = (code) => { res.statusCode = code; return res }
            res.json = (obj) => {
              if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(obj))
            }
            res.setHeader || (res.setHeader = () => {})
          }
          // Inject early missing key guard for common error clarity
          if (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
            res.statusCode = 500
            return res.end(JSON.stringify({ error: 'Missing GOOGLE_API_KEY', hint: 'Set GOOGLE_API_KEY in .env then restart dev server.' }))
          }
          await handler(req, res)
        } catch (err) {
          console.error('[serverless-api] error handling', filePath, err)
          res.statusCode = err?.status || 500
          res.setHeader('Content-Type', 'application/json')
          const isModuleLoad = /Cannot find module|Failed to load module|Only URLs with a scheme/i.test(err?.message || '')
          res.end(JSON.stringify({ 
            error: err?.message || 'Internal Error',
            type: isModuleLoad ? 'MODULE_LOAD' : 'HANDLER_ERROR'
          }))
        }
      })
    }
  }
}
