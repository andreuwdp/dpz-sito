// Build del sito DPZMarketing per Netlify: `node build.mjs` → cartella dist/
// Prende i contenuti più recenti da Supabase (quelli salvati dal gestionale); se non raggiungibile usa src/content.json.
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises'
import { renderBody, pageMeta, esc } from './src/js/render.js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xktsduzplizvrktnnkba.supabase.co'
// chiave pubblica (solo lettura grazie alle regole RLS): può stare nel sito
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable__EuckjFnxyazivph8JmKXg_GS3TLGrI'
// indirizzi da cui il gestionale può aprire l'anteprima modificabile
const EDIT_ORIGINS = (process.env.EDIT_ORIGINS || 'https://dpz-hub.vercel.app').split(',').map((s) => s.trim()).filter(Boolean)
const OFFLINE = process.argv.includes('--offline')

async function loadContent() {
  if (!OFFLINE) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/site_content?id=eq.main&select=data,updated_at`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        signal: AbortSignal.timeout(8000),
      })
      const [row] = await res.json()
      if (row?.data) { console.log('Contenuti da Supabase, versione', row.updated_at); return { data: row.data, version: row.updated_at } }
    } catch (e) { console.warn('Supabase non raggiungibile, uso src/content.json:', e.message) }
  }
  return { data: JSON.parse(await readFile('src/content.json', 'utf8')), version: 'file' }
}

const { data: c, version } = await loadContent()
const build = Date.now().toString(36)

function page(slug, file) {
  const meta = pageMeta(c, slug)
  const isHome = slug === 'home'
  const cfg = { page: file === 'servizio.html' ? '*' : slug, version, build, supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_KEY, editOrigins: EDIT_ORIGINS }
  const head = isHome
    ? `<meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <meta name="description" content="${esc(meta.description)}">\n  <meta name="theme-color" content="${esc(c.global.theme_color)}">\n  <title>${esc(meta.title)}</title>`
    : `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${meta.description ? `<meta name="description" content="${esc(meta.description)}">` : ''}<meta name="theme-color" content="${esc(c.global.theme_color)}"><title>${esc(meta.title)}</title>`
  const body = file === 'servizio.html' ? '' : renderBody(c, slug)
  return `<!doctype html>
<html lang="it">
<head>
  ${head}
  <link rel="stylesheet" id="page-css" href="assets/${isHome ? 'home' : 'service'}.css?v=${build}">
  <link rel="stylesheet" href="assets/menu.css?v=${build}">
</head>
<body><div id="dpz-site">${body}</div>
<script>window.DPZ=${JSON.stringify(cfg)}</script>
<script type="module" src="assets/site.js?v=${build}"></script>
</body>
</html>
`
}

await rm('dist', { recursive: true, force: true })
await mkdir('dist/assets', { recursive: true })
await cp('src/assets', 'dist/assets', { recursive: true })
for (const f of ['home.css', 'service.css', 'menu.css']) await cp(`src/css/${f}`, `dist/assets/${f}`)
for (const f of ['site.js', 'render.js', 'editor.js']) await cp(`src/js/${f}`, `dist/assets/${f}`)

await writeFile('dist/index.html', page('home', 'index.html'))
for (const s of c.services) await writeFile(`dist/${s.slug}.html`, page(s.slug, `${s.slug}.html`))
// pagine servizio create dopo l'ultima pubblicazione: le disegna il browser leggendo l'indirizzo
await writeFile('dist/servizio.html', page('*', 'servizio.html'))
await writeFile('dist/content.json', JSON.stringify(c))

// Netlify: indirizzi senza file (es. un servizio creato dopo l'ultima pubblicazione) → servizio.html, che lo disegna dai contenuti dal vivo
await writeFile('dist/_redirects', '/*  /servizio.html  404\n')
await writeFile('dist/_headers', `/assets/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=300
/content.json
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=0, must-revalidate
/*.html
  Cache-Control: public, max-age=0, must-revalidate
/
  Cache-Control: public, max-age=0, must-revalidate
`)
console.log(`Pronto: dist/ con home + ${c.services.length} servizi (build ${build})`)
