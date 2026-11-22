// Pobiera atrakcje turystyczne w Polsce z Overpass API i zapisuje je do data/<kategoria>.json
// (format GeoJSON zgodny z eksportem overpass-turbo, przetwarzany dalej przez prepare-data.mjs).
//
// Uruchomienie: npm run fetch-data                  – wszystkie kategorie (wymaga internetu, kilka minut)
//              npm run fetch-data -- nature other  – tylko wybrane kategorie (pozostałe pliki zostają)
//
// Każdy obiekt trafia do dokładnie jednej kategorii – pierwszej pasującej w kolejności CATEGORY_QUERIES
// (np. zamek z muzeum to „Zamki i pałace”, nie „Muzea”).
import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";

const ENDPOINT = process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter";
const OUT = "data";

// Zapytania Overpass QL (bez nagłówka i wyjścia) – kolejność = priorytet przy duplikatach
const CATEGORY_QUERIES = [
  {
    id: "castles",
    query: `
      nwr["historic"~"^(castle|palace|manor)$"](area.pl);
      nwr["building"~"^(castle|palace)$"]["name"](area.pl);`,
  },
  {
    id: "museums",
    query: `nwr["tourism"~"^(museum|gallery)$"](area.pl);`,
  },
  {
    id: "religious",
    query: `
      nwr["amenity"="place_of_worship"]["wikidata"](area.pl);
      nwr["building"~"^(cathedral|basilica)$"](area.pl);
      nwr["historic"~"^(church|monastery|abbey)$"](area.pl);`,
  },
  {
    id: "viewpoints",
    query: `
      nwr["tourism"="viewpoint"](area.pl);
      nwr["man_made"="tower"]["tower:type"="observation"](area.pl);`,
  },
  {
    id: "nature",
    query: `
      nwr["boundary"="national_park"](area.pl);
      nwr["leisure"="nature_reserve"]["name"](area.pl);
      nwr["tourism"~"^(zoo|aquarium)$"](area.pl);
      nwr["leisure"="garden"]["garden:type"="botanical"](area.pl);
      nwr["leisure"="park"]["wikidata"](area.pl);
      nwr["natural"~"^(waterfall|cave_entrance)$"]["name"](area.pl);`,
  },
  {
    id: "monuments",
    query: `
      nwr["historic"~"^(monument|memorial|ruins|archaeological_site|city_gate|citywalls)$"]["name"]
         ["memorial"!~"^(plaque|stolperstein|blue_plaque)$"](area.pl);`,
  },
  {
    id: "other",
    query: `nwr["tourism"~"^(attraction|theme_park)$"](area.pl);`,
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(body, attempt = 1) {
  const q = `[out:json][timeout:180];area["ISO3166-1"="PL"][admin_level=2]->.pl;(${body});out center tags;`;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "poland-attractions-map/1.0" },
    body: new URLSearchParams({ data: q }),
  });
  // Overpass przy przekroczeniu czasu/pamięci zwraca HTTP 200 z pustą listą i polem `remark` –
  // traktujemy to jak błąd, a nie jak „0 obiektów”.
  let problem;
  if (res.ok) {
    const json = await res.json();
    if (!json.remark && json.elements?.length) return json;
    problem = json.remark ? `remark: ${json.remark}` : "pusta odpowiedź";
  } else if (res.status === 429 || res.status >= 500) {
    problem = `HTTP ${res.status}`;
  } else {
    throw new Error(`Overpass HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  if (attempt >= 5) throw new Error(`Overpass: ${problem} (po ${attempt} próbach)`);
  const wait = 15000 * attempt;
  console.warn(`  ${problem}, ponawiam za ${wait / 1000} s…`);
  await sleep(wait);
  return overpass(body, attempt + 1);
}

// Element Overpass -> Feature (Point) w formacie overpass-turbo
function toFeature(el) {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;
  return {
    type: "Feature",
    properties: { type: el.type, id: el.id, tags: el.tags || {} },
    geometry: { type: "Point", coordinates: [lon, lat] },
  };
}

const only = process.argv.slice(2);
const unknown = only.filter((id) => !CATEGORY_QUERIES.some((c) => c.id === id));
if (unknown.length) throw new Error(`Nieznane kategorie: ${unknown.join(", ")}`);

await mkdir(OUT, { recursive: true });
if (!only.length) {
  // Pełne pobranie: usuwamy stare pliki, żeby w data/ nie zostały nieużywane warstwy
  for (const f of await readdir(OUT)) if (f.endsWith(".json")) await unlink(join(OUT, f));
}

// Obiekt trafia tylko do pierwszej pasującej kategorii; przy pobieraniu częściowym
// kategorie niepobierane wczytujemy z dysku, żeby zachować tę samą zasadę.
const seen = new Set();
for (const { id, query } of CATEGORY_QUERIES) {
  if (only.length && !only.includes(id)) {
    try {
      const prev = JSON.parse(await readFile(join(OUT, `${id}.json`), "utf8"));
      for (const f of prev.features) seen.add(`${f.properties.type}/${f.properties.id}`);
    } catch {
      /* brak pliku – pomijamy */
    }
    continue;
  }
  const { elements } = await overpass(query);
  const features = [];
  for (const el of elements) {
    const key = `${el.type}/${el.id}`;
    if (seen.has(key)) continue;
    const f = toFeature(el);
    if (!f) continue;
    seen.add(key);
    features.push(f);
  }
  await writeFile(join(OUT, `${id}.json`), JSON.stringify({ type: "FeatureCollection", features }));
  console.log(`  ${id.padEnd(12)} ${String(features.length).padStart(6)} obiektów`);
  await sleep(5000); // grzecznie wobec publicznego serwera
}

console.log(`Gotowe – dane zapisane w ${OUT}/`);
