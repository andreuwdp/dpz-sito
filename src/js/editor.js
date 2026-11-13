// Modalità modifica: gira dentro l'anteprima del gestionale (iframe) e parla con lui via postMessage.
import { rich } from './render.js'
// Non salva niente da sola: manda le modifiche al gestionale, che le tiene in bozza e le pubblica su Supabase.

let parentOrigin = null
const send = (msg) => parentOrigin && window.parent.postMessage({ ...msg, source: 'dpz-site' }, parentOrigin)

const EDITOR_CSS = `
[data-k]{outline:1px dashed transparent;outline-offset:3px;border-radius:3px;cursor:text;transition:outline-color .15s}
[data-k]:hover{outline-color:rgba(10,155,104,.55)}
[data-k]:focus{outline:2px solid #0a9b68;outline-offset:3px}
[data-img]{cursor:pointer}
[data-img]:hover{outline:2px dashed #0a9b68;outline-offset:4px}
.dpz-ed-active{box-shadow:0 0 0 2px rgba(10,155,104,.45)!important}
#dpz-ed-bar{position:fixed;z-index:2147483000;display:none;gap:4px;padding:4px;border-radius:12px;background:#06271d;box-shadow:0 10px 30px rgba(0,0,0,.25);font:600 12px/1 Arial,sans-serif}
#dpz-ed-bar button{all:unset;cursor:pointer;color:#fff;padding:8px 9px;border-radius:8px;white-space:nowrap}
#dpz-ed-bar button:hover{background:rgba(255,255,255,.14)}
#dpz-ed-bar button.danger:hover{background:#c0392b}
#dpz-ed-bar i{width:1px;background:rgba(255,255,255,.2);margin:4px 2px}
.contact-form input[data-k],.contact-form textarea[data-k]{cursor:pointer}
[data-sec-hidden]{opacity:.32;position:relative}
[data-sec-hidden]::after{content:"Nascosta sul sito";position:absolute;top:14px;right:14px;z-index:5;padding:6px 10px;border-radius:8px;background:#06271d;color:#fff;font:700 11px/1 Arial,sans-serif}
.dpz-flash{animation:dpzFlash 1.4s ease}
@keyframes dpzFlash{0%,100%{box-shadow:0 0 0 0 rgba(10,155,104,0)}25%,60%{box-shadow:0 0 0 4px rgba(10,155,104,.65)}}
`

let active = null // { anchor, item, link, img, panel, nav }
let bar
let hideTimer = null

function closestAttr(el, attr) { return el && el.closest ? el.closest(`[${attr}]`) : null }

function findTarget(target) {
  const item = closestAttr(target, 'data-list')
  const link = closestAttr(target, 'data-href')
  const img = closestAttr(target, 'data-img')
  const panel = closestAttr(target, 'data-panel')
  const nav = target.closest ? target.closest('a[href$=".html"], a[href*=".html#"]') : null
  const toggle = closestAttr(target, 'data-toggle')
  const anchor = item || link || img || panel || nav || toggle
  return anchor ? { anchor, item, link, img, panel, nav, toggle } : null
}

function placeBar() {
  if (!active) return
  const r = active.anchor.getBoundingClientRect()
  const bw = bar.offsetWidth; const bh = bar.offsetHeight
  bar.style.left = `${Math.max(8, Math.min(window.innerWidth - bw - 8, r.right - bw))}px`
  // sopra il blocco, sovrapposta di qualche pixel così passando col mouse non si "cade" nel vuoto
  bar.style.top = `${Math.max(8, r.top - bh + 4)}px`
}

function hideBar() {
  bar.style.display = 'none'
  active?.anchor.classList.remove('dpz-ed-active')
  active = null
}

