// Motore del sito Dpzdigital: costruisce l'HTML delle pagine a partire dai contenuti (content.json / Supabase).
// Lo stesso file gira nel build (Node) e nel browser (aggiornamenti dal vivo e modalità modifica del gestionale).
// In modalità modifica (opts.edit) aggiunge gli attributi data-* che l'editor usa per sapere cosa si può cambiare.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c])

// Testo con formattazione minima: solo <em>, <strong>, <b>, <br>. Tutto il resto viene ripulito.
export function rich(s) {
  return esc(s)
    .replace(/&lt;(\/?)(em|strong|b)&gt;/gi, '<$1$2>')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
}

export const telHref = (phone) => `tel:${String(phone || '').replace(/[^\d+]/g, '')}`
export const waHref = (wa) => `https://wa.me/${String(wa || '').replace(/\D/g, '')}`

function helpers(edit, c) {
  const styles = (c && c.styles) || {}
  // grandezza scelta per un singolo testo (scheda Testi): 1 = normale
  const st = (path) => (styles[path] && Number(styles[path]) !== 1 ? ` style="zoom:${Number(styles[path])}"` : '')
  const k = (path, type = 'text') => (edit ? ` data-k="${path}" data-t="${type}"` : '') + st(path)
  return {
    edit,
    k,
    // testo che non ha un elemento tutto suo (es. etichetta di un bottone con freccia)
    w: (path, v, type = 'text') => (edit || st(path) ? `<dpz-t${k(path, type)}>${type === 'rich' ? rich(v) : esc(v)}</dpz-t>` : type === 'rich' ? rich(v) : esc(v)),
    href: (path) => (edit ? ` data-href="${path}"` : ''),
    img: (path) => (edit ? ` data-img="${path}"` : ''),
    item: (list, i) => (edit ? ` data-list="${list}" data-i="${i}"` : ''),
    list: (list) => (edit ? ` data-listbox="${list}"` : ''),
    panel: (name) => (edit ? ` data-panel="${name}"` : ''),
    toggle: (path) => (edit ? ` data-toggle="${path}"` : ''),
  }
}

/* ---------- sezioni: ordine, visibilità, blocchi pronti ---------- */
export const HOME_SECTIONS = ['hero', 'values', 'services', 'ecosystem', 'method', 'numbers', 'wow', 'contact']
export const SERVICE_SECTIONS = ['hero', 'intro', 'two', 'includes', 'process', 'outcomes', 'contact']
export const SECTION_LABELS = {
  home: { hero: 'Apertura', values: 'Perché noi', services: 'Servizi', ecosystem: 'Ecosistema', method: 'Metodo', numbers: 'Numeri', wow: 'Control center', contact: 'Contatti e modulo' },
  service: { hero: 'Apertura', intro: 'Il servizio', two: 'Problema e soluzione', includes: 'Cosa comprende', process: 'Come lavoriamo', outcomes: 'Il risultato', contact: 'Prossimo passo' },
}

// percorso dell'elenco sezioni di una pagina ("home.sections" o "services.3.sections")
export function sectionsPath(c, page) {
  if (page === 'home') return 'home.sections'
  const i = c.services.findIndex((s) => s.slug === page)
  return i < 0 ? null : `services.${i}.sections`
}
export function sectionsOf(c, page) {
  const own = page === 'home' ? c.home.sections : c.services.find((s) => s.slug === page)?.sections
  if (Array.isArray(own) && own.length) return own
  return (page === 'home' ? HOME_SECTIONS : SERVICE_SECTIONS).map((id) => ({ id, type: id }))
}

function sectionsHtml(c, page, S, h, opts) {
  const list = sectionsOf(c, page)
  const base = sectionsPath(c, page)
  return list.map((sec, n) => {
    if (sec.hidden && !opts.edit) return ''
    let html = S[sec.type] ? S[sec.type]() : BLOCKS[sec.type] ? BLOCKS[sec.type].render(sec.data || {}, `${base}.${n}.data`, h) : ''
    const anchor = String(sec.data?.anchor || '').replace(/[^a-z0-9-]/gi, '')
    if (anchor && html) html = html.replace(/^<(\w+)/, `<$1 id="${anchor}"`)
    if (!opts.edit || !html) return html
    // in modifica: ogni sezione sa chi è (per evidenziarla e scorrere fin lì dal pannello)
    return html.replace(/^<(\w+)/, `<$1 data-sec="${n}"${sec.hidden ? ' data-sec-hidden' : ''}`)
  }).join('')
}

/* ---------- aspetto: colori, font, grandezze ---------- */
export const COLOR_TOKENS = [
  ['green', 'Colore principale', 'Scritte in evidenza, link, numeri, sezioni verdi', '#087653'],
  ['green-2', 'Pulsanti e luci', 'Punti luminosi e dettagli accesi', '#0a9b68'],
  ['mint', 'Accento chiaro', 'Scritte chiare sulle sezioni scure', '#96e7c0'],
  ['ink', 'Testo e sezioni scure', 'Titoli, testo principale e sfondi scuri', '#06271d'],
  ['sec', 'Testo secondario', 'Descrizioni e sottotitoli', '#617970'],
  ['sup', 'Riquadri chiari', 'Sfondi chiari di sezioni e schede', '#f7faf8'],
  ['line', 'Bordi', 'Linee e contorni', '#dce9e3'],
  ['bg', 'Sfondo pagina', 'Il colore di fondo', '#ffffff'],
]
export const FONTS = [
  ['', 'Originale (Arial)'], ['Inter', 'Inter'], ['DM Sans', 'DM Sans'], ['Manrope', 'Manrope'], ['Poppins', 'Poppins'],
  ['Montserrat', 'Montserrat'], ['Space Grotesk', 'Space Grotesk'], ['Plus Jakarta Sans', 'Plus Jakarta Sans'],
  ['Playfair Display', 'Playfair Display'], ['Fraunces', 'Fraunces'], ['Instrument Serif', 'Instrument Serif'], ['Georgia', 'Georgia'],
]
export const SIZES = [[0.85, 'Piccolo'], [1, 'Normale'], [1.15, 'Grande'], [1.3, 'Molto grande']]
const SYSTEM_FONTS = ['Georgia', 'Arial']
const isHex = (v) => /^#[0-9a-f]{3,8}$/i.test(String(v || ''))
const fontStack = (f, fallback) => `"${String(f).replace(/["<>;{}]/g, '')}", ${fallback}`

