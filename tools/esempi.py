"""Genera i siti di ESEMPIO mostrati nella sezione "Lavori" di dpzdigital.com.
Attività, nomi, prezzi e recensioni sono di fantasia: ogni pagina lo dichiara in alto e in fondo.
Uso: python3 tools/esempi.py  →  scrive src/esempi/*.html"""
import html, pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'esempi'
E = html.escape

FONTS = {
    'Fraunces': [('fraunces-latin-400-normal', 400, 'normal'), ('fraunces-latin-600-normal', 600, 'normal'), ('fraunces-latin-400-italic', 400, 'italic')],
    'Inter': [('inter-latin-400-normal', 400, 'normal'), ('inter-latin-600-normal', 600, 'normal'), ('inter-latin-800-normal', 800, 'normal')],
    'Oswald': [('oswald-latin-500-normal', 500, 'normal'), ('oswald-latin-700-normal', 700, 'normal')],
    'Cormorant Garamond': [('cormorant-garamond-latin-500-normal', 500, 'normal'), ('cormorant-garamond-latin-600-italic', 600, 'italic')],
}

def face(fams):
    return ''.join(f"@font-face{{font-family:'{f}';src:url(fonts/{n}.woff2) format('woff2');font-weight:{w};font-style:{s};font-display:swap}}" for f in fams for n, w, s in FONTS[f])

