# Tourist Attractions in Poland – Interactive Map

An interactive web map of tourist attractions and landmarks across Poland – castles, museums, monuments,
viewpoints, nature sites and religious buildings – built with React and Leaflet on top of
[OpenStreetMap](https://www.openstreetmap.org) data. The user interface is in Polish
(*„Atrakcje turystyczne w Polsce”*).

## Key Features

- **7 colour-coded layers** – each with its own toggle, item counter, colour picker and a *„tylko”* (“only”)
  button that shows just that layer; *„Pokaż / Ukryj wszystkie”* toggles all of them at once.
- **Search** by attraction name or city (works without Polish diacritics, e.g. `wawel`, `lodz`).
  Clicking a result flies to the place, highlights it and opens its details.
- **Detail popups** – name, category, type (e.g. *Zamek*, *Bazylika*, *Wodospad*), address, opening hours,
  fee, heritage status, website, Wikipedia link, plus links to OpenStreetMap and Google Maps.
- **Hover tooltips** with the attraction name.
- **„Dopasuj widok do warstw”** – zooms the map to fit all currently visible layers.
- **Base maps**: OpenStreetMap, CARTO Light, CARTO Dark, Esri satellite imagery.
- **Style controls** – point size and opacity; layer, colour and style settings are remembered in the browser
  (`localStorage`).
- **Responsive** – collapsible side panel, usable on phones.
- **Static site** – no backend; the data is pre-processed into small JSON files served with the app.

## Tech Stack

| Area            | Technology                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------- |
| UI              | [React 19](https://react.dev)                                                               |
| Map             | [Leaflet 1.9](https://leafletjs.com) + [React Leaflet 5](https://react-leaflet.js.org)      |
| Map data        | [OpenStreetMap](https://www.openstreetmap.org) via the [Overpass API](https://overpass-api.de) |
| Tiles           | OpenStreetMap, [CARTO](https://carto.com/basemaps), Esri World Imagery                      |
| Build / dev     | [Vite 7](https://vite.dev), ESLint 9                                                        |
| Hosting         | GitHub Pages (GitHub Actions workflow), or any static host                                  |

## Data Source & Categories

All data comes from OpenStreetMap (© OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright)),
downloaded with the Overpass API by `scripts/fetch-data.mjs`. Every OSM object is reduced to a single point
(its centre) and assigned to **exactly one** category – the first one that matches, in the order below
(so a castle that houses a museum is shown as a castle).

| Layer (UI name)                                   | File              | OSM tags used                                                                                                                   |
| ------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Castles & Palaces – *Zamki i pałace*              | `castles.json`    | `historic=castle\|palace\|manor`, `building=castle\|palace` (named)                                                             |
| Museums & Galleries – *Muzea i galerie*           | `museums.json`    | `tourism=museum\|gallery`                                                                                                       |
| Religious Sites – *Obiekty sakralne*              | `religious.json`  | `amenity=place_of_worship` with `wikidata`, `building=cathedral\|basilica`, `historic=church\|monastery\|abbey`                 |
| Viewpoints & Towers – *Punkty widokowe*           | `viewpoints.json` | `tourism=viewpoint`, `man_made=tower` + `tower:type=observation`                                                                |
| Parks & Nature – *Parki i atrakcje przyrodnicze*  | `nature.json`     | `boundary=national_park`, named `leisure=nature_reserve`, `tourism=zoo\|aquarium`, botanical gardens, `leisure=park` with `wikidata`, named waterfalls and caves |
| Monuments & Memorials – *Pomniki i zabytki*       | `monuments.json`  | named `historic=monument\|memorial\|ruins\|archaeological_site\|city_gate\|citywalls` (plaques and stolpersteine excluded)      |
| Other Attractions – *Inne atrakcje*               | `other.json`      | `tourism=attraction\|theme_park` not matched above                                                                              |

The table lists layers in assignment-priority order; the sidebar shows them in a more natural reading order
(defined in `src/categories.js`).

### Data pipeline

```
Overpass API ──(npm run fetch-data)──▶ data/*.json ──(npm run data)──▶ public/data/*.json ──▶ browser
                 scripts/fetch-data.mjs   raw GeoJSON    scripts/prepare-data.mjs   slimmed GeoJSON
```

- `fetch-data` is run **manually** when you want fresh data (needs internet, takes several minutes).
  The public Overpass server is often busy: the script retries on HTTP 429/5xx and on timeout responses, and
  never saves an empty layer. To refresh only some layers, pass their ids, e.g.
  `npm run fetch-data -- nature other`. Set `OVERPASS_URL` to use a different Overpass mirror.
- `data` runs **automatically** before `npm run dev` and `npm run build`. It keeps only the OSM tags the app
  displays, rounds coordinates to ~1 m, stores each object's centre and removes stale files from `public/data/`.

## Installation / Local Setup

Requirements: [Node.js](https://nodejs.org) 20+ and npm.

```bash
git clone https://github.com/YALIone/Geo-millitary.git
cd Geo-millitary
npm install
npm run dev            # http://localhost:5173
```

Other commands:

```bash
npm run fetch-data     # re-download attractions from OpenStreetMap into data/ (only needed to refresh data)
npm run build          # production build into dist/
npm run preview        # serve the production build locally
npm run lint           # run ESLint
```

### Deployment

`npm run build` produces a fully static site in `dist/` with relative paths, so it works under any URL.

- **GitHub Pages:** in the repository go to *Settings → Pages → Source: GitHub Actions*. Every push to `main`
  runs `.github/workflows/deploy.yml` (lint, build, publish).
- **Netlify / Vercel:** build command `npm run build`, output directory `dist`.

## Project Structure

```
.
├── .github/workflows/deploy.yml   # CI: lint, build and deploy to GitHub Pages
├── data/                          # raw attraction data from Overpass (one GeoJSON file per category)
├── public/
│   ├── favicon.svg
│   └── data/                      # generated by prepare-data.mjs (git-ignored)
├── scripts/
│   ├── fetch-data.mjs             # downloads & categorises attractions from the Overpass API
│   └── prepare-data.mjs           # slims raw data into public/data/
├── src/
│   ├── main.jsx                   # React entry point
│   ├── App.jsx                    # map, base layers, settings state, fit-to-layers, selection
│   ├── AttractionLayer.jsx        # renders each category as colour-coded circle markers
│   ├── useAttractionData.js       # loads all category files in parallel
│   ├── categories.js              # category list (ids, Polish labels, colours) and popup tag labels
│   ├── popup.js                   # popup HTML (escaped OSM values, links)
│   ├── components/Sidebar.jsx     # search, layer toggles & counters, style controls
│   ├── index.css                  # base styles / CSS variables
│   └── style.css                  # app layout and component styles
├── index.html
├── vite.config.js
├── eslint.config.js
└── package.json
```

### Adding or changing a category

1. Add (or edit) an entry in `CATEGORY_QUERIES` in `scripts/fetch-data.mjs` and run `npm run fetch-data`.
2. Add a matching `{ id, label, color }` entry to `CATEGORIES` in `src/categories.js`
   (`id` must equal the data file name).

## Attribution & License

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the
Open Database License (ODbL). Base map tiles © OpenStreetMap, © CARTO and © Esri, according to the selected layer.