export function googleFontsUrl(c) {
  const f = c.theme?.fonts || {}
  const fams = [...new Set([f.title, f.text, f.accent].filter((x) => x && !SYSTEM_FONTS.includes(x)))]
  if (!fams.length) return ''
  return `https://fonts.googleapis.com/css2?${fams.map((x) => `family=${encodeURIComponent(x).replace(/%20/g, '+')}:ital,wght@0,400;0,500;0,700;0,800;1,400`).join('&')}&display=swap`
}

// CSS dell'aspetto scelto nel gestionale. Vuoto = sito identico all'originale.
export function themeCss(c) {
  const t = c.theme || {}; const col = t.colors || {}; const f = t.fonts || {}; const sz = t.sizes || {}
  const vars = []
  for (const [k] of COLOR_TOKENS) if (isHex(col[k])) vars.push(`--t-${k}:${col[k]}`)
  if (isHex(col.green)) vars.push(`--t-deep:color-mix(in srgb, ${col.green} 55%, #000)`)
  if (f.text) vars.push(`--font-text:${fontStack(f.text, 'Arial, Helvetica, sans-serif')}`)
  if (f.accent) vars.push(`--font-accent:${fontStack(f.accent, 'Georgia, serif')}`)
  let css = vars.length ? `:root{${vars.join(';')}}` : ''
  if (isHex(col.bg)) css += `body{background:${col.bg}}`
  if (f.title) css += `h1,h2,h3{font-family:${fontStack(f.title, 'Arial, Helvetica, sans-serif')}}`
  if (Number(sz.title) && Number(sz.title) !== 1) css += `h1,h2{zoom:${Number(sz.title)}}`
  if (Number(sz.text) && Number(sz.text) !== 1) css += `p,li,.blk-faq summary{zoom:${Number(sz.text)}}`
  return css
}

// Bottone/link con etichetta + freccia: <a ...>Etichetta <span>↗</span></a>
function btn(h, path, l, cls, extra = '') {
  return `<a class="${cls}" href="${esc(l.href)}"${h.href(path)}${extra}>${h.w(`${path}.label`, l.label)}${l.arrow ? ` <span>${h.w(`${path}.arrow`, l.arrow)}</span>` : ''}</a>`
}

// Voci del menù laterale per le sezioni aggiunte in home (Lavori, Gestionali, Casi studio, Team...)
function menuSections(c, page) {
  const pre = page === 'home' ? '' : 'index.html'
  const cap = (t) => { t = String(t || '').replace(/<[^>]*>/g, '').replace(/[*_]/g, '').trim().toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1) }
  const links = sectionsOf(c, 'home')
    .filter((s) => !s.hidden && BLOCKS[s.type] && s.data?.anchor && (!Array.isArray(s.data.items) || s.data.items.some((x) => !x?.hidden)))
    .map((s) => `<a href="${pre}#${esc(String(s.data.anchor).replace(/[^a-z0-9-]/gi, ''))}">${esc(s.data.menu || cap(s.data.kicker || s.data.title))}</a>`)
  return links.length ? `<nav class="dpz-nav-sections">${links.join('')}</nav>` : ''
}

export function renderMenu(c, opts = {}) {
  const h = helpers(opts.edit, c); const g = c.global
  const items = c.services.map((s, i) => `<a href="${esc(s.slug)}.html"${h.item('services', i)}><b>${esc(s.num)}</b>${h.w(`services.${i}.menu_label`, s.menu_label)}</a>`).join('')
  return `<button class="dpz-burger" id="dpzBurger" aria-label="Apri menu" aria-controls="dpzDrawer" aria-expanded="false"><span></span><span></span><span></span></button><div class="dpz-overlay" id="dpzOverlay"></div><aside class="dpz-drawer" id="dpzDrawer" aria-hidden="true"><span class="dpz-eyebrow"${h.k('global.menu.eyebrow')}>${esc(g.menu.eyebrow)}</span><a class="dpz-nav-home" href="index.html"${h.k('global.menu.home')}>${esc(g.menu.home)}</a>${menuSections(c, opts.page)}<nav class="dpz-nav-services"${h.list('services')}>${items}</nav>${btn(h, 'global.menu.book', g.menu.book, 'dpz-book')}</aside>`
}

