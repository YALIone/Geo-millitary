import { CATEGORY_BY_ID, TAG_LABELS } from "./categories";

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

export const featureName = (p) => p.name || p["name:pl"] || p.official_name || null;

function linkFor(key, value) {
  if (key === "website" && /^https?:\/\//i.test(value)) {
    return `<a href="${escape(value)}" target="_blank" rel="noopener">${escape(value.replace(/^https?:\/\//, ""))}</a>`;
  }
  if (key === "wikipedia") {
    const [lang, ...title] = value.split(":");
    const t = title.join(":");
    if (lang && t) {
      return `<a href="https://${escape(lang)}.wikipedia.org/wiki/${encodeURIComponent(t)}" target="_blank" rel="noopener">${escape(t)}</a>`;
    }
  }
  return escape(value);
}

// Zwraca HTML okienka z bezpiecznie zakodowanymi danymi z OSM
export function popupHtml(p) {
  const cat = CATEGORY_BY_ID[p._cat];
  const name = featureName(p);
  const address = [p["addr:street"], p["addr:housenumber"]].filter(Boolean).join(" ");
  const city = [p["addr:postcode"], p["addr:city"]].filter(Boolean).join(" ");

  const rows = Object.entries(TAG_LABELS)
    .filter(([k]) => p[k])
    .map(([k, label]) => `<tr><th>${label}</th><td>${linkFor(k, p[k])}</td></tr>`);
  if (address || city) rows.unshift(`<tr><th>Adres</th><td>${escape([address, city].filter(Boolean).join(", "))}</td></tr>`);

  const [lat, lng] = p._c || [];
  return `
    <div class="pop">
      <span class="pop-cat" style="--c:${cat?.color ?? "#64748b"}">${escape(cat?.label ?? p._cat)}</span>
      <h3>${name ? escape(name) : '<span class="muted">Obiekt bez nazwy</span>'}</h3>
      ${rows.length ? `<table>${rows.join("")}</table>` : ""}
      <div class="pop-links">
        <a href="https://www.openstreetmap.org/${escape(p._osm)}" target="_blank" rel="noopener">OpenStreetMap ↗</a>
        ${lat ? `<a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener">Google Maps ↗</a>` : ""}
      </div>
    </div>`;
}
