"""Schermate dei gestionali mostrate nella sezione "Gestionali" del sito (dati tutti di esempio).
Uso: python3 tools/gestionali.py <cartella-uscita>  →  un PNG 1440x900 per gestionale."""
import html, sys, pathlib
from playwright.sync_api import sync_playwright

E = html.escape
OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'gestionali'); OUT.mkdir(parents=True, exist_ok=True)

APPS = [
  dict(slug='discoteca', name='Night Club', acc='#a855f7', acc2='#ec4899', dark=True,
       menu=['Serate', 'Liste PR', 'Ingresso QR', 'Foto', 'Report'], active=1, title='Liste PR · Sabato 14',
       kpi=[('Iscritti in lista', '412'), ('Entrati', '287'), ('PR attivi', '18'), ('Tavoli', '9/12')],
       cols=['Ospite', 'PR', 'Persone', 'Stato'],
       rows=[('Giulia R.', 'Marco', '4', 'Entrata'), ('Andrea B.', 'Sara', '2', 'In lista'), ('Tavolo 7 · Luca', 'Marco', '8', 'Entrata'), ('Chiara M.', 'Davide', '3', 'In lista'), ('Simone T.', 'Sara', '2', 'Entrata'), ('Elena F.', 'Davide', '5', 'In lista')],
       side=('Ingresso', 'Scansiona il QR della lista', 'QR')),
  dict(slug='ristorante', name='Trattoria', acc='#c8492f', acc2='#f59e0b',
       menu=['Prenotazioni', 'Sala', 'Menù', 'Clienti', 'Incassi'], active=0, title='Prenotazioni · Venerdì sera',
       kpi=[('Coperti', '64/80'), ('Tavoli liberi', '5'), ('Da confermare', '3'), ('Asporto', '11')],
       cols=['Ora', 'Nome', 'Persone', 'Tavolo'],
       rows=[('19:30', 'Rossi', '4', 'T3 · Terrazza'), ('20:00', 'Bianchi', '2', 'T8'), ('20:00', 'Compleanno Sara', '10', 'Sala privata'), ('20:30', 'Ferri', '3', 'T5'), ('21:00', 'Moretti', '2', 'T1 · Terrazza'), ('21:15', 'Gallo', '6', 'T10')],
       side=('Promemoria', 'WhatsApp inviati a 18 clienti', '✓')),
  dict(slug='palestra', name='Gym Manager', acc='#65a30d', acc2='#0ea5e9',
       menu=['Iscritti', 'Abbonamenti', 'Corsi', 'Ingressi', 'Pagamenti'], active=1, title='Abbonamenti in scadenza',
       kpi=[('Iscritti attivi', '386'), ('Ingressi oggi', '142'), ('In scadenza', '27'), ('Corsi pieni', '6')],
       cols=['Iscritto', 'Abbonamento', 'Scade', 'Certificato'],
       rows=[('Luca P.', 'Annuale', '3 giorni', 'Valido'), ('Marta S.', 'Trimestrale', '5 giorni', 'Valido'), ('Paolo G.', 'Mensile', 'Oggi', 'Da rinnovare'), ('Sofia L.', 'Open', '7 giorni', 'Valido'), ('Ivan D.', 'PT 10', '2 lezioni', 'Valido'), ('Nadia C.', 'Mensile', 'Domani', 'Valido')],
       side=('Rinnovo', 'Link di pagamento inviato', '€')),
  dict(slug='immobiliare', name='Immobili', acc='#0f766e', acc2='#38bdf8',
       menu=['Immobili', 'Richieste', 'Visite', 'Clienti', 'Documenti'], active=2, title='Visite della settimana',
       kpi=[('Immobili attivi', '48'), ('Richieste nuove', '12'), ('Visite', '9'), ('Proposte', '3')],
       cols=['Quando', 'Immobile', 'Cliente', 'Agente'],
       rows=[('Lun 10:00', 'Trilocale centro', 'F. Neri', 'Anna'), ('Lun 15:30', 'Villa con giardino', 'M. Conti', 'Luca'), ('Mar 11:00', 'Bilocale mare', 'S. Riva', 'Anna'), ('Mer 17:00', 'Attico panoramico', 'G. Sala', 'Luca'), ('Gio 09:30', 'Negozio 80 m²', 'R. Testa', 'Anna'), ('Ven 18:00', 'Casale con terreno', 'P. Villa', 'Luca')],
       side=('Abbinamenti', '7 clienti per il nuovo trilocale', '⌂')),
  dict(slug='estetica', name='Beauty Lab', acc='#db2777', acc2='#f9a8d4',
       menu=['Agenda', 'Clienti', 'Trattamenti', 'Pacchetti', 'Magazzino'], active=0, title='Agenda · Oggi',
       kpi=[('Appuntamenti', '23'), ('Operatrici', '4'), ('Pacchetti attivi', '58'), ('Prodotti sotto scorta', '3')],
       cols=['Ora', 'Cliente', 'Trattamento', 'Cabina'],
       rows=[('09:00', 'Elisa', 'Pulizia viso', 'Cabina 1'), ('09:30', 'Martina', 'Laser · 5/8', 'Cabina 2'), ('10:15', 'Giorgia', 'Manicure', 'Postazione'), ('11:00', 'Valentina', 'Massaggio', 'Cabina 3'), ('12:00', 'Carla', 'Pressoterapia', 'Cabina 2'), ('14:30', 'Irene', 'Ceretta', 'Cabina 1')],
       side=('Promemoria', 'Inviati per domani: 19', '✓')),
]


