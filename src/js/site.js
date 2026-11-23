// Comportamenti del sito + contenuti dal vivo + modalità modifica (dentro l'editor del gestionale).
import { renderBody, pageMeta, themeCss, googleFontsUrl, faviconOf } from './render.js'

const cfg = window.DPZ || {}
let current = cfg.page
let content = null

/* ---------- comportamenti (identici al sito originale) ---------- */
let cleanups = []
function behaviors(page, { edit = false } = {}) {
  cleanups.forEach((f) => f()); cleanups = []
  const visible = page === 'home' ? 'is-visible' : 'visible'
  if (edit) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add(visible))
  } else {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add(visible) }), { threshold: page === 'home' ? 0.14 : 0.08 })
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    cleanups.push(() => io.disconnect())
  }

  if (page === 'home') {
    const sphere = document.querySelector('.sphere-stage')
    const move = (event) => {
      if (!sphere || window.innerWidth < 768) return
      sphere.style.setProperty('--mx', `${(event.clientX / window.innerWidth - 0.5) * 18}px`)
      sphere.style.setProperty('--my', `${(event.clientY / window.innerHeight - 0.5) * 18}px`)
    }
    window.addEventListener('pointermove', move)
    cleanups.push(() => window.removeEventListener('pointermove', move))
    if (!edit) contactForm()
  }

  const b = document.getElementById('dpzBurger'); const o = document.getElementById('dpzOverlay'); const d = document.getElementById('dpzDrawer')
  if (b) {
    const set = (open) => { document.body.classList.toggle('dpz-open', open); b.setAttribute('aria-expanded', open); d.setAttribute('aria-hidden', String(!open)) }
    b.addEventListener('click', () => set(!document.body.classList.contains('dpz-open')))
    o.addEventListener('click', () => set(false))
    const key = (e) => { if (e.key === 'Escape') set(false) }
    document.addEventListener('keydown', key)
    cleanups.push(() => { document.removeEventListener('keydown', key); document.body.classList.remove('dpz-open') })
    if (!edit) d.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)))
  }
}

function contactForm() {
  const dpzForm = document.getElementById('dpzForm')
  if (!dpzForm) return
  const note = document.getElementById('dpzFormNote')
  const defaultNote = note.textContent
  dpzForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = dpzForm.querySelector('button[type=submit]')
    note.className = 'form-note'
    note.textContent = 'Invio in corso…'
    btn.disabled = true
    const fd = new FormData(dpzForm)
    const payload = { name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), message: fd.get('message'), botcheck: fd.get('botcheck') ? '1' : '', page: location.pathname.split('/').pop() || 'index.html' }
    // la richiesta va nel gestionale: da lì parte l'avviso a info@dpzdigital.com e la risposta automatica a chi scrive.
    // Web3Forms resta solo come riserva, se il gestionale o la casella email non rispondono.
    const send = (url, opts) => fetch(url, opts).then(async (r) => ({ ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) })).catch(() => ({ ok: false, status: 0, data: {} }))
    try {
      let res = cfg.supabaseUrl
        ? await send(`${cfg.supabaseUrl}/functions/v1/site-form`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: cfg.supabaseKey }, body: JSON.stringify(payload) })
        : { ok: false, status: 0, data: {} }
      // se l'avviso da info@ non è partito (casella non raggiungibile), arriva comunque tramite Web3Forms
      if (res.ok && res.data.notified === false) send(dpzForm.action, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
      if (!res.ok && (res.status === 0 || res.status >= 500)) {
        const backup = await send(dpzForm.action, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        if (backup.ok && backup.data.success) res = backup
      }
      if (res.ok) {
        note.className = 'form-note ok'
        note.textContent = 'Richiesta inviata! Ti ricontattiamo entro 24 ore.'
        dpzForm.reset()
      } else {
        note.className = 'form-note err'
        note.textContent = res.data.error || "Errore nell'invio. Riprova o scrivici su WhatsApp."
      }
    } finally {
      btn.disabled = false
      setTimeout(() => { if (note.classList.contains('ok')) { note.className = 'form-note'; note.textContent = defaultNote } }, 9000)
    }
  })
}

/* ---------- disegno della pagina ---------- */
function setMeta(c, page) {
  const m = pageMeta(c, page)
  document.title = m.title
  let d = document.querySelector('meta[name=description]')
  if (m.description) {
    if (!d) { d = document.createElement('meta'); d.name = 'description'; document.head.appendChild(d) }
    d.content = m.description
  } else if (d && page !== 'home') d.remove()
}

function setCss(page) {
  const link = document.getElementById('page-css')
  const want = `${cfg.base || ''}assets/${page === 'home' ? 'home' : 'service'}.css?v=${cfg.build || ''}`
  if (link && !link.href.endsWith(want.replace(/^\.?\//, ''))) link.setAttribute('href', want)
}

// colori, font e favicon scelti nel gestionale
function setLook(c) {
  let st = document.getElementById('dpz-theme')
  if (!st) { st = document.createElement('style'); st.id = 'dpz-theme'; document.head.appendChild(st) }
  const css = themeCss(c)
  if (st.textContent !== css) st.textContent = css
  const url = googleFontsUrl(c)
  let fl = document.getElementById('dpz-fonts')
  if (url) {
    if (!fl) { fl = document.createElement('link'); fl.id = 'dpz-fonts'; fl.rel = 'stylesheet'; document.head.insertBefore(fl, document.getElementById('page-css')) }
    if (fl.getAttribute('href') !== url) fl.setAttribute('href', url)
  } else if (fl) fl.remove()
  const fav = faviconOf(c)
  for (const rel of ['icon', 'apple-touch-icon']) {
    let l = document.querySelector(`link[rel="${rel}"]`)
    if (fav) {
      if (!l) { l = document.createElement('link'); l.rel = rel; document.head.appendChild(l) }
      if (l.getAttribute('href') !== fav) l.setAttribute('href', fav)
    } else if (l) l.remove()
  }
}

export function draw(c, page, opts = {}) {
  content = c; current = page
  setCss(page)
  setLook(c)
  document.getElementById('dpz-site').innerHTML = renderBody(c, page, opts)
  setMeta(c, page)
  behaviors(page, opts)
}

/* ---------- contenuti dal vivo da Supabase ---------- */
async function live() {
  if (!cfg.supabaseUrl) return
  try {
    const res = await fetch(`${cfg.supabaseUrl}/rest/v1/site_content?id=eq.main&select=data,updated_at`, {
      headers: { apikey: cfg.supabaseKey, Authorization: `Bearer ${cfg.supabaseKey}` },
      cache: 'no-store',
    })
    const [row] = await res.json()
    if (!row || !row.data) return
    // pagina servizio creata dopo l'ultima pubblicazione: la trova per indirizzo
    if (current === '*') current = location.pathname.split('/').pop().replace(/\.html$/, '') || 'home'
    if (row.updated_at === cfg.version && cfg.page !== '*') return
    const y = window.scrollY
    draw(row.data, current)
    window.scrollTo(0, y)
  } catch { /* senza rete resta la versione pubblicata */ }
}

/* ---------- avvio ---------- */
const params = new URLSearchParams(location.search)
if (params.has('edit') && window.parent !== window) {
  import('./editor.js').then((m) => m.start({ draw, getPage: () => current, origins: cfg.editOrigins || [] }))
} else {
  if (cfg.page !== '*') behaviors(cfg.page)
  live()
}