function showBar(target) {
  if (!target || !target.closest || target.closest('#dpz-ed-bar')) { clearTimeout(hideTimer); return }
  const t = findTarget(target)
  if (!t) { clearTimeout(hideTimer); hideTimer = setTimeout(hideBar, 700); return }
  clearTimeout(hideTimer)
  if (active && active.anchor === t.anchor) { placeBar(); return }
  active?.anchor.classList.remove('dpz-ed-active')
  active = t
  t.anchor.classList.add('dpz-ed-active')
  const b = []
  if (t.nav) b.push(['open', '↗ Apri pagina'])
  if (t.link) b.push(['link', '🔗 Link'])
  if (t.img) b.push(['img', '🖼 Cambia immagine'])
  if (t.panel) b.push(['panel', '⚙ Impostazioni'])
  if (t.toggle) b.push(['toggle', '★ In evidenza'])
  if (t.item) {
    if (b.length) b.push(['|'])
    b.push(['up', '↑'], ['down', '↓'], ['dup', '⧉ Duplica'], ['del', '✕ Elimina'])
  }
  bar.innerHTML = b.map(([id, label]) => (id === '|' ? '<i></i>' : `<button data-act="${id}" class="${id === 'del' ? 'danger' : ''}" title="${{ up: 'Sposta prima', down: 'Sposta dopo' }[id] || ''}">${label}</button>`)).join('')
  bar.style.display = 'flex'
  placeBar()
}

function pageOf(href) {
  const f = href.split('#')[0].split('/').pop()
  return f === 'index.html' || f === '' ? 'home' : f.replace(/\.html$/, '')
}

function act(a) {
  if (!active) return
  const { item, link, img, panel, nav, toggle } = active
  if (a === 'toggle') send({ type: 'dpz:toggle', path: toggle.dataset.toggle })
  if (a === 'open') send({ type: 'dpz:nav', page: pageOf(nav.getAttribute('href')) })
  if (a === 'link') send({ type: 'dpz:link', path: link.dataset.href, href: link.getAttribute('href') })
  if (a === 'img') send({ type: 'dpz:image', path: img.dataset.img })
  if (a === 'panel') send({ type: 'dpz:panel', name: panel.dataset.panel })
  if (['up', 'down', 'dup', 'del'].includes(a)) send({ type: 'dpz:list', op: a, list: item.dataset.list, i: Number(item.dataset.i) })
  hideBar()
}

// Ripulisce l'HTML scritto a mano: tiene solo corsivo (em), grassetto e a capo.
function cleanRich(el) {
  const out = []
  const walk = (n) => {
    n.childNodes.forEach((c) => {
      if (c.nodeType === 3) out.push(c.textContent.replace(/[&<>]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[x])))
      else if (c.nodeType === 1) {
        const t = c.tagName.toLowerCase()
        if (t === 'br') out.push('<br>')
        else if (t === 'em' || t === 'i') { out.push('<em>'); walk(c); out.push('</em>') } else if (t === 'strong' || t === 'b') { out.push('<strong>'); walk(c); out.push('</strong>') } else if (t === 'div' || t === 'p') { if (out.length) out.push('<br>'); walk(c) } else walk(c)
      }
    })
  }
  walk(el)
  return out.join('').replace(/(<br>)+$/, '').replace(/<em><\/em>|<strong><\/strong>/g, '')
}

const timers = new Map()
function onInput(el) {
  clearTimeout(timers.get(el))
  timers.set(el, setTimeout(() => {
    const value = el.dataset.t === 'rich' ? cleanRich(el) : el.textContent
    send({ type: 'dpz:set', path: el.dataset.k, value })
  }, 250))
}

function makeEditable(root) {
  root.querySelectorAll('[data-k]').forEach((el) => {
    if (el.dataset.t === 'placeholder') { el.readOnly = true; return }
    el.setAttribute('contenteditable', el.dataset.t === 'rich' ? 'true' : 'plaintext-only')
    el.spellcheck = true
  })
}

// elenco di testi, immagini e link della pagina, per le schede del pannello nel gestionale
function report() {
  const seen = new Set()
  const fields = []
  document.querySelectorAll('#dpz-site [data-k]').forEach((el) => {
    const path = el.dataset.k
    if (seen.has(path)) return
    seen.add(path)
    const t = el.dataset.t
    fields.push({ path, type: t, value: t === 'placeholder' ? el.getAttribute('placeholder') : t === 'rich' ? cleanRich(el) : el.textContent, sec: el.closest('[data-sec]')?.dataset.sec ?? null })
  })
  const images = [...new Map([...document.querySelectorAll('#dpz-site [data-img]')].map((el) => [el.dataset.img, { path: el.dataset.img, src: el.getAttribute('src'), sec: el.closest('[data-sec]')?.dataset.sec ?? null }])).values()]
  const links = [...new Map([...document.querySelectorAll('#dpz-site [data-href]')].map((el) => [el.dataset.href, { path: el.dataset.href, href: el.getAttribute('href'), label: el.textContent.trim().replace(/\s+/g, ' ') }])).values()]
  send({ type: 'dpz:fields', fields, images, links })
}

