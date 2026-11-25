# 🎣 PescaLife

Sito amatoriale dedicato alla pesca sportiva in **Val di Cecina** (Toscana): schede dei corsi d'acqua, specie ittiche, normativa regionale e una mappa interattiva delle acque interne.

> ⚠️ Progetto in sviluppo. I contenuti sono in via di verifica e non sostituiscono le fonti ufficiali: prima di pescare controlla sempre la normativa vigente della Regione Toscana.

## Cosa trovi

- **Mappa interattiva** delle acque interne, costruita con [MapLibre GL JS](https://maplibre.org/) su dati cartografici CTR 1:10.000 (idrografia, specchi d'acqua, strade, toponimi, confini comunali)
- **Luoghi**: schede dei corsi d'acqua del bacino del Cecina, con regole di pesca, accessi, criticità, comuni attraversati, punti di interesse e un cenno storico
- **Specie**: schede delle specie ittiche della valle, con regole regionali, riconoscimento e presenza locale
- **Normativa** e **note legali**: riferimenti alle fonti regionali (L.R. 7/2005, regolamento 6/R/2018 e relativi allegati)
- **Tecniche**, **attrezzatura**, **meteo**, **eventi** e **diario**
- Pagina **info** sul progetto

## Struttura della repo

```
pescalife/
├── index.html            # home
├── mappa.html            # mappa interattiva
├── luoghi.html           # elenco dei luoghi di pesca
├── specie.html           # elenco delle specie
├── tecniche.html
├── attrezzatura.html
├── meteo.html
├── eventi.html
├── diario.html
├── normativa.html
├── notelegali.html
├── info.html
├── 404.html
├── luoghi/               # schede dei singoli luoghi
├── specie/               # schede delle singole specie
├── data/                 # dati (GeoJSON e simili)
├── fonti/                # fonti normative e documentali
├── ricerche/             # appunti e ricerche di supporto
├── templates/            # template per nuove schede
├── tools/                # script di utilità
├── css/
├── js/
└── assets/               # immagini e risorse statiche
```

## Tecnologie

- HTML, CSS e JavaScript vanilla (nessun build step)
- MapLibre GL JS per la mappa
- Dati geografici in formato GeoJSON

## Avvio in locale

Il sito è statico. Per evitare problemi di caricamento dei file di dati (GeoJSON), servilo con un piccolo server locale invece di aprire i file direttamente:

```bash
git clone https://github.com/matteocomo/pescalife.git
cd pescalife

# con Python
python -m http.server 8000
# oppure con Node
npx serve .
```

Poi apri `http://localhost:8000`.

## Aggiungere un nuovo contenuto

1. Copia il template corrispondente da `templates/`
2. Salvalo in `luoghi/` (per un luogo) o in `specie/` (per una specie)
3. Compila la scheda usando **fonti ufficiali** (salvale in `fonti/`)
4. Collega la scheda alla mappa e agli elenchi (`luoghi.html` / `specie.html`)

Se un luogo non è pescabile (ad esempio proprietà privata), va dichiarato esplicitamente nella scheda.

## Fonti

- Regione Toscana: L.R. 7/2005, regolamento 6/R/2018, allegato A, tabelle delle zone di frega e di protezione
- Cartografia: Carta Tecnica Regionale 1:10.000

## Roadmap

- [ ] Completare le schede dei corsi d'acqua del bacino del Cecina
- [ ] Completare le schede delle specie ittiche
- [ ] Livello 3D (rilievo/terreno) sulla mappa
- [ ] Negozi di pesca della zona nella sezione Luoghi

## Contributi

Segnalazioni, correzioni e suggerimenti sono benvenuti: apri una [issue](https://github.com/matteocomo/pescalife/issues).

## Licenza

Da definire.

## Autore

[Matteo](https://github.com/matteocomo)
