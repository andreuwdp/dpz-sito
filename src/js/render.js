// Motore del sito DPZMarketing: costruisce l'HTML delle pagine a partire dai contenuti (content.json / Supabase).
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

function helpers(edit) {
  const k = (path, type = 'text') => (edit ? ` data-k="${path}" data-t="${type}"` : '')
  return {
    k,
    // testo che non ha un elemento tutto suo (es. etichetta di un bottone con freccia)
    w: (path, v, type = 'text') => (edit ? `<dpz-t${k(path, type)}>${type === 'rich' ? rich(v) : esc(v)}</dpz-t>` : type === 'rich' ? rich(v) : esc(v)),
    href: (path) => (edit ? ` data-href="${path}"` : ''),
    img: (path) => (edit ? ` data-img="${path}"` : ''),
    item: (list, i) => (edit ? ` data-list="${list}" data-i="${i}"` : ''),
    list: (list) => (edit ? ` data-listbox="${list}"` : ''),
    panel: (name) => (edit ? ` data-panel="${name}"` : ''),
  }
}

// Bottone/link con etichetta + freccia: <a ...>Etichetta <span>↗</span></a>
function btn(h, path, l, cls, extra = '') {
  return `<a class="${cls}" href="${esc(l.href)}"${h.href(path)}${extra}>${h.w(`${path}.label`, l.label)}${l.arrow ? ` <span>${h.w(`${path}.arrow`, l.arrow)}</span>` : ''}</a>`
}

export function renderMenu(c, opts = {}) {
  const h = helpers(opts.edit); const g = c.global
  const items = c.services.map((s, i) => `<a href="${esc(s.slug)}.html"${h.item('services', i)}><b>${esc(s.num)}</b>${h.w(`services.${i}.menu_label`, s.menu_label)}</a>`).join('')
  return `<button class="dpz-burger" id="dpzBurger" aria-label="Apri menu" aria-controls="dpzDrawer" aria-expanded="false"><span></span><span></span><span></span></button><div class="dpz-overlay" id="dpzOverlay"></div><aside class="dpz-drawer" id="dpzDrawer" aria-hidden="true"><span class="dpz-eyebrow"${h.k('global.menu.eyebrow')}>${esc(g.menu.eyebrow)}</span><a class="dpz-nav-home" href="index.html"${h.k('global.menu.home')}>${esc(g.menu.home)}</a><nav class="dpz-nav-services"${h.list('services')}>${items}</nav>${btn(h, 'global.menu.book', g.menu.book, 'dpz-book')}</aside>`
}