export function renderHome(c, opts = {}) {
  const h = helpers(opts.edit, c); const { home: p, global: g } = c
  const logo = (cls, path = 'global.logo') => `<img class="${cls}" src="${esc(g.logo)}" alt="${esc(g.logo_alt)}"${h.img(path)}/>`
  const hero = p.hero
  const values = p.values.items.map((v, i) => `<article class="value-card reveal" style="transition-delay:${i * 90}ms"${h.item('home.values.items', i)}><div class="value-top"><span${h.k(`home.values.items.${i}.num`)}>${esc(v.num)}</span><i${h.k(`home.values.items.${i}.icon`)}>${esc(v.icon)}</i></div><h3${h.k(`home.values.items.${i}.title`)}>${esc(v.title)}</h3><p${h.k(`home.values.items.${i}.text`)}>${esc(v.text)}</p><div class="value-line"></div></article>`).join('')
  const services = c.services.map((s, i) => `<a href="${esc(s.slug)}.html" class="service-card reveal ${s.card.featured ? 'service-featured' : ''}" style="transition-delay:${(i % 4) * 70}ms"${h.item('services', i)}${h.panel(`service:${i}`)}><div class="service-meta"><span>${esc(s.num)}</span><small${h.k(`services.${i}.card.tag`)}>${esc(s.card.tag)}</small><i${h.k(`services.${i}.card.icon`)}>${esc(s.card.icon)}</i></div><div class="service-copy"><h3${h.k(`services.${i}.card.title`)}>${esc(s.card.title)}</h3><p${h.k(`services.${i}.card.text`)}>${esc(s.card.text)}</p></div><span class="service-arrow">↗</span></a>`).join('')
  const eco = p.ecosystem
  const nodes = eco.nodes.map((n, i) => `<div class="map-node n${i + 1}"${h.item('home.ecosystem.nodes', i)}><i${h.k(`home.ecosystem.nodes.${i}.icon`)}>${esc(n.icon)}</i><span${h.k(`home.ecosystem.nodes.${i}.label`, 'rich')}>${rich(n.label)}</span></div>`).join('')
  const lines = eco.nodes.map((_, i) => `<i class="line l${i + 1}"></i>`).join('')
  const steps = p.method.steps.map((s, i) => `<article class="timeline-step reveal" style="transition-delay:${i * 60}ms"${h.item('home.method.steps', i)}><div class="step-dot"><i></i></div><span class="step-number"${h.k(`home.method.steps.${i}.num`)}>${esc(s.num)}</span><div><h3${h.k(`home.method.steps.${i}.title`)}>${esc(s.title)}</h3><p${h.k(`home.method.steps.${i}.text`)}>${esc(s.text)}</p></div></article>`).join('')
  const stats = p.numbers.stats.map((s, i) => `<div class="stat reveal" style="transition-delay:${i * 80}ms"${h.item('home.numbers.stats', i)}><strong${h.k(`home.numbers.stats.${i}.value`)}>${esc(s.value)}</strong><span${h.k(`home.numbers.stats.${i}.label`)}>${esc(s.label)}</span></div>`).join('')
  const w = p.wow
  const bars = w.bars.map((b) => `<i style="height:${Number(b) || 0}%"></i>`).join('')
  const tags = w.tags.map((t, i) => `<span${h.item('home.wow.tags', i)}${h.k(`home.wow.tags.${i}`)}>${esc(t)}</span>`).join('')
  const ct = p.contact; const ff = ct.form_fields; const co = g.contacts
  const field = (id, type, name, required) => `<label for="f-${id}"${h.k(`home.contact.form_fields.${id}.label`)}>${esc(ff[id].label)}</label>`
    .replace('</label>', id === 'phone' ? ` <em class="opt"${h.k('home.contact.form_optional')}>${esc(ct.form_optional)}</em></label>` : '</label>')
    + (type === 'textarea'
      ? `<textarea id="f-${id}" name="${name}" required placeholder="${esc(ff[id].placeholder)}"${h.k(`home.contact.form_fields.${id}.placeholder`, 'placeholder')}></textarea>`
      : `<input id="f-${id}" type="${type}" name="${name}"${required ? ' required' : ''} placeholder="${esc(ff[id].placeholder)}"${h.k(`home.contact.form_fields.${id}.placeholder`, 'placeholder')}>`)
  // le etichette dei campi sono "testo + eventuale (facoltativo)": in modifica separiamo il testo
  const fieldE = (id, type, name, required) => opts.edit
    ? `<label for="f-${id}"><dpz-t${h.k(`home.contact.form_fields.${id}.label`)}>${esc(ff[id].label)}</dpz-t>${id === 'phone' ? ` <em class="opt"${h.k('home.contact.form_optional')}>${esc(ct.form_optional)}</em>` : ''}</label>` + field(id, type, name, required).replace(/^<label[\s\S]*?<\/label>/, '')
    : field(id, type, name, required)

  const nav = `<main><nav class="nav"><a class="brand" href="#home" aria-label="${esc(g.logo_alt)} home">${logo('brand-logo')}</a><div class="nav-links"${h.list('home.nav.links')}>${p.nav.links.map((l, i) => `<a href="${esc(l.href)}"${h.item('home.nav.links', i)}${h.href(`home.nav.links.${i}`)}${h.k(`home.nav.links.${i}.label`)}>${esc(l.label)}</a>`).join('')}</div>${btn(h, 'home.nav.cta', p.nav.cta, 'nav-cta')}</nav>`
  const S = {
    hero: () => `<section class="hero" id="home"><div class="hero-grid" aria-hidden="true"></div><div class="hero-glow glow-one" aria-hidden="true"></div><div class="hero-glow glow-two" aria-hidden="true"></div><div class="hero-copy"><div class="eyebrow"><span></span> ${h.w('home.hero.eyebrow', hero.eyebrow)}</div><h1${h.k('home.hero.title', 'rich')}>${rich(hero.title)}</h1><p${h.k('home.hero.text')}>${esc(hero.text)}</p><div class="hero-actions">${btn(h, 'home.hero.cta1', hero.cta1, 'button primary')}${btn(h, 'home.hero.cta2', hero.cta2, 'button secondary')}</div><div class="trust-line"><div class="avatar-stack">${hero.avatars.map((a, i) => `<i${h.k(`home.hero.avatars.${i}`)}>${esc(a)}</i>`).join('')}</div><span${h.k('home.hero.trust')}>${esc(hero.trust)}</span></div></div><div class="hero-visual" aria-label="${esc(hero.visual_label)}"><div class="sphere-stage">${['a', 'b', 'c'].map((x, i) => `<div class="orbit orbit-${x}"><span${h.k(`home.hero.orbits.${i}`)}>${esc(hero.orbits[i] ?? '')}</span></div>`).join('')}<div class="sphere"><div class="sphere-shine"></div><div class="sphere-core"><b${h.k('home.hero.sphere_title')}>${esc(hero.sphere_title)}</b><small${h.k('home.hero.sphere_sub')}>${esc(hero.sphere_sub)}</small></div></div><div class="float-card card-top"><span class="status-dot"></span><div><small${h.k('home.hero.card_top_small')}>${esc(hero.card_top_small)}</small><b${h.k('home.hero.card_top_value')}>${esc(hero.card_top_value)}</b></div></div><div class="float-card card-bottom"><small${h.k('home.hero.card_bottom_small')}>${esc(hero.card_bottom_small)}</small><b>${h.w('home.hero.card_bottom_value', hero.card_bottom_value)} <span class="mini-chart"${h.k('home.hero.card_bottom_icon')}>${esc(hero.card_bottom_icon)}</span></b></div></div></div><div class="scroll-hint"><span></span> ${h.w('home.hero.scroll_hint', hero.scroll_hint)}</div></section>`,
    values: () => `<section class="section values-section"><div class="section-heading reveal"><div><span class="kicker"${h.k('home.values.kicker')}>${esc(p.values.kicker)}</span><h2${h.k('home.values.title', 'rich')}>${rich(p.values.title)}</h2></div><p${h.k('home.values.text')}>${esc(p.values.text)}</p></div><div class="value-grid"${h.list('home.values.items')}>${values}</div></section>`,
    services: () => `<section class="services-section" id="servizi"><div class="services-heading reveal"><div><span class="kicker"${h.k('home.services.kicker')}>${esc(p.services.kicker)}</span><h2${h.k('home.services.title', 'rich')}>${rich(p.services.title)}</h2></div><div class="services-intro"><p${h.k('home.services.text')}>${esc(p.services.text)}</p>${btn(h, 'home.services.link', p.services.link, 'services-link')}</div></div><div class="services-grid"${h.list('services')}>${services}</div></section>`,
    ecosystem: () => `<section class="ecosystem-section" id="ecosistema"><div class="ecosystem-copy reveal"><span class="kicker light"${h.k('home.ecosystem.kicker')}>${esc(eco.kicker)}</span><h2${h.k('home.ecosystem.title', 'rich')}>${rich(eco.title)}</h2><p${h.k('home.ecosystem.text')}>${esc(eco.text)}</p>${btn(h, 'home.ecosystem.link', eco.link, 'text-link')}</div><div class="ecosystem-map reveal"><div class="map-lines" aria-hidden="true">${lines}</div><div class="map-center"><img class="map-logo" src="${esc(eco.center_logo)}" alt=""${h.img('home.ecosystem.center_logo')}/><b${h.k('home.ecosystem.center_label', 'rich')}>${rich(eco.center_label)}</b></div>${nodes}<div class="map-pulse p1"></div><div class="map-pulse p2"></div></div></section>`,
    method: () => `<section class="section method-section" id="metodo"><div class="method-intro reveal"><span class="kicker"${h.k('home.method.kicker')}>${esc(p.method.kicker)}</span><h2${h.k('home.method.title', 'rich')}>${rich(p.method.title)}</h2><p${h.k('home.method.text')}>${esc(p.method.text)}</p></div><div class="timeline"${h.list('home.method.steps')}><div class="timeline-rail" aria-hidden="true"><i></i></div>${steps}</div></section>`,
    numbers: () => `<section class="numbers-section" id="numeri"><div class="numbers-head reveal"><span class="kicker light"${h.k('home.numbers.kicker')}>${esc(p.numbers.kicker)}</span><h2${h.k('home.numbers.title', 'rich')}>${rich(p.numbers.title)}</h2><p${h.k('home.numbers.text')}>${esc(p.numbers.text)}</p></div><div class="stats-grid"${h.list('home.numbers.stats')}>${stats}</div></section>`,
    wow: () => `<section class="wow-section"><div class="wow-orbit" aria-hidden="true"><i></i><i></i><i></i></div><div class="wow-copy reveal"><span class="kicker light"${h.k('home.wow.kicker')}>${esc(w.kicker)}</span><h2${h.k('home.wow.title', 'rich')}>${rich(w.title)}</h2><p${h.k('home.wow.text')}>${esc(w.text)}</p>${btn(h, 'home.wow.button', w.button, 'button white')}</div><div class="control-center reveal"><div class="control-top"><div><span class="status-dot"></span> ${h.w('home.wow.panel_title', w.panel_title)}</div><small${h.k('home.wow.panel_status')}>${esc(w.panel_status)}</small></div><div class="control-body"><div class="control-metric"><small${h.k('home.wow.metric_label')}>${esc(w.metric_label)}</small><strong${h.k('home.wow.metric_value')}>${esc(w.metric_value)}</strong><span${h.k('home.wow.metric_delta')}>${esc(w.metric_delta)}</span></div><div class="bars"${h.panel('bars')}>${bars}</div><div class="control-tags"${h.list('home.wow.tags')}>${tags}</div></div></div></section>`,
    contact: () => `<section class="contact-section" id="contatti"><div class="contact-wrap"><div class="contact-left"><span class="kicker"${h.k('home.contact.kicker')}>${esc(ct.kicker)}</span><h2${h.k('home.contact.title', 'rich')}>${rich(ct.title)}</h2><p class="contact-lead"${h.k('home.contact.lead')}>${esc(ct.lead)}</p><div class="contact-methods">`
      + `<a class="contact-method wa" href="${waHref(co.whatsapp)}" target="_blank" rel="noopener"${h.panel('contacts')}><span class="cm-ico"><svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.7 5.4 2 7.8L.5 31.5l7.9-2c2.3 1.2 4.9 1.9 7.6 1.9 8.6 0 15.5-6.9 15.5-15.5S24.6.5 16 .5zm0 28.3c-2.4 0-4.7-.6-6.7-1.8l-.5-.3-4.7 1.2 1.3-4.6-.3-.5c-1.3-2.1-2-4.5-2-7 0-7.2 5.9-13.1 13.1-13.1S29.1 8.8 29.1 16 23.2 28.8 16 28.8zm7.2-9.8c-.4-.2-2.3-1.1-2.7-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.2 1.5-.2.2-.4.3-.8.1-.4-.2-1.7-.6-3.2-2-1.2-1.1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8.2-.2.4-.4.6-.7.2-.2.3-.4.4-.7.1-.2 0-.5 0-.7-.1-.2-.9-2.1-1.2-2.9-.3-.8-.6-.7-.9-.7h-.7c-.2 0-.6.1-1 .5-.3.4-1.3 1.3-1.3 3.1s1.3 3.6 1.5 3.9c.2.2 2.6 4 6.3 5.6.9.4 1.6.6 2.1.8.9.3 1.7.2 2.3.1.7-.1 2.3-.9 2.6-1.8.3-.9.3-1.6.2-1.8-.1-.1-.3-.2-.7-.4z"/></svg></span><span class="cm-txt">${h.w('home.contact.wa_label', ct.wa_label)}<small>${esc(co.phone)} · ${h.w('home.contact.wa_note', ct.wa_note)}</small></span></a>`
      + `<a class="contact-method" href="${telHref(co.phone)}"${h.panel('contacts')}><span class="cm-ico">&#9742;</span><span class="cm-txt">${h.w('home.contact.call_label', ct.call_label)}<small>${esc(co.phone)}</small></span></a>`
      + `<a class="contact-method" href="mailto:${esc(co.email)}"${h.panel('contacts')}><span class="cm-ico">&#9993;</span><span class="cm-txt">${h.w('home.contact.mail_label', ct.mail_label)}<small>${esc(co.email)}</small></span></a></div>${g.legal ? `<p class="contact-legal">${esc(g.legal)}</p>` : ''}</div>`
      + `<form class="contact-form" id="dpzForm" action="https://api.web3forms.com/submit" method="POST"><input type="hidden" name="access_key" value="${esc(g.form.access_key)}"><input type="hidden" name="subject" value="${esc(g.form.subject)}"><input type="hidden" name="from_name" value="${esc(g.form.from_name)}"><input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off"><h3${h.k('home.contact.form_title')}>${esc(ct.form_title)}</h3>${fieldE('name', 'text', 'name', true)}${fieldE('email', 'email', 'email', true)}${fieldE('phone', 'tel', 'phone', false)}${fieldE('msg', 'textarea', 'message', true)}<button class="button primary" type="submit">${h.w('home.contact.form_button', ct.form_button)} <span>&#8599;</span></button><p class="form-note" id="dpzFormNote"${h.k('home.contact.form_note')}>${esc(ct.form_note)}</p></form></div></section>`,
  }
  return nav + sectionsHtml(c, 'home', S, h, opts) + `<footer><a class="brand footer-brand" href="#home">${logo('brand-logo footer-logo')}</a><p${h.k('home.footer.tagline')}>${esc(p.footer.tagline)}</p><span>${h.w('home.footer.copyright', p.footer.copyright)}${legal(c, h)}</span></footer></main>`
}

