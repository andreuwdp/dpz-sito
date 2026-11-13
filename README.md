# DPZ — Sito

Sito DPZMarketing, identico alla versione originale, pubblicato su **Netlify** e modificabile dal gestionale (DPZ Hub → "Sito web").

- `src/content.json` — tutti i testi, link, immagini e servizi (contenuti di partenza)
- `src/js/render.js` — costruisce le pagine dai contenuti (usato dal build e dal browser)
- `src/js/site.js` — animazioni, menu, modulo contatti, aggiornamenti dal vivo da Supabase
- `src/js/editor.js` — modalità modifica, attiva solo dentro l'anteprima del gestionale
- `src/css/` — stili originali, invariati
- `build.mjs` — genera `dist/` (Netlify: comando `node build.mjs`, cartella `dist`)

**Come si aggiorna:** dal gestionale premi "Pubblica" → i contenuti vanno su Supabase (`site_content`) e il sito li mostra subito, senza nuovo deploy su Netlify. Un nuovo deploy serve solo per cambiare il codice o la grafica, oppure per far leggere a Google le ultime modifiche già dentro l'HTML.

Prova in locale: `node build.mjs --offline && npx serve dist`