SITES = [
  dict(slug='studio-dentistico', name='Sorriso Chiaro', kind='Studio dentistico', title='Fraunces', text='Inter',
       c=dict(bg='#f6fafc', ink='#0d2a3a', acc='#1f7fb6', acc2='#7cc6e8', soft='#e7f2f8', card='#ffffff', line='#d6e6ef', hero='linear-gradient(150deg,#d9eef8,#ffffff 60%)'),
       nav=['Cure', 'Lo studio', 'Prezzi', 'Contatti'], cta='Prenota una visita',
       kicker='STUDIO DENTISTICO · CENTRO CITTÀ', h1='Il sorriso che <em>meriti</em>, senza ansia.', lead='Prima visita con panoramica digitale, piano di cura chiaro e prezzi scritti prima di iniziare.',
       cards=[('Prima visita', 'Controllo completo e piano di cura'), ('Pagamento in rate', 'Fino a 24 mesi, senza interessi'), ('Urgenze', 'Ti vediamo entro 24 ore')],
       facts=[('15', 'anni di esperienza'), ('4', 'specialisti'), ('6 giorni', 'su 7 aperti')],
       services=[('◐', 'Igiene e prevenzione', 'Pulizia professionale e sbiancamento.'), ('◇', 'Implantologia', 'Impianti guidati al computer.'), ('◌', 'Ortodonzia invisibile', 'Allineatori trasparenti per adulti e ragazzi.'), ('✚', 'Conservativa', 'Otturazioni estetiche in giornata.'), ('◍', 'Pedodonzia', 'Visite pensate per i più piccoli.'), ('☾', 'Sedazione cosciente', 'Per chi ha paura del dentista.')],
       split=('Lo studio', 'Tecnologia digitale, <em>tempi chiari.</em>', 'Radiografie digitali a basse emissioni, scanner intraorale al posto delle impronte, promemoria via WhatsApp prima di ogni appuntamento.', ['Preventivo scritto e firmato', 'Promemoria automatici', 'Parcheggio convenzionato']),
       price_title='Prezzi trasparenti', prices=[('Prima visita + panoramica', '€ 50'), ('Igiene professionale', '€ 80'), ('Sbiancamento', 'da € 250'), ('Allineatori invisibili', 'da € 2.900')],
       gallery=['Sala d’attesa', 'Ambulatorio 1', 'Scanner 3D', 'Reception'],
       quote=('Finalmente un dentista che spiega tutto prima. Mai sentito dolore.', 'Laura, paziente'),
       hours=[('Lun – Ven', '9:00 – 19:30'), ('Sabato', '9:00 – 13:00'), ('Domenica', 'Chiuso')]),
  dict(slug='palestra', name='FORMA', kind='Palestra e personal training', title='Oswald', text='Inter', dark=True,
       c=dict(bg='#0e0f12', ink='#f2f3f5', acc='#d4ff3a', acc2='#ff5a36', soft='#17191e', card='#1b1d23', line='#2a2d35', hero='radial-gradient(circle at 75% 30%,rgba(212,255,58,.18),transparent 45%),#0e0f12'),
       nav=['Corsi', 'Abbonamenti', 'Coach', 'Orari'], cta='Prova gratis',
       kicker='PALESTRA · PERSONAL TRAINING', h1='ALLENATI CON <em>UN PIANO</em>, NON A CASO.', lead='Sala pesi, corsi a numero chiuso e coach che seguono i tuoi progressi dall’app.',
       cards=[('Prima lezione', 'Gratuita, con valutazione'), ('Corsi', '35 a settimana'), ('App', 'Prenota e segui i progressi')],
       facts=[('600 m²', 'di sala'), ('12', 'coach certificati'), ('6–23', 'aperti tutti i giorni')],
       services=[('▲', 'Sala pesi', 'Attrezzatura nuova, aree dedicate.'), ('◆', 'Functional', 'Allenamenti in piccoli gruppi.'), ('●', 'Personal training', 'Programma su misura 1 a 1.'), ('■', 'Pilates reformer', 'Postura e mobilità.'), ('✦', 'Boxe', 'Tecnica e condizionamento.'), ('◐', 'Nutrizione', 'Consulenza con biologa nutrizionista.')],
       split=('Il metodo', 'Misuri, alleni, <em>migliori.</em>', 'Ogni 6 settimane rifacciamo i test e aggiorniamo il programma. Prenoti i corsi dall’app e ricevi il promemoria.', ['Test iniziale e ogni 6 settimane', 'Prenotazione corsi dall’app', 'Spogliatoi con sauna']),
       price_title='Abbonamenti', prices=[('Mensile open', '€ 49'), ('Trimestrale', '€ 129'), ('Annuale', '€ 399'), ('Pacchetto 10 PT', '€ 350')],
       gallery=['Sala pesi', 'Area functional', 'Studio pilates', 'Ring'],
       quote=('In 4 mesi ho cambiato abitudini. I coach ti seguono davvero.', 'Marco, iscritto'),
       hours=[('Lun – Ven', '6:00 – 23:00'), ('Sabato', '8:00 – 20:00'), ('Domenica', '9:00 – 13:00')]),
  dict(slug='agriturismo', name='Le Querce', kind='Agriturismo con ristorante', title='Cormorant Garamond', text='Inter',
       c=dict(bg='#fbf7f0', ink='#2f2a20', acc='#7c5a2e', acc2='#a7b56a', soft='#f1e9da', card='#fffdf8', line='#e6dccb', hero='linear-gradient(160deg,#efe4cf,#fbf7f0 65%)'),
       nav=['Camere', 'Ristorante', 'Esperienze', 'Dove siamo'], cta='Prenota il soggiorno',
       kicker='AGRITURISMO · COLLINE', h1='Tra gli ulivi, <em>a passo lento.</em>', lead='Sei camere in un casale in pietra, cucina con i prodotti dell’orto e vista sul mare all’orizzonte.',
       cards=[('Colazione', 'Fatta in casa, inclusa'), ('Piscina', 'Panoramica, da giugno'), ('Animali', 'Benvenuti')],
       facts=[('6', 'camere'), ('40 ha', 'di uliveti'), ('km 0', 'in cucina')],
       services=[('◒', 'Camere', 'Travi a vista e letti in ferro battuto.'), ('◓', 'Ristorante', 'Menù del giorno con l’orto.'), ('◑', 'Degustazioni', 'Olio, vino e formaggi della zona.'), ('◐', 'Cooking class', 'La pasta fatta a mano.'), ('◔', 'E-bike', 'Itinerari tra borghi e colline.'), ('◕', 'Eventi', 'Pranzi e piccole cerimonie.')],
       split=('Il casale', 'Una casa, <em>non un hotel.</em>', 'Ristrutturato mantenendo pietra e legno originali. Ogni sera la cena è servita sotto il pergolato.', ['Check-in flessibile', 'Parcheggio privato', 'Wi-Fi in tutto il casale']),
       price_title='Soggiorni', prices=[('Camera doppia con colazione', 'da € 95'), ('Suite con terrazzo', 'da € 140'), ('Mezza pensione', '+ € 30 a persona'), ('Degustazione', '€ 25')],
       gallery=['Il casale', 'Camera Ulivo', 'Pergolato', 'Piscina'],
       quote=('Silenzio, cucina buonissima e un’accoglienza da famiglia.', 'Giulia e Paolo, ospiti'),
       hours=[('Reception', '8:00 – 21:00'), ('Ristorante', '12:30 – 14:30 · 19:30 – 22:00'), ('Apertura', 'marzo – novembre')]),
  dict(slug='barberia', name='Lama & Co.', kind='Barberia', title='Oswald', text='Inter',
       c=dict(bg='#f4f1ec', ink='#1b1a18', acc='#b3542d', acc2='#1b1a18', soft='#e9e3da', card='#fbf9f6', line='#d9d1c4', hero='linear-gradient(150deg,#e6ddcf,#f4f1ec 60%)'),
       nav=['Servizi', 'Barbieri', 'Prezzi', 'Prenota'], cta='Prenota online',
       kicker='BARBERIA · DAL 2015', h1='TAGLIO, BARBA <em>E UN CAFFÈ.</em>', lead='Prenoti dal telefono in 20 secondi, scegli il barbiere e ricevi il promemoria su WhatsApp.',
       cards=[('Prenotazione', 'Online, 24 ore su 24'), ('Promemoria', 'Su WhatsApp'), ('Carta fedeltà', 'Ogni 10 tagli uno è gratis')],
       facts=[('3', 'barbieri'), ('20 sec', 'per prenotare'), ('9–20', 'orario continuato')],
       services=[('✂', 'Taglio', 'Classico o sfumato, con lavaggio.'), ('◒', 'Barba', 'Panno caldo e rasoio.'), ('◆', 'Taglio + barba', 'Il servizio completo.'), ('●', 'Bimbo', 'Fino a 12 anni.'), ('✦', 'Trattamenti', 'Cuoio capelluto e viso.'), ('▲', 'Sposo', 'Pacchetto prova + giorno.')],
       split=('La bottega', 'Vecchia scuola, <em>prenotazioni nuove.</em>', 'Poltrone d’epoca e strumenti professionali. L’agenda è online: vedi subito gli orari liberi di ogni barbiere.', ['Sceglie tu il barbiere', 'Annulli o sposti da solo', 'Pagamento anche con carta']),
       price_title='Listino', prices=[('Taglio', '€ 18'), ('Barba', '€ 12'), ('Taglio + barba', '€ 27'), ('Bimbo', '€ 13')],
       gallery=['La bottega', 'Poltrona 1', 'Prodotti', 'Vetrina'],
       quote=('Prenoto dal telefono e non aspetto mai. Taglio sempre perfetto.', 'Davide, cliente'),
       hours=[('Mar – Sab', '9:00 – 20:00'), ('Lunedì', 'Chiuso'), ('Domenica', 'Chiuso')]),
  dict(slug='trattoria', name='Il Faro', kind='Trattoria di pesce', title='Fraunces', text='Inter',
       c=dict(bg='#fbfaf7', ink='#13283a', acc='#c8492f', acc2='#2f6e8f', soft='#eef3f5', card='#ffffff', line='#dfe6ea', hero='linear-gradient(160deg,#dcebf1,#fbfaf7 60%)'),
       nav=['Menù', 'La storia', 'Eventi', 'Prenota'], cta='Prenota un tavolo',
       kicker='TRATTORIA · SUL PORTO', h1='Il pescato del giorno, <em>come a casa.</em>', lead='Menù che cambia con il mercato del mattino, tavoli sulla terrazza e prenotazione online.',
       cards=[('Menù del giorno', 'Aggiornato ogni mattina'), ('Terrazza', '40 coperti vista porto'), ('Asporto', 'Ordina e ritira')],
       facts=[('1978', 'dal'), ('80', 'coperti'), ('100%', 'pesce locale')],
       services=[('◐', 'Antipasti', 'Crudi e cotti del giorno.'), ('◓', 'Primi', 'Pasta fresca allo scoglio.'), ('◑', 'Grigliate', 'Pesce alla brace.'), ('◒', 'Fritto', 'Paranza dell’Adriatico.'), ('◔', 'Dolci', 'Fatti in casa.'), ('◕', 'Vini', 'Cantina regionale.')],
       split=('La storia', 'Tre generazioni, <em>un solo porto.</em>', 'Dal nonno pescatore alla cucina di oggi: ricette di famiglia e prodotti del mercato ittico a pochi metri.', ['Prenotazione online', 'Menù senza glutine', 'Sala per eventi privati']),
       price_title='Dal menù', prices=[('Antipasto del Faro', '€ 18'), ('Spaghetti allo scoglio', '€ 16'), ('Grigliata mista', '€ 24'), ('Menù degustazione', '€ 45')],
       gallery=['La terrazza', 'Sala interna', 'Il pescato', 'Il porto'],
       quote=('Pesce freschissimo e servizio gentile. Torneremo!', 'Sara, cliente'),
       hours=[('Mar – Dom', '12:30 – 15:00 · 19:30 – 23:00'), ('Lunedì', 'Chiuso'), ('Agosto', 'Sempre aperto')]),
]