export function renderService(c, i, opts = {}) {
  const h = helpers(opts.edit, c); const s = c.services[i]; const g = c.global
  const P = `services.${i}`
  if (!s) return '<main style="padding:180px 8vw;font-family:Arial,sans-serif"><h1>Pagina non trovata</h1><p><a href="index.html" style="color:#087653">Torna alla home</a></p></main>'
  const logo = `<img src="${esc(g.logo)}" alt="${esc(g.logo_alt)}"${h.img('global.logo')}>`
  const nav = `<nav class="nav"><a href="index.html">${logo}</a><a href="#contatti"${h.k(`${P}.nav_cta`)}>${esc(s.nav_cta)}</a></nav>`
  const S = {
    hero: () => `<header class="hero"><div class="grid"></div><div class="reveal"><div class="number"${h.k(`${P}.num`)}>${esc(s.num)}</div><h1${h.k(`${P}.title`, 'rich')}>${rich(s.title)}</h1><p${h.k(`${P}.hero_text`)}>${esc(s.hero_text)}</p><a class="btn" href="${esc(s.hero_cta.href)}"${h.href(`${P}.hero_cta`)}${h.k(`${P}.hero_cta.label`)}>${esc(s.hero_cta.label)}</a></div><div class="visual reveal"><div class="orbit"><b${h.k(`${P}.icon`)}>${esc(s.icon)}</b></div></div></header>`,
    intro: () => `<section class="intro"><span class="kicker reveal"${h.k(`${P}.intro_kicker`)}>${esc(s.intro_kicker)}</span><p class="reveal"${h.k(`${P}.intro`)}>${esc(s.intro)}</p></section>`,
    two: () => `<section class="two">${['problem', 'solution'].map((k) => `<article class="panel ${k} reveal"><small${h.k(`${P}.${k}.label`)}>${esc(s[k].label)}</small><h2${h.k(`${P}.${k}.title`, 'rich')}>${rich(s[k].title)}</h2><p${h.k(`${P}.${k}.text`)}>${esc(s[k].text)}</p></article>`).join('')}</section>`,
    includes: () => `<section class="includes"><div class="heading reveal"><span class="kicker"${h.k(`${P}.includes.kicker`)}>${esc(s.includes.kicker)}</span><h2${h.k(`${P}.includes.title`, 'rich')}>${rich(s.includes.title)}</h2></div><div class="list"${h.list(`${P}.includes.items`)}>${s.includes.items.map((r, j) => `<div class="row reveal"${h.item(`${P}.includes.items`, j)}><span${h.k(`${P}.includes.items.${j}.num`)}>${esc(r.num)}</span><b${h.k(`${P}.includes.items.${j}.text`)}>${esc(r.text)}</b><i${h.k(`${P}.includes.items.${j}.icon`)}>${esc(r.icon)}</i></div>`).join('')}</div></section>`,
    process: () => `<section class="process"><div class="heading reveal"><span class="kicker"${h.k(`${P}.process.kicker`)}>${esc(s.process.kicker)}</span><h2${h.k(`${P}.process.title`, 'rich')}>${rich(s.process.title)}</h2></div><div class="flow"${h.list(`${P}.process.steps`)}>${s.process.steps.map((x, j) => `<div class="step reveal"${h.item(`${P}.process.steps`, j)}><span${h.k(`${P}.process.steps.${j}.num`)}>${esc(x.num)}</span><b${h.k(`${P}.process.steps.${j}.title`)}>${esc(x.title)}</b></div>`).join('')}</div></section>`,
    outcomes: () => `<section class="outcomes"><div class="heading reveal"><span class="kicker"${h.k(`${P}.outcomes.kicker`)}>${esc(s.outcomes.kicker)}</span><h2${h.k(`${P}.outcomes.title`, 'rich')}>${rich(s.outcomes.title)}</h2><p${h.k(`${P}.outcomes.text`)}>${esc(s.outcomes.text)}</p></div><div class="cards"${h.list(`${P}.outcomes.cards`)}>${s.outcomes.cards.map((x, j) => `<div class="card reveal"${h.item(`${P}.outcomes.cards`, j)}><span${h.k(`${P}.outcomes.cards.${j}.num`)}>${esc(x.num)}</span><b${h.k(`${P}.outcomes.cards.${j}.title`)}>${esc(x.title)}</b></div>`).join('')}</div></section>`,
    contact: () => `<section class="contact" id="contatti"><div><span class="kicker"${h.k(`${P}.contact.kicker`)}>${esc(s.contact.kicker)}</span><h2${h.k(`${P}.contact.title`, 'rich')}>${rich(s.contact.title)}</h2></div><a class="circle" href="${esc(s.contact.button.href || `mailto:${g.contacts.email}`)}"${h.href(`${P}.contact.button`)}${h.k(`${P}.contact.button.label`)}>${esc(s.contact.button.label)}</a></section>`,
  }
  return nav + sectionsHtml(c, s.slug, S, h, opts) + `<footer>${logo}<span>${h.w(`${P}.footer`, s.footer)}${legal(c, h)}</span></footer>`
}