function flash(el) {
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.remove('dpz-flash'); void el.offsetWidth; el.classList.add('dpz-flash')
}

export function start({ draw, getPage, origins }) {
  const style = document.createElement('style'); style.textContent = EDITOR_CSS; document.head.appendChild(style)
  bar = document.createElement('div'); bar.id = 'dpz-ed-bar'; document.documentElement.appendChild(bar)
  bar.addEventListener('mousedown', (e) => e.preventDefault())
  bar.addEventListener('mouseenter', () => clearTimeout(hideTimer))
  bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) act(b.dataset.act) })

  const site = document.getElementById('dpz-site')
  const render = (c, page) => { hideBar(); const same = page === getPage(); const y = window.scrollY; draw(c, page, { edit: true }); makeEditable(site); if (same) window.scrollTo(0, y); report() }

  window.addEventListener('message', (e) => {
    const m = e.data
    if (!m || m.source !== 'dpz-hub') return
    if (origins.length && !origins.includes(e.origin) && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(e.origin)) return
    parentOrigin = e.origin
    if (m.type === 'dpz:load') { const same = m.page === getPage(); render(m.content, m.page); if (!same) window.scrollTo(0, 0) }
    if (m.type === 'dpz:patch') {
      document.querySelectorAll(`[data-k="${CSS.escape(m.path)}"]`).forEach((el) => {
        if (el === document.activeElement && document.hasFocus()) return
        if (el.dataset.t === 'placeholder') el.setAttribute('placeholder', m.value)
        else if (el.dataset.t === 'rich') el.innerHTML = rich(m.value)
        else el.textContent = m.value
      })
    }
    if (m.type === 'dpz:focus') flash(document.querySelector(`[data-k="${CSS.escape(m.path)}"], [data-img="${CSS.escape(m.path)}"], [data-href="${CSS.escape(m.path)}"]`))
    if (m.type === 'dpz:showSec') flash(document.querySelector(`[data-sec="${Number(m.n)}"]`))
    if (m.type === 'dpz:scrollTo') document.querySelector(m.selector)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })

  // niente navigazione né invio del modulo mentre si modifica
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a, button')
    if (a && !a.closest('#dpz-ed-bar') && !a.matches('.dpz-burger')) e.preventDefault()
    const ph = e.target.closest('[data-t="placeholder"]')
    if (ph) send({ type: 'dpz:ask', path: ph.dataset.k, value: ph.getAttribute('placeholder'), label: 'Testo di esempio del campo' })
    const kEl = e.target.closest('[data-k]')
    if (kEl) send({ type: 'dpz:picked', path: kEl.dataset.k })
    const im = e.target.closest('[data-img]')
    if (im) send({ type: 'dpz:image', path: im.dataset.img })
    showBar(e.target)
  }, true)
  document.addEventListener('submit', (e) => e.preventDefault(), true)
  document.addEventListener('mouseover', (e) => showBar(e.target))
  window.addEventListener('scroll', placeBar, { passive: true })

  site.addEventListener('input', (e) => { const el = e.target.closest('[data-k]'); if (el) onInput(el) })
  site.addEventListener('keydown', (e) => {
    const el = e.target.closest('[data-k]')
    if (!el) return
    if (e.key === 'Enter') {
      e.preventDefault()
      if (el.dataset.t === 'rich') { document.execCommand('insertLineBreak'); onInput(el) } else el.blur()
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i' && el.dataset.t === 'rich') { e.preventDefault(); document.execCommand('italic'); onInput(el) }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') e.preventDefault()
  })
  site.addEventListener('paste', (e) => {
    const el = e.target.closest('[data-k]')
    if (!el) return
    e.preventDefault()
    document.execCommand('insertText', false, (e.clipboardData.getData('text/plain') || '').replace(/\s*\n\s*/g, ' '))
  })

  window.parent.postMessage({ type: 'dpz:ready', source: 'dpz-site' }, '*')
}