def page(s):
    c = s['c']; dark = s.get('dark')
    tf, xf = s['title'], s['text']
    upper = tf == 'Oswald'
    css = f"""{face(sorted({tf, xf}))}
*{{box-sizing:border-box}}html{{scroll-behavior:smooth}}body{{margin:0;background:{c['bg']};color:{c['ink']};font-family:'{xf}',Arial,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}}
a{{color:inherit;text-decoration:none}}em{{font-style:{'normal' if upper else 'italic'};color:{c['acc']}}}
.demo{{position:sticky;top:0;z-index:50;display:flex;justify-content:center;gap:14px;flex-wrap:wrap;padding:9px 16px;background:#06271d;color:#d7f5e6;font:600 12.5px/1.4 Inter,Arial,sans-serif;text-align:center}}.demo b{{color:#96e7c0}}.demo a{{color:#fff;text-decoration:underline}}
.wrap{{max-width:1180px;margin:0 auto;padding:0 28px}}
nav{{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px 0}}
.logo{{font-family:'{tf}',serif;font-size:27px;font-weight:{700 if upper else 600};letter-spacing:{'.06em' if upper else '-.02em'};{'text-transform:uppercase;' if upper else ''}}}.logo small{{display:block;font:600 10px/1 Inter,Arial;letter-spacing:.22em;text-transform:uppercase;opacity:.6;margin-top:4px}}
.links{{display:flex;gap:26px;font-size:14px;font-weight:600;opacity:.85}}
.btn{{display:inline-flex;align-items:center;gap:8px;padding:14px 22px;border-radius:{'4px' if upper else '999px'};background:{c['acc']};color:{'#0e0f12' if dark else '#fff'};font-weight:700;font-size:14px;{'text-transform:uppercase;letter-spacing:.06em;' if upper else ''}}}
.btn.ghost{{background:transparent;color:{c['ink']};border:1.5px solid {c['line']}}}
.hero{{background:{c['hero']};padding-bottom:70px}}
.hero-grid{{display:grid;grid-template-columns:1.05fr .95fr;gap:50px;align-items:center;padding-top:40px}}
.kicker{{font:700 11.5px/1 Inter,Arial;letter-spacing:.22em;color:{c['acc']}}}
h1,h2,h3{{font-family:'{tf}',serif;font-weight:{700 if upper else 500};line-height:1.02;letter-spacing:{'.01em' if upper else '-.03em'};margin:0}}
h1{{font-size:clamp(46px,6vw,84px);margin:18px 0 22px}}h2{{font-size:clamp(34px,4vw,54px)}}
.lead{{font-size:18px;max-width:520px;opacity:.82;margin:0 0 30px}}.ctas{{display:flex;gap:12px;flex-wrap:wrap}}
.art{{position:relative;aspect-ratio:1/1.02;border-radius:{'10px' if upper else '36px'};background:linear-gradient(150deg,{c['acc']},{c['acc2']});overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,.14)}}
.art:before,.art:after{{content:"";position:absolute;border-radius:50%;border:1.5px solid rgba(255,255,255,.35)}}.art:before{{width:120%;height:120%;left:-35%;top:-30%}}.art:after{{width:80%;height:80%;right:-25%;bottom:-25%}}
.art .big{{position:absolute;left:28px;bottom:24px;color:rgba(255,255,255,.95);font-family:'{tf}',serif;font-size:clamp(40px,5vw,72px);line-height:.95;{'text-transform:uppercase;' if upper else 'font-style:italic;'}}}
.float{{position:absolute;padding:14px 16px;border-radius:16px;background:{c['card']};color:{c['ink']};box-shadow:0 18px 40px rgba(0,0,0,.16);font-size:13px;min-width:190px}}.float b{{display:block;font-size:15px}}.float span{{opacity:.7}}
.f1{{top:24px;right:24px}}.f2{{top:40%;left:24px}}.f3{{bottom:120px;right:30px}}
.facts{{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid {c['line']};border-radius:{'8px' if upper else '22px'};background:{c['card']};margin-top:-36px;position:relative}}
.facts div{{padding:26px 28px;border-left:1px solid {c['line']}}}.facts div:first-child{{border:0}}.facts strong{{display:block;font-family:'{tf}',serif;font-size:38px;line-height:1;color:{c['acc']}}}.facts span{{font-size:13px;opacity:.75}}
section{{padding:100px 0}}.head{{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-bottom:42px}}.head p{{max-width:420px;opacity:.75;margin:0}}
.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}}.card{{padding:28px;border:1px solid {c['line']};border-radius:{'8px' if upper else '22px'};background:{c['card']}}}
.card i{{display:grid;place-items:center;width:46px;height:46px;border-radius:{'6px' if upper else '14px'};background:{c['soft']};color:{c['acc']};font-style:normal;font-size:20px}}.card h3{{font-size:23px;margin:20px 0 6px}}.card p{{margin:0;opacity:.72;font-size:14.5px}}
.split{{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}}.split ul{{list-style:none;padding:0;margin:26px 0 0;display:grid;gap:10px}}.split li{{padding-left:28px;position:relative;font-weight:600}}.split li:before{{content:"✓";position:absolute;left:0;color:{c['acc']}}}
.prices{{border-radius:{'8px' if upper else '26px'};background:{c['soft']};padding:38px}}.prices h3{{font-size:30px;margin-bottom:18px}}.row{{display:flex;justify-content:space-between;gap:20px;padding:15px 0;border-bottom:1px dashed {c['line']};font-weight:600}}.row b{{color:{c['acc']};white-space:nowrap}}
.gal{{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:320px;gap:12px}}.gal div{{position:relative;border-radius:{'8px' if upper else '20px'};overflow:hidden}}
.gal span{{position:absolute;left:14px;bottom:14px;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,.88);color:#111;font-size:12px;font-weight:700}}
.quote{{text-align:center;max-width:820px;margin:0 auto}}.quote blockquote{{margin:0;font-family:'{tf}',serif;font-size:clamp(28px,3.2vw,42px);line-height:1.2;{'text-transform:uppercase;' if upper else 'font-style:italic;'}}}.quote p{{opacity:.7;font-weight:600}}
.info{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}}.info .card h3{{font-size:22px;margin:0 0 14px}}.h{{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid {c['line']};font-size:14px}}
footer{{padding:34px 0;border-top:1px solid {c['line']};font-size:13px;opacity:.75}}footer .wrap{{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}}
@media(max-width:900px){{.links{{display:none}}.hero-grid,.split{{grid-template-columns:1fr}}.grid,.info{{grid-template-columns:1fr}}.facts{{grid-template-columns:1fr}}.facts div{{border-left:0;border-top:1px solid {c['line']}}}.head{{flex-direction:column;align-items:start}}.gal{{grid-template-columns:1fr 1fr;grid-template-rows:200px 160px}}.gal div:first-child{{grid-column:span 2}}nav .btn{{display:none}}}}
"""
    tiles = [f"linear-gradient(140deg,{c['acc']},{c['acc2']})", f"linear-gradient(160deg,{c['soft']},{c['acc2']})", f"linear-gradient(120deg,{c['acc2']},{c['ink']})", f"linear-gradient(150deg,{c['acc']},{c['soft']})"]
    S = s
    body = f"""<div class="demo"><span><b>Esempio di sito creato da Dpzdigital</b> · attività, nomi, prezzi e recensioni sono di fantasia</span><a href="../index.html#lavori">← Torna a dpzdigital.com</a></div>
<header class="hero"><div class="wrap"><nav><a class="logo" href="#">{E(S['name'])}<small>{E(S['kind'])}</small></a><div class="links">{''.join(f'<a href="#">{E(x)}</a>' for x in S['nav'])}</div><a class="btn" href="#contatti">{E(S['cta'])}</a></nav>
<div class="hero-grid"><div><span class="kicker">{E(S['kicker'])}</span><h1>{S['h1']}</h1><p class="lead">{E(S['lead'])}</p><div class="ctas"><a class="btn" href="#contatti">{E(S['cta'])} →</a><a class="btn ghost" href="#servizi">Scopri di più</a></div></div>
<div class="art">{''.join(f'<div class="float f{i+1}"><b>{E(a)}</b><span>{E(b)}</span></div>' for i, (a, b) in enumerate(S['cards']))}<div class="big">{E(S['name'])}</div></div></div></div></header>
<div class="wrap"><div class="facts">{''.join(f'<div><strong>{E(a)}</strong><span>{E(b)}</span></div>' for a, b in S['facts'])}</div></div>
<section id="servizi"><div class="wrap"><div class="head"><div><span class="kicker">COSA FACCIAMO</span><h2 style="margin-top:14px">I nostri <em>servizi</em></h2></div><p>{E(S['lead'])}</p></div><div class="grid">{''.join(f'<article class="card"><i>{E(i)}</i><h3>{E(t)}</h3><p>{E(d)}</p></article>' for i, t, d in S['services'])}</div></div></section>
<section style="padding-top:0"><div class="wrap split"><div><span class="kicker">{E(S['split'][0].upper())}</span><h2 style="margin-top:14px">{S['split'][1]}</h2><p style="opacity:.78;font-size:17px">{E(S['split'][2])}</p><ul>{''.join(f'<li>{E(x)}</li>' for x in S['split'][3])}</ul></div><div class="prices"><h3>{E(S['price_title'])}</h3>{''.join(f'<div class="row"><span>{E(a)}</span><b>{E(b)}</b></div>' for a, b in S['prices'])}<p style="font-size:12px;opacity:.6;margin:16px 0 0">Prezzi di esempio.</p></div></div></section>
<section style="padding-top:0"><div class="wrap"><div class="gal">{''.join(f'<div style="background:{tiles[i % 4]}"><span>{E(g)}</span></div>' for i, g in enumerate(S['gallery'][:3]))}</div></div></section>
<section style="background:{c['soft']}"><div class="wrap quote"><blockquote>“{E(S['quote'][0])}”</blockquote><p>— {E(S['quote'][1])} <span style="opacity:.6">(recensione di esempio)</span></p></div></section>
<section id="contatti"><div class="wrap"><div class="head"><div><span class="kicker">CONTATTI</span><h2 style="margin-top:14px">Vieni a <em>trovarci</em></h2></div><a class="btn" href="#">{E(S['cta'])} →</a></div>
<div class="info"><div class="card"><h3>Orari</h3>{''.join(f'<div class="h"><span>{E(a)}</span><b>{E(b)}</b></div>' for a, b in S['hours'])}</div><div class="card"><h3>Dove siamo</h3><p style="margin:0">Via dell’Esempio 12<br>00000 Città di Esempio</p></div><div class="card"><h3>Contatti</h3><p style="margin:0">Tel. 000 000 0000<br>info@esempio.it</p></div></div></div></section>
<footer><div class="wrap"><span>© {E(S['name'])} — sito dimostrativo: l’attività non esiste.</span><span>Progetto di esempio realizzato da <a href="../index.html" style="text-decoration:underline">Dpzdigital</a></span></div></footer>"""
    return f"""<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>{E(S['name'])} — Esempio di sito · Dpzdigital</title><link rel="icon" href="../assets/favicon.png"><style>{css}</style></head>
<body>{body}</body></html>
"""


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for s in SITES:
        (OUT / f"{s['slug']}.html").write_text(page(s))
        print('ok', s['slug'])