def page(a):
    dark = a.get('dark')
    bg, panel, ink, mute, line = ('#0f0f14', '#17171f', '#f3f3f7', '#8b8b9a', '#262633') if dark else ('#f4f5f8', '#ffffff', '#141821', '#6b7280', '#e7e9ef')
    acc, acc2 = a['acc'], a['acc2']
    chip = lambda s: f'<span class="chip {"ok" if s in ("Entrata", "Valido", "T3 · Terrazza") else ""}">{E(s)}</span>'
    rows = ''.join(f'<tr>{"".join(f"<td>{chip(v) if i == len(r) - 1 else E(v)}</td>" for i, v in enumerate(r))}</tr>' for r in a['rows'])
    bars = ''.join(f'<i style="height:{h}%"></i>' for h in (38, 55, 47, 70, 62, 85, 74, 92, 66, 80, 58, 96))
    return f"""<!doctype html><html><head><meta charset=utf-8><style>
*{{box-sizing:border-box}}body{{margin:0;width:1440px;height:900px;background:{bg};color:{ink};font-family:Inter,Arial,sans-serif;display:grid;grid-template-columns:240px 1fr;overflow:hidden}}
aside{{padding:26px 18px;border-right:1px solid {line};background:{panel}}}.brand{{display:flex;align-items:center;gap:10px;font-weight:800;font-size:17px;margin:0 8px 30px}}.brand i{{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,{acc},{acc2})}}
aside a{{display:block;padding:11px 14px;border-radius:12px;color:{mute};font-weight:600;font-size:14.5px;margin-bottom:4px}}aside a.on{{background:linear-gradient(135deg,{acc},{acc2});color:#fff}}
main{{padding:28px 34px;display:flex;flex-direction:column;gap:20px}}header{{display:flex;justify-content:space-between;align-items:center}}h1{{margin:0;font-size:28px;letter-spacing:-.02em}}
.btn{{padding:11px 18px;border-radius:12px;background:{acc};color:#fff;font-weight:700;font-size:14px}}
.kpi{{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}}.kpi div{{padding:18px 20px;border-radius:18px;background:{panel};border:1px solid {line}}}.kpi small{{color:{mute};font-weight:600;font-size:13px}}.kpi b{{display:block;font-size:30px;margin-top:6px;letter-spacing:-.02em}}
.grid{{display:grid;grid-template-columns:1fr 330px;gap:14px;flex:1;min-height:0}}.card{{border-radius:18px;background:{panel};border:1px solid {line};padding:18px 20px}}
table{{width:100%;border-collapse:collapse;font-size:14.5px}}th{{text-align:left;color:{mute};font-size:12px;text-transform:uppercase;letter-spacing:.08em;padding:8px 6px;border-bottom:1px solid {line}}}td{{padding:14px 6px;border-bottom:1px solid {line};font-weight:600}}
.chip{{padding:5px 10px;border-radius:999px;background:{'#262633' if dark else '#f1f2f6'};color:{mute};font-size:12px;font-weight:700}}.chip.ok{{background:color-mix(in srgb,{acc} 18%,transparent);color:{acc}}}
.side{{display:flex;flex-direction:column;gap:14px}}.big{{display:grid;place-items:center;height:150px;border-radius:16px;background:linear-gradient(135deg,{acc},{acc2});color:#fff;font-size:54px;font-weight:800}}
.bars{{display:flex;align-items:end;gap:6px;height:120px;margin-top:12px}}.bars i{{flex:1;border-radius:6px 6px 2px 2px;background:linear-gradient({acc2},{acc})}}
</style></head><body><aside><div class=brand><i></i>{E(a['name'])}</div>{''.join(f'<a class="{"on" if i == a["active"] else ""}">{E(m)}</a>' for i, m in enumerate(a['menu']))}</aside>
<main><header><h1>{E(a['title'])}</h1><span class=btn>+ Nuovo</span></header>
<div class=kpi>{''.join(f'<div><small>{E(k)}</small><b>{E(v)}</b></div>' for k, v in a['kpi'])}</div>
<div class=grid><div class=card><table><thead><tr>{''.join(f'<th>{E(c)}</th>' for c in a['cols'])}</tr></thead><tbody>{rows}</tbody></table></div>
<div class=side><div class=card><b>{E(a['side'][0])}</b><p style="color:{mute};margin:6px 0 14px;font-size:14px">{E(a['side'][1])}</p><div class=big>{E(a['side'][2])}</div></div><div class=card><b>Andamento</b><div class=bars>{bars}</div></div></div></div></main></body></html>"""


with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1440, 'height': 900})
    for a in APPS:
        pg.set_content(page(a)); pg.wait_for_timeout(150)
        pg.screenshot(path=str(OUT / f"{a['slug']}.png")); print('ok', a['slug'])
    b.close()
