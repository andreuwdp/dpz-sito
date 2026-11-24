// Build del sito Dpzdigital per Netlify: `node build.mjs` → cartella dist/
// Prende i contenuti più recenti da Supabase (quelli salvati dal gestionale); se non raggiungibile usa src/content.json.
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises'
import { renderBody, pageMeta, esc, themeCss, googleFontsUrl, faviconOf, orgJsonLd, LEGAL_PAGES } from './src/js/render.js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xktsduzplizvrktnnkba.supabase.co'
// chiave pubblica (solo lettura grazie alle regole RLS): può stare nel sito
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable__EuckjFnxyazivph8JmKXg_GS3TLGrI'
// indirizzi da cui il gestionale può aprire l'anteprima modificabile
const EDIT_ORIGINS = (process.env.EDIT_ORIGINS || 'https://dpz-hub.vercel.app').split(',').map((s) => s.trim()).filter(Boolean)
const OFFLINE = process.argv.includes('--offline')
// indirizzo pubblico del sito (Netlify lo fornisce in URL) per le anteprime dei link
const SITE = (process.env.URL || 'https://dpzdigital.com').replace(/\/$/, '')
const abs = (u) => (!u ? '' : /^https?:/.test(u) ? u : `${SITE}/${u.replace(/^\//, '')}`)

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
  const file = (process.argv.find((a) => a.startsWith('--content=')) || '').slice(10) || 'src/content.json'
  return { data: JSON.parse(await readFile(file, 'utf8')), version: 'file' }
}

const { data: c, version } = await loadContent()
const build = Date.now().toString(36)

// Font ospitati sul sito stesso (niente richieste a Google dai visitatori: niente dati a terzi, niente banner).
// Se il download non riesce si torna al link di Google Fonts.
async function selfHostFonts(url) {
  if (!url || OFFLINE) return null
  try {
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
    let css = await (await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) })).text()
    if (!css.includes('@font-face')) throw new Error('risposta senza font')
    await mkdir('dist/assets/fonts', { recursive: true })
    const files = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)'"]+/g) || [])]
    let n = 0
    for (const f of files) {
      const name = `f${(n++).toString(36)}-${f.split('/').pop().replace(/[^\w.-]/g, '')}`
      const res = await fetch(f, { signal: AbortSignal.timeout(15000) })
      if (!res.ok) throw new Error(`font ${res.status}`)
      await writeFile(`dist/assets/fonts/${name}`, Buffer.from(await res.arrayBuffer()))
      css = css.replaceAll(f, `fonts/${name}`)
    }
    await writeFile('dist/assets/fonts.css', css)
    console.log(`Font ospitati sul sito: ${files.length} file`)
    return `assets/fonts.css?v=${build}`
  } catch (e) { console.warn('Font non scaricati, uso Google Fonts:', e.message); return null }
}

function page(slug, file) {
  const meta = pageMeta(c, slug)
  const isHome = slug === 'home'
  const cfg = { page: file === 'servizio.html' ? '*' : slug, version, build, supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_KEY, editOrigins: EDIT_ORIGINS }
  const head = isHome
    ? `<meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <meta name="description" content="${esc(meta.description)}">\n  <meta name="theme-color" content="${esc(c.global.theme_color)}">\n  <title>${esc(meta.title)}</title>`
    : `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${meta.description ? `<meta name="description" content="${esc(meta.description)}">` : ''}<meta name="theme-color" content="${esc(c.global.theme_color)}"><title>${esc(meta.title)}</title>`
  const body = file === 'servizio.html' ? '' : renderBody(c, slug)
  const fav = faviconOf(c)
  const fonts = localFonts || googleFontsUrl(c)
  const og = c.global.share_image || c.global.logo
  const url = `${SITE}/${isHome ? '' : file}`
  const extra = [
    fav ? `<link rel="icon" href="${esc(fav)}">\n  <link rel="apple-touch-icon" href="${esc(fav)}">` : '',
    `<meta property="og:type" content="website">\n  <meta property="og:site_name" content="${esc(c.global.logo_alt)}">\n  <meta property="og:title" content="${esc(meta.title)}">${meta.description ? `\n  <meta property="og:description" content="${esc(meta.description)}">` : ''}\n  <meta property="og:url" content="${esc(url)}">${og ? `\n  <meta property="og:image" content="${esc(abs(og))}">` : ''}\n  <meta name="twitter:card" content="summary_large_image">`,
    file !== 'servizio.html' ? `<link rel="canonical" href="${esc(url)}">` : '<meta name="robots" content="noindex">',
    isHome && c.global.google_verification ? `<meta name="google-site-verification" content="${esc(String(c.global.google_verification).replace(/[^\w-]/g, ''))}">` : '',
    isHome ? `<script type="application/ld+json">${orgJsonLd(c, SITE)}</script>` : '',
    fonts ? `${localFonts ? '' : '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  '}<link rel="stylesheet" id="dpz-fonts" href="${esc(fonts)}" data-for="${esc(googleFontsUrl(c))}">` : '',
  ].filter(Boolean).join('\n  ')
  return `<!doctype html>
<html lang="it">
<head>
  ${head}
  ${extra}
  <link rel="stylesheet" id="page-css" href="assets/${isHome ? 'home' : 'service'}.css?v=${build}">${LEGAL_PAGES.includes(slug) ? '\n  <meta name="robots" content="noindex, follow">' : ''}
  <link rel="stylesheet" href="assets/menu.css?v=${build}">
  <link rel="stylesheet" href="assets/blocks.css?v=${build}">
  <style id="dpz-theme">${themeCss(c).replace(/</g, '')}</style>
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
// siti di esempio mostrati nella sezione Lavori (attività di fantasia, non indicizzati)
await cp('src/esempi', 'dist/esempi', { recursive: true })
for (const f of ['home.css', 'service.css', 'menu.css', 'blocks.css']) await cp(`src/css/${f}`, `dist/assets/${f}`)
for (const f of ['site.js', 'render.js', 'editor.js']) await cp(`src/js/${f}`, `dist/assets/${f}`)

const localFonts = await selfHostFonts(googleFontsUrl(c))
await writeFile('dist/index.html', page('home', 'index.html'))
for (const k of LEGAL_PAGES) await writeFile(`dist/${k}.html`, page(k, `${k}.html`))
for (const s of c.services) await writeFile(`dist/${s.slug}.html`, page(s.slug, `${s.slug}.html`))
// pagine servizio create dopo l'ultima pubblicazione: le disegna il browser leggendo l'indirizzo
await writeFile('dist/servizio.html', page('*', 'servizio.html'))
await writeFile('dist/content.json', JSON.stringify(c))

// Mappa del sito e robots.txt per Google (le pagine di esempio e le pagine tecniche restano fuori)
const today = new Date().toISOString().slice(0, 10)
const urls = [['', '1.0'], ...c.services.map((s) => [`${s.slug}.html`, '0.8'])]
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, pr]) => `  <url><loc>${SITE}/${u}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`)
await writeFile('dist/robots.txt', `User-agent: *
Allow: /
Disallow: /servizio.html
Disallow: /content.json

Sitemap: ${SITE}/sitemap.xml
`)

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
