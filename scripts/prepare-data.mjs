// Przygotowuje dane do publikacji: data/*.json (z fetch-data.mjs / overpass-turbo) -> public/data/*.json
// - zostawia tylko tagi używane przez aplikację (nazwa, adres, opis, rodzaj obiektu…)
// - zaokrągla współrzędne do 5 miejsc (~1 m), zapisuje środek obiektu
// - usuwa z public/data pliki, których nie ma już w data/
// Uruchamiane automatycznie przed `npm run dev` i `npm run build`.
import { readdir, readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { join, basename } from "node:path";

const SRC = "data";
const OUT = join("public", "data");

// Tagi czytane przez src/popup.js i src/categories.js (kindLabel, TAG_LABELS) oraz wyszukiwarkę
const KEEP_TAGS = new Set([
  "name", "name:pl", "official_name",
  "addr:street", "addr:place", "addr:housenumber", "addr:postcode", "addr:city",
  "historic", "building", "tower:type", "tourism", "boundary", "garden:type", "leisure", "natural", "amenity",
  "description", "start_date", "architect", "heritage", "operator", "opening_hours", "fee", "ele",
  "phone", "website", "wikipedia",
]);

const round = (n) => Math.round(n * 1e5) / 1e5;
const roundCoords = (c) => (typeof c[0] === "number" ? [round(c[0]), round(c[1])] : c.map(roundCoords));

// Środek [lat, lng] obiektu (środek prostokąta otaczającego)
function center(coords) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (c) => {
    if (typeof c[0] === "number") {
      if (c[0] < minX) minX = c[0];
      if (c[0] > maxX) maxX = c[0];
      if (c[1] < minY) minY = c[1];
      if (c[1] > maxY) maxY = c[1];
    } else c.forEach(walk);
  };
  walk(coords);
  return [round((minY + maxY) / 2), round((minX + maxX) / 2)];
}

const pickTags = (tags) => Object.fromEntries(Object.entries(tags).filter(([k]) => KEEP_TAGS.has(k)));

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => f.endsWith(".json"));

for (const f of await readdir(OUT)) {
  if (f.endsWith(".json") && !files.includes(f)) await unlink(join(OUT, f));
}

let totalIn = 0, totalOut = 0;
for (const file of files) {
  const raw = await readFile(join(SRC, file), "utf8");
  const src = JSON.parse(raw);
  const features = (src.features || [])
    .filter((f) => f.geometry && f.geometry.coordinates)
    .map((f) => {
      const p = f.properties || {};
      const osmType = p.type || "way";
      return {
        type: "Feature",
        properties: { ...pickTags(p.tags || {}), _osm: `${osmType}/${p.id}`, _c: center(f.geometry.coordinates) },
        geometry: { type: f.geometry.type, coordinates: roundCoords(f.geometry.coordinates) },
      };
    });
  const out = JSON.stringify({ type: "FeatureCollection", features });
  await writeFile(join(OUT, file), out);
  totalIn += raw.length;
  totalOut += out.length;
  console.log(`  ${basename(file, ".json").padEnd(14)} ${String(features.length).padStart(6)} obiektów`);
}

console.log(`Dane gotowe: ${(totalIn / 1e6).toFixed(1)} MB -> ${(totalOut / 1e6).toFixed(1)} MB`);