export const faviconOf = (c) => c.global.favicon || ''

// Dati dell'attività in fondo a ogni pagina (obbligatori per legge sul sito di un'attività)
function legal(c, h) {
  const l = c.global.legal
  return l ? `<small class="footer-legal"${h.k('global.legal')}>${esc(l)}</small>` : ''
}

// Dati strutturati per Google e per gli assistenti AI: chi è il titolare del sito
export function orgJsonLd(c, url) {
  const o = c.global.org || {}
  const ld = {
    '@context': 'https://schema.org', '@type': 'ProfessionalService',
    name: c.global.logo_alt, url, email: c.global.contacts.email, telephone: c.global.contacts.phone,
    description: c.home.seo.description,
    ...(o.founder ? { founder: { '@type': 'Person', name: o.founder } } : {}),
    ...(o.vat ? { vatID: o.vat } : {}),
    ...(o.legal_name ? { legalName: o.legal_name } : {}),
    ...(o.city ? { address: { '@type': 'PostalAddress', addressLocality: o.city, ...(o.region ? { addressRegion: o.region } : {}), addressCountry: 'IT' } } : {}),
    ...(Array.isArray(o.same_as) && o.same_as.length ? { sameAs: o.same_as } : {}),
  }
  return JSON.stringify(ld).replace(/</g, '\\u003c')
}

