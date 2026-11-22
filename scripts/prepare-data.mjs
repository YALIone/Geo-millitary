// Przygotowuje dane do publikacji: data/*.json (eksport z Overpass) -> public/data/*.json
// - usuwa zbędne listy węzłów (nodes), przenosi tagi do properties
// - zaokrągla współrzędne do 5 miejsc (~1 m), liczy środek obiektu
// Uruchamiane automatycznie przed `npm run dev` i `npm run build`.
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, basename } from "node:path";

const SRC = "data";
const OUT = join("public", "data");

const round = (n) => Math.round(n * 1e5) / 1e5;
const roundCoords = (c) => (typeof c[0] === "number" ? [round(c[0]), round(c[1])] : c.map(roundCoords));

// Zwraca środek [lat, lng] i rozmiar (największy wymiar w stopniach) obiektu
function bboxInfo(coords) {
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
  return {
    center: [round((minY + maxY) / 2), round((minX + maxX) / 2)],
    size: Math.round(Math.max(maxX - minX, maxY - minY) * 1e5) / 1e5,
  };
}

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => f.endsWith(".json"));
let totalIn = 0, totalOut = 0;

for (const file of files) {
  const raw = await readFile(join(SRC, file), "utf8");
  const src = JSON.parse(raw);
  const features = (src.features || [])
    .filter((f) => f.geometry && f.geometry.coordinates)
    .map((f) => {
      const p = f.properties || {};
      const osmType = p.type || "way";
      const { center, size } = bboxInfo(f.geometry.coordinates);
      return {
        type: "Feature",
        properties: {
          ...(p.tags || {}),
          _osm: `${osmType}/${p.id}`,
          _c: center,
          _s: size,
        },
        geometry: { type: f.geometry.type, coordinates: roundCoords(f.geometry.coordinates) },
      };
    });
  const out = JSON.stringify({ type: "FeatureCollection", features });
  await writeFile(join(OUT, file), out);
  totalIn += raw.length;
  totalOut += out.length;
  console.log(`  ${basename(file, ".json").padEnd(14)} ${String(features.length).padStart(5)} obiektów`);
}

console.log(`Dane gotowe: ${(totalIn / 1e6).toFixed(1)} MB -> ${(totalOut / 1e6).toFixed(1)} MB`);