export function renderHome(c, opts = {}) {
  const h = helpers(opts.edit); const { home: p, global: g } = c
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

  return `<main><nav class="nav"><a class="brand" href="#home" aria-label="${esc(g.logo_alt)} home">${logo('brand-logo')}</a><div class="nav-links"${h.list('home.nav.links')}>${p.nav.links.map((l, i) => `<a href="${esc(l.href)}"${h.item('home.nav.links', i)}${h.href(`home.nav.links.${i}`)}${h.k(`home.nav.links.${i}.label`)}>${esc(l.label)}</a>`).join('')}</div>${btn(h, 'home.nav.cta', p.nav.cta, 'nav-cta')}</nav>`
    + `<section class="hero" id="home"><div class="hero-grid" aria-hidden="true"></div><div class="hero-glow glow-one" aria-hidden="true"></div><div class="hero-glow glow-two" aria-hidden="true"></div><div class="hero-copy"><div class="eyebrow"><span></span> ${h.w('home.hero.eyebrow', hero.eyebrow)}</div><h1${h.k('home.hero.title', 'rich')}>${rich(hero.title)}</h1><p${h.k('home.hero.text')}>${esc(hero.text)}</p><div class="hero-actions">${btn(h, 'home.hero.cta1', hero.cta1, 'button primary')}${btn(h, 'home.hero.cta2', hero.cta2, 'button secondary')}</div><div class="trust-line"><div class="avatar-stack">${hero.avatars.map((a, i) => `<i${h.k(`home.hero.avatars.${i}`)}>${esc(a)}</i>`).join('')}</div><span${h.k('home.hero.trust')}>${esc(hero.trust)}</span></div></div><div class="hero-visual" aria-label="${esc(hero.visual_label)}"><div class="sphere-stage">${['a', 'b', 'c'].map((x, i) => `<div class="orbit orbit-${x}"><span${h.k(`home.hero.orbits.${i}`)}>${esc(hero.orbits[i] ?? '')}</span></div>`).join('')}<div class="sphere"><div class="sphere-shine"></div><div class="sphere-core"><b${h.k('home.hero.sphere_title')}>${esc(hero.sphere_title)}</b><small${h.k('home.hero.sphere_sub')}>${esc(hero.sphere_sub)}</small></div></div><div class="float-card card-top"><span class="status-dot"></span><div><small${h.k('home.hero.card_top_small')}>${esc(hero.card_top_small)}</small><b${h.k('home.hero.card_top_value')}>${esc(hero.card_top_value)}</b></div></div><div class="float-card card-bottom"><small${h.k('home.hero.card_bottom_small')}>${esc(hero.card_bottom_small)}</small><b>${h.w('home.hero.card_bottom_value', hero.card_bottom_value)} <span class="mini-chart"${h.k('home.hero.card_bottom_icon')}>${esc(hero.card_bottom_icon)}</span></b></div></div></div><div class="scroll-hint"><span></span> ${h.w('home.hero.scroll_hint', hero.scroll_hint)}</div></section>`
    + `<section class="section values-section"><div class="section-heading reveal"><div><span class="kicker"${h.k('home.values.kicker')}>${esc(p.values.kicker)}</span><h2${h.k('home.values.title', 'rich')}>${rich(p.values.title)}</h2></div><p${h.k('home.values.text')}>${esc(p.values.text)}</p></div><div class="value-grid"${h.list('home.values.items')}>${values}</div></section>`
    + `<section class="services-section" id="servizi"><div class="services-heading reveal"><div><span class="kicker"${h.k('home.services.kicker')}>${esc(p.services.kicker)}</span><h2${h.k('home.services.title', 'rich')}>${rich(p.services.title)}</h2></div><div class="services-intro"><p${h.k('home.services.text')}>${esc(p.services.text)}</p>${btn(h, 'home.services.link', p.services.link, 'services-link')}</div></div><div class="services-grid"${h.list('services')}>${services}</div></section>`
    + `<section class="ecosystem-section" id="ecosistema"><div class="ecosystem-copy reveal"><span class="kicker light"${h.k('home.ecosystem.kicker')}>${esc(eco.kicker)}</span><h2${h.k('home.ecosystem.title', 'rich')}>${rich(eco.title)}</h2><p${h.k('home.ecosystem.text')}>${esc(eco.text)}</p>${btn(h, 'home.ecosystem.link', eco.link, 'text-link')}</div><div class="ecosystem-map reveal"><div class="map-lines" aria-hidden="true">${lines}</div><div class="map-center"><img class="map-logo" src="${esc(eco.center_logo)}" alt=""${h.img('home.ecosystem.center_logo')}/><b${h.k('home.ecosystem.center_label', 'rich')}>${rich(eco.center_label)}</b></div>${nodes}<div class="map-pulse p1"></div><div class="map-pulse p2"></div></div></section>`
    + `<section class="section method-section" id="metodo"><div class="method-intro reveal"><span class="kicker"${h.k('home.method.kicker')}>${esc(p.method.kicker)}</span><h2${h.k('home.method.title', 'rich')}>${rich(p.method.title)}</h2><p${h.k('home.method.text')}>${esc(p.method.text)}</p></div><div class="timeline"${h.list('home.method.steps')}><div class="timeline-rail" aria-hidden="true"><i></i></div>${steps}</div></section>`
    + `<section class="numbers-section" id="numeri"><div class="numbers-head reveal"><span class="kicker light"${h.k('home.numbers.kicker')}>${esc(p.numbers.kicker)}</span><h2${h.k('home.numbers.title', 'rich')}>${rich(p.numbers.title)}</h2><p${h.k('home.numbers.text')}>${esc(p.numbers.text)}</p></div><div class="stats-grid"${h.list('home.numbers.stats')}>${stats}</div></section>`
    + `<section class="wow-section"><div class="wow-orbit" aria-hidden="true"><i></i><i></i><i></i></div><div class="wow-copy reveal"><span class="kicker light"${h.k('home.wow.kicker')}>${esc(w.kicker)}</span><h2${h.k('home.wow.title', 'rich')}>${rich(w.title)}</h2><p${h.k('home.wow.text')}>${esc(w.text)}</p>${btn(h, 'home.wow.button', w.button, 'button white')}</div><div class="control-center reveal"><div class="control-top"><div><span class="status-dot"></span> ${h.w('home.wow.panel_title', w.panel_title)}</div><small${h.k('home.wow.panel_status')}>${esc(w.panel_status)}</small></div><div class="control-body"><div class="control-metric"><small${h.k('home.wow.metric_label')}>${esc(w.metric_label)}</small><strong${h.k('home.wow.metric_value')}>${esc(w.metric_value)}</strong><span${h.k('home.wow.metric_delta')}>${esc(w.metric_delta)}</span></div><div class="bars"${h.panel('bars')}>${bars}</div><div class="control-tags"${h.list('home.wow.tags')}>${tags}</div></div></div></section>`
    + `<section class="contact-section" id="contatti"><div class="contact-wrap"><div class="contact-left"><span class="kicker"${h.k('home.contact.kicker')}>${esc(ct.kicker)}</span><h2${h.k('home.contact.title', 'rich')}>${rich(ct.title)}</h2><p class="contact-lead"${h.k('home.contact.lead')}>${esc(ct.lead)}</p><div class="contact-methods">`
    + `<a class="contact-method wa" href="${waHref(co.whatsapp)}" target="_blank" rel="noopener"${h.panel('contacts')}><span class="cm-ico"><svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.7 5.4 2 7.8L.5 31.5l7.9-2c2.3 1.2 4.9 1.9 7.6 1.9 8.6 0 15.5-6.9 15.5-15.5S24.6.5 16 .5zm0 28.3c-2.4 0-4.7-.6-6.7-1.8l-.5-.3-4.7 1.2 1.3-4.6-.3-.5c-1.3-2.1-2-4.5-2-7 0-7.2 5.9-13.1 13.1-13.1S29.1 8.8 29.1 16 23.2 28.8 16 28.8zm7.2-9.8c-.4-.2-2.3-1.1-2.7-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.2 1.5-.2.2-.4.3-.8.1-.4-.2-1.7-.6-3.2-2-1.2-1.1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8.2-.2.4-.4.6-.7.2-.2.3-.4.4-.7.1-.2 0-.5 0-.7-.1-.2-.9-2.1-1.2-2.9-.3-.8-.6-.7-.9-.7h-.7c-.2 0-.6.1-1 .5-.3.4-1.3 1.3-1.3 3.1s1.3 3.6 1.5 3.9c.2.2 2.6 4 6.3 5.6.9.4 1.6.6 2.1.8.9.3 1.7.2 2.3.1.7-.1 2.3-.9 2.6-1.8.3-.9.3-1.6.2-1.8-.1-.1-.3-.2-.7-.4z"/></svg></span><span class="cm-txt">${h.w('home.contact.wa_label', ct.wa_label)}<small>${esc(co.phone)} · ${h.w('home.contact.wa_note', ct.wa_note)}</small></span></a>`
    + `<a class="contact-method" href="${telHref(co.phone)}"${h.panel('contacts')}><span class="cm-ico">&#9742;</span><span class="cm-txt">${h.w('home.contact.call_label', ct.call_label)}<small>${esc(co.phone)}</small></span></a>`
    + `<a class="contact-method" href="mailto:${esc(co.email)}"${h.panel('contacts')}><span class="cm-ico">&#9993;</span><span class="cm-txt">${h.w('home.contact.mail_label', ct.mail_label)}<small>${esc(co.email)}</small></span></a></div></div>`
    + `<form class="contact-form" id="dpzForm" action="https://api.web3forms.com/submit" method="POST"><input type="hidden" name="access_key" value="${esc(g.form.access_key)}"><input type="hidden" name="subject" value="${esc(g.form.subject)}"><input type="hidden" name="from_name" value="${esc(g.form.from_name)}"><input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off"><h3${h.k('home.contact.form_title')}>${esc(ct.form_title)}</h3>${fieldE('name', 'text', 'name', true)}${fieldE('email', 'email', 'email', true)}${fieldE('phone', 'tel', 'phone', false)}${fieldE('msg', 'textarea', 'message', true)}<button class="button primary" type="submit">${h.w('home.contact.form_button', ct.form_button)} <span>&#8599;</span></button><p class="form-note" id="dpzFormNote"${h.k('home.contact.form_note')}>${esc(ct.form_note)}</p></form></div></section>`
    + `<footer><a class="brand footer-brand" href="#home">${logo('brand-logo footer-logo')}</a><p${h.k('home.footer.tagline')}>${esc(p.footer.tagline)}</p><span${h.k('home.footer.copyright')}>${esc(p.footer.copyright)}</span></footer></main>`
}