// Titolo e descrizione della pagina (SEO)
export function pageMeta(c, page) {
  if (page === 'home') return c.home.seo
  const s = c.services.find((x) => x.slug === page)
  return s ? s.seo : { title: 'Pagina non trovata | Dpzdigital', description: '' }
}

export function renderBody(c, page, opts = {}) {
  const body = page === 'home' ? renderHome(c, opts) : renderService(c, c.services.findIndex((x) => x.slug === page), opts)
  return renderMenu(c, { ...opts, page }) + (page === 'home' ? '\n' : '\n  ') + body
}

/* ---------- blocchi pronti (si trascinano dal gestionale) ---------- */
const IMG = 'assets/blocco.svg'
const blkBtn = (h, path, l, cls = 'blk-btn') => (l && l.label ? btn(h, path, l, cls) : '')
const head = (d, P, h) => `${d.kicker ? `<span class="blk-kicker"${h.k(`${P}.kicker`)}>${esc(d.kicker)}</span>` : ''}<h2${h.k(`${P}.title`, 'rich')}>${rich(d.title)}</h2>`
const arr = (x) => (Array.isArray(x) ? x : [])
// elementi spenti dal gestionale: sul sito non compaiono, nell'anteprima di modifica restano (sbiaditi)
const off = (x, h) => x?.hidden && !h.edit
const offCls = (x) => (x?.hidden ? ' blk-off' : '')