export function renderService(c, i, opts = {}) {
  const h = helpers(opts.edit); const s = c.services[i]; const g = c.global
  const P = `services.${i}`
  if (!s) return '<main style="padding:180px 8vw;font-family:Arial,sans-serif"><h1>Pagina non trovata</h1><p><a href="index.html" style="color:#087653">Torna alla home</a></p></main>'
  const logo = `<img src="${esc(g.logo)}" alt="${esc(g.logo_alt)}"${h.img('global.logo')}>`
  return `<nav class="nav"><a href="index.html">${logo}</a><a href="#contatti"${h.k(`${P}.nav_cta`)}>${esc(s.nav_cta)}</a></nav>`
    + `<header class="hero"><div class="grid"></div><div class="reveal"><div class="number"${h.k(`${P}.num`)}>${esc(s.num)}</div><h1${h.k(`${P}.title`, 'rich')}>${rich(s.title)}</h1><p${h.k(`${P}.hero_text`)}>${esc(s.hero_text)}</p><a class="btn" href="${esc(s.hero_cta.href)}"${h.href(`${P}.hero_cta`)}${h.k(`${P}.hero_cta.label`)}>${esc(s.hero_cta.label)}</a></div><div class="visual reveal"><div class="orbit"><b${h.k(`${P}.icon`)}>${esc(s.icon)}</b></div></div></header>`
    + `<section class="intro"><span class="kicker reveal"${h.k(`${P}.intro_kicker`)}>${esc(s.intro_kicker)}</span><p class="reveal"${h.k(`${P}.intro`)}>${esc(s.intro)}</p></section>`
    + `<section class="two">${['problem', 'solution'].map((k) => `<article class="panel ${k} reveal"><small${h.k(`${P}.${k}.label`)}>${esc(s[k].label)}</small><h2${h.k(`${P}.${k}.title`, 'rich')}>${rich(s[k].title)}</h2><p${h.k(`${P}.${k}.text`)}>${esc(s[k].text)}</p></article>`).join('')}</section>`
    + `<section class="includes"><div class="heading reveal"><span class="kicker"${h.k(`${P}.includes.kicker`)}>${esc(s.includes.kicker)}</span><h2${h.k(`${P}.includes.title`, 'rich')}>${rich(s.includes.title)}</h2></div><div class="list"${h.list(`${P}.includes.items`)}>${s.includes.items.map((r, j) => `<div class="row reveal"${h.item(`${P}.includes.items`, j)}><span${h.k(`${P}.includes.items.${j}.num`)}>${esc(r.num)}</span><b${h.k(`${P}.includes.items.${j}.text`)}>${esc(r.text)}</b><i${h.k(`${P}.includes.items.${j}.icon`)}>${esc(r.icon)}</i></div>`).join('')}</div></section>`
    + `<section class="process"><div class="heading reveal"><span class="kicker"${h.k(`${P}.process.kicker`)}>${esc(s.process.kicker)}</span><h2${h.k(`${P}.process.title`, 'rich')}>${rich(s.process.title)}</h2></div><div class="flow"${h.list(`${P}.process.steps`)}>${s.process.steps.map((x, j) => `<div class="step reveal"${h.item(`${P}.process.steps`, j)}><span${h.k(`${P}.process.steps.${j}.num`)}>${esc(x.num)}</span><b${h.k(`${P}.process.steps.${j}.title`)}>${esc(x.title)}</b></div>`).join('')}</div></section>`
    + `<section class="outcomes"><div class="heading reveal"><span class="kicker"${h.k(`${P}.outcomes.kicker`)}>${esc(s.outcomes.kicker)}</span><h2${h.k(`${P}.outcomes.title`, 'rich')}>${rich(s.outcomes.title)}</h2><p${h.k(`${P}.outcomes.text`)}>${esc(s.outcomes.text)}</p></div><div class="cards"${h.list(`${P}.outcomes.cards`)}>${s.outcomes.cards.map((x, j) => `<div class="card reveal"${h.item(`${P}.outcomes.cards`, j)}><span${h.k(`${P}.outcomes.cards.${j}.num`)}>${esc(x.num)}</span><b${h.k(`${P}.outcomes.cards.${j}.title`)}>${esc(x.title)}</b></div>`).join('')}</div></section>`
    + `<section class="contact" id="contatti"><div><span class="kicker"${h.k(`${P}.contact.kicker`)}>${esc(s.contact.kicker)}</span><h2${h.k(`${P}.contact.title`, 'rich')}>${rich(s.contact.title)}</h2></div><a class="circle" href="${esc(s.contact.button.href || `mailto:${g.contacts.email}`)}"${h.href(`${P}.contact.button`)}${h.k(`${P}.contact.button.label`)}>${esc(s.contact.button.label)}</a></section>`
    + `<footer>${logo}<span${h.k(`${P}.footer`)}>${esc(s.footer)}</span></footer>`
}

// Titolo e descrizione della pagina (SEO)
export function pageMeta(c, page) {
  if (page === 'home') return c.home.seo
  const s = c.services.find((x) => x.slug === page)
  return s ? s.seo : { title: 'Pagina non trovata | DPZMarketing', description: '' }
}

export function renderBody(c, page, opts = {}) {
  const body = page === 'home' ? renderHome(c, opts) : renderService(c, c.services.findIndex((x) => x.slug === page), opts)
  return renderMenu(c, opts) + (page === 'home' ? '\n' : '\n  ') + body
}