export const BLOCKS = {
  text: {
    label: 'Testo', icon: '¶', desc: 'Titolo e paragrafo, con bottone facoltativo',
    defaults: () => ({ kicker: 'TITOLETTO', title: 'Un titolo che <em>colpisce.</em>', text: 'Scrivi qui il tuo testo. Puoi andare a capo con Invio e mettere in corsivo con Ctrl+I.', button: { label: 'Parliamone', href: '#contatti', arrow: '↗' }, dark: false }),
    render: (d, P, h) => `<section class="blk blk-text${d.dark ? ' blk-dark' : ''}"><div class="blk-wrap blk-narrow reveal">${head(d, P, h)}<p${h.k(`${P}.text`, 'rich')}>${rich(d.text)}</p>${blkBtn(h, `${P}.button`, d.button)}</div></section>`,
  },
  'text-image': {
    label: 'Testo + immagine', icon: '◧', desc: 'Titolo, testo e foto affiancati',
    defaults: () => ({ kicker: 'CHI SIAMO', title: 'Raccontaci la tua <em>storia.</em>', text: 'Un paragrafo che presenta l’azienda, un progetto o un servizio. Clicca sull’immagine per cambiarla.', button: { label: 'Scopri di più', href: '#contatti', arrow: '↗' }, image: IMG, image_alt: '', reverse: false, dark: false }),
    render: (d, P, h) => `<section class="blk blk-ti${d.reverse ? ' blk-reverse' : ''}${d.dark ? ' blk-dark' : ''}"><div class="blk-wrap blk-split"><div class="blk-copy reveal">${head(d, P, h)}<p${h.k(`${P}.text`, 'rich')}>${rich(d.text)}</p>${blkBtn(h, `${P}.button`, d.button)}</div><figure class="blk-media reveal"><img src="${esc(d.image || IMG)}" alt="${esc(d.image_alt)}" loading="lazy"${h.img(`${P}.image`)}></figure></div></section>`,
  },
  gallery: {
    label: 'Galleria / portfolio', icon: '▦', desc: 'Griglia di foto o lavori con didascalia',
    defaults: () => ({ kicker: 'PORTFOLIO', title: 'Alcuni dei nostri <em>lavori.</em>', items: [1, 2, 3, 4, 5, 6].map((n) => ({ image: IMG, caption: `Progetto ${n}` })), dark: false }),
    render: (d, P, h) => `<section class="blk blk-gallery${d.dark ? ' blk-dark' : ''}"><div class="blk-wrap"><div class="blk-head reveal">${head(d, P, h)}</div><div class="blk-grid"${h.list(`${P}.items`)}>${arr(d.items).map((x, j) => `<figure class="blk-shot reveal"${h.item(`${P}.items`, j)}><img src="${esc(x.image || IMG)}" alt="${esc(x.caption)}" loading="lazy"${h.img(`${P}.items.${j}.image`)}><figcaption${h.k(`${P}.items.${j}.caption`)}>${esc(x.caption)}</figcaption></figure>`).join('')}</div></div></section>`,
  },
  testimonials: {
    label: 'Recensioni', icon: '❝', desc: 'Cosa dicono i clienti',
    defaults: () => ({ kicker: 'DICONO DI NOI', title: 'La parola ai <em>clienti.</em>', items: [
      { quote: 'Professionali e veloci: in poche settimane abbiamo visto i primi risultati.', name: 'Nome Cognome', role: 'Titolare, Azienda' },
      { quote: 'Finalmente un unico partner che segue tutto, dal sito ai social.', name: 'Nome Cognome', role: 'Marketing, Azienda' },
      { quote: 'Chiari in ogni fase e sempre disponibili. Li consiglio.', name: 'Nome Cognome', role: 'Fondatrice, Azienda' }], dark: true }),
    render: (d, P, h) => `<section class="blk blk-quotes${d.dark ? ' blk-dark' : ''}"><div class="blk-wrap"><div class="blk-head reveal">${head(d, P, h)}</div><div class="blk-cards"${h.list(`${P}.items`)}>${arr(d.items).map((x, j) => `<figure class="blk-quote reveal"${h.item(`${P}.items`, j)}><blockquote${h.k(`${P}.items.${j}.quote`)}>${esc(x.quote)}</blockquote><figcaption><b${h.k(`${P}.items.${j}.name`)}>${esc(x.name)}</b><span${h.k(`${P}.items.${j}.role`)}>${esc(x.role)}</span></figcaption></figure>`).join('')}</div></div></section>`,
  },
  faq: {
    label: 'Domande frequenti', icon: '?', desc: 'Domande e risposte apri/chiudi',
    defaults: () => ({ kicker: 'FAQ', title: 'Domande <em>frequenti.</em>', items: [
      { q: 'Quanto tempo serve per partire?', a: 'Dipende dal progetto: di solito bastano una o due settimane per la prima fase.' },
      { q: 'Lavorate anche fuori zona?', a: 'Sì, seguiamo clienti in tutta Italia, anche completamente da remoto.' },
      { q: 'Come funzionano i pagamenti?', a: 'Concordiamo insieme acconto e rate in base al progetto.' },
      { q: 'Posso modificare il servizio in corso?', a: 'Certo: ogni mese rivediamo insieme priorità e risultati.' }], dark: false }),
    render: (d, P, h) => `<section class="blk blk-faq${d.dark ? ' blk-dark' : ''}"><div class="blk-wrap blk-split blk-split-faq"><div class="blk-head reveal">${head(d, P, h)}</div><div class="blk-faqs"${h.list(`${P}.items`)}>${arr(d.items).map((x, j) => `<details class="reveal"${h.edit ? ' open' : ''}${h.item(`${P}.items`, j)}><summary><span${h.k(`${P}.items.${j}.q`)}>${esc(x.q)}</span><i aria-hidden="true">+</i></summary><p${h.k(`${P}.items.${j}.a`)}>${esc(x.a)}</p></details>`).join('')}</div></div></section>`,
  },
  cta: {
    label: 'Banner invito', icon: '➜', desc: 'Fascia con frase forte e bottone',
    defaults: () => ({ title: 'Pronto a far <em>crescere</em> il tuo brand?', text: 'Prenota una consulenza gratuita di 30 minuti.', button: { label: 'Prenota ora', href: '#contatti', arrow: '↗' } }),
    render: (d, P, h) => `<section class="blk blk-cta"><div class="blk-wrap blk-cta-box reveal"><div><h2${h.k(`${P}.title`, 'rich')}>${rich(d.title)}</h2><p${h.k(`${P}.text`)}>${esc(d.text)}</p></div>${blkBtn(h, `${P}.button`, d.button, 'blk-btn blk-btn-light')}</div></section>`,
  },
  cases: {
    label: 'Casi studio', icon: '◎', desc: 'Progetti raccontati: sfida, cosa abbiamo fatto, risultato',
    defaults: () => ({ anchor: 'casi-studio', kicker: 'CASI STUDIO', title: 'Problemi veri, <em>soluzioni concrete.</em>', text: 'Alcuni progetti seguiti per i nostri clienti. Per riservatezza non mostriamo i nomi.', items: [
      { sector: 'Settore', title: 'Titolo del progetto', challenge: 'Qual era il problema di partenza.', solution: 'Cosa abbiamo costruito.', result: 'Cosa è cambiato per il cliente.', tags: ['Sito web', 'Social'] }], dark: false }),
    render: (d, P, h) => `<section class="blk blk-cases${d.dark ? ' blk-dark' : ''}"><div class="blk-wrap"><div class="blk-head reveal">${head(d, P, h)}${d.text ? `<p${h.k(`${P}.text`)}>${esc(d.text)}</p>` : ''}</div><div class="blk-case-list"${h.list(`${P}.items`)}>${arr(d.items).map((x, j) => { if (off(x, h)) return ''; const Q = `${P}.items.${j}`; return `<article class="blk-case reveal${offCls(x)}"${h.item(`${P}.items`, j)}><div class="blk-case-side"><span class="blk-case-num">${String(j + 1).padStart(2, '0')}</span><small${h.k(`${Q}.sector`)}>${esc(x.sector)}</small><h3${h.k(`${Q}.title`)}>${esc(x.title)}</h3><div class="blk-tags"${h.list(`${Q}.tags`)}>${arr(x.tags).map((g, z) => `<span${h.item(`${Q}.tags`, z)}${h.k(`${Q}.tags.${z}`)}>${esc(g)}</span>`).join('')}</div></div><dl class="blk-case-steps"><div><dt>La sfida</dt><dd${h.k(`${Q}.challenge`)}>${esc(x.challenge)}</dd></div><div><dt>Cosa abbiamo fatto</dt><dd${h.k(`${Q}.solution`)}>${esc(x.solution)}</dd></div><div><dt>Il risultato</dt><dd${h.k(`${Q}.result`)}>${esc(x.result)}</dd></div></dl></article>` }).join('')}</div></div></section>`,
  },
  showcase: {
    label: 'Lavori / portfolio', icon: '▣', desc: 'Schede con schermata: siti, gestionali, esempi',
    defaults: () => ({ anchor: 'lavori', kicker: 'LAVORI', title: 'Cosa possiamo <em>costruire.</em>', text: '', note: '', items: [1, 2, 3].map((n) => ({ image: IMG, badge: 'Esempio', sector: 'Settore', title: `Progetto ${n}`, text: 'Breve descrizione di cosa fa.', tags: ['Sito web'], link: { label: '', href: '' } })), dark: false }),
    render: (d, P, h) => (!h.edit && !arr(d.items).some((x) => !x?.hidden)) ? '' : `<section class="blk blk-show${d.dark ? ' blk-dark' : ''}"><div class="blk-wrap"><div class="blk-head reveal">${head(d, P, h)}${d.text ? `<p${h.k(`${P}.text`)}>${esc(d.text)}</p>` : ''}</div><div class="blk-show-grid blk-n${Math.min(3, arr(d.items).filter((x) => !off(x, h)).length)}"${h.list(`${P}.items`)}>${arr(d.items).map((x, j) => { if (off(x, h)) return ''; const Q = `${P}.items.${j}`; const real = /reale/i.test(x.badge || ''); const link = x.link && x.link.href && x.link.label; return `<article class="blk-work reveal${offCls(x)}"${h.item(`${P}.items`, j)}><div class="blk-work-shot"><i class="blk-work-bar"><b></b><b></b><b></b></i><img src="${esc(x.image || IMG)}" alt="${esc(x.title)}" loading="lazy"${h.img(`${Q}.image`)}>${x.badge || h.edit ? `<span class="blk-badge${real ? ' real' : ''}${x.badge ? '' : ' blk-empty'}"${h.k(`${Q}.badge`)}>${esc(x.badge || '')}</span>` : ''}</div><div class="blk-work-copy"><small${h.k(`${Q}.sector`)}>${esc(x.sector)}</small><h3${h.k(`${Q}.title`)}>${esc(x.title)}</h3><p${h.k(`${Q}.text`)}>${esc(x.text)}</p><div class="blk-tags"${h.list(`${Q}.tags`)}>${arr(x.tags).map((g, z) => `<span${h.item(`${Q}.tags`, z)}${h.k(`${Q}.tags.${z}`)}>${esc(g)}</span>`).join('')}</div>${link || h.edit ? `<a class="blk-work-link" href="${esc(x.link?.href || '#')}"${/^https?:/.test(x.link?.href || '') ? ' target="_blank" rel="noopener"' : ''}${h.href(`${Q}.link`)}>${h.w(`${Q}.link.label`, x.link?.label || (h.edit ? 'Aggiungi link' : ''))} <span>↗</span></a>` : ''}</div></article>` }).join('')}</div>${(d.note && arr(d.items).some((x) => !off(x, h) && /esempio/i.test(x.badge || ''))) || h.edit ? `<p class="blk-note reveal"${h.k(`${P}.note`)}>${esc(d.note || '')}</p>` : ''}</div></section>`,
  },
  team: {
    label: 'Team (ruoli)', icon: '◍', desc: 'Le competenze del team, con o senza nomi',
    defaults: () => ({ anchor: 'team', kicker: 'IL TEAM', title: 'Le persone dietro <em>ogni progetto.</em>', text: 'Un gruppo di professionisti, un unico referente per te.', items: [
      { icon: '↗', role: 'Strategia', text: 'Analisi, obiettivi e piano d’azione.' },
      { icon: '⌘', role: 'Sviluppo', text: 'Siti, gestionali e automazioni.' },
      { icon: '◫', role: 'Contenuti', text: 'Foto, video e testi per i social.' },
      { icon: '◎', role: 'Advertising', text: 'Campagne e analisi dei risultati.' }], dark: false }),
    render: (d, P, h) => `<section class="blk blk-team${d.dark ? ' blk-dark' : ''}"><div class="blk-wrap"><div class="blk-head reveal">${head(d, P, h)}${d.text ? `<p${h.k(`${P}.text`)}>${esc(d.text)}</p>` : ''}</div><div class="blk-roles"${h.list(`${P}.items`)}>${arr(d.items).map((x, j) => { if (off(x, h)) return ''; const Q = `${P}.items.${j}`; return `<article class="blk-role reveal${offCls(x)}"${h.item(`${P}.items`, j)}><i${h.k(`${Q}.icon`)}>${esc(x.icon)}</i><h3${h.k(`${Q}.role`)}>${esc(x.role)}</h3><p${h.k(`${Q}.text`)}>${esc(x.text)}</p></article>` }).join('')}</div></div></section>`,
  },
  pricing: {
    label: 'Prezzi / pacchetti', icon: '€', desc: 'Pacchetti affiancati con prezzo e cosa include',
    defaults: () => ({ kicker: 'PACCHETTI', title: 'Scegli il percorso <em>giusto.</em>', text: 'Prezzi IVA esclusa. Ogni pacchetto si può personalizzare.', plans: [
      { name: 'Start', price: '€ 490', period: '/mese', text: 'Per iniziare con una presenza curata.', features: ['12 contenuti al mese', 'Gestione 2 social', 'Report mensile'], button: { label: 'Scegli Start', href: '#contatti', arrow: '↗' }, featured: false },
      { name: 'Growth', price: '€ 890', period: '/mese', text: 'Il più scelto: contenuti e pubblicità.', features: ['20 contenuti al mese', 'Campagne ADV', 'Shooting trimestrale', 'Report e call mensile'], button: { label: 'Scegli Growth', href: '#contatti', arrow: '↗' }, featured: true },
      { name: 'Su misura', price: 'Da € 1.500', period: '/mese', text: 'Ecosistema completo con sito e automazioni.', features: ['Tutto di Growth', 'Sito o gestionale', 'Automazioni e chatbot'], button: { label: 'Parliamone', href: '#contatti', arrow: '↗' }, featured: false }], dark: false }),
    render: (d, P, h) => `<section class="blk blk-pricing${d.dark ? ' blk-dark' : ''}"><div class="blk-wrap"><div class="blk-head reveal">${head(d, P, h)}${d.text ? `<p${h.k(`${P}.text`)}>${esc(d.text)}</p>` : ''}</div><div class="blk-plans"${h.list(`${P}.plans`)}>${arr(d.plans).map((x, j) => { const Q = `${P}.plans.${j}`; return `<article class="blk-plan reveal${x.featured ? ' blk-plan-on' : ''}"${h.item(`${P}.plans`, j)}${h.toggle(`${Q}.featured`)}><h3${h.k(`${Q}.name`)}>${esc(x.name)}</h3><div class="blk-price"><strong${h.k(`${Q}.price`)}>${esc(x.price)}</strong><span${h.k(`${Q}.period`)}>${esc(x.period)}</span></div><p${h.k(`${Q}.text`)}>${esc(x.text)}</p><ul${h.list(`${Q}.features`)}>${arr(x.features).map((f, z) => `<li${h.item(`${Q}.features`, z)}${h.k(`${Q}.features.${z}`)}>${esc(f)}</li>`).join('')}</ul>${blkBtn(h, `${Q}.button`, x.button, x.featured ? 'blk-btn' : 'blk-btn blk-btn-ghost')}</article>` }).join('')}</div></div></section>`,
  },
}
