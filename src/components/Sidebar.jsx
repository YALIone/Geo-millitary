import { useMemo, useState } from "react";
import { CATEGORIES, CATEGORY_BY_ID } from "../categories";
import { featureName } from "../popup";

const MAX_RESULTS = 40;
const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

export default function Sidebar({
  data, loaded, total, failed,
  enabled, setEnabled, colors, setColors,
  weight, setWeight, opacity, setOpacity,
  smallAsPoints, setSmallAsPoints,
  onSelect, onFit, onResetStyle, open, setOpen,
}) {
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => Object.fromEntries(Object.entries(data).map(([id, g]) => [id, g.features.length])),
    [data]
  );
  const visibleCount = CATEGORIES.reduce((n, c) => n + (enabled[c.id] ? counts[c.id] || 0 : 0), 0);
  const allOn = CATEGORIES.every((c) => enabled[c.id]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return null;
    const out = [];
    for (const c of CATEGORIES) {
      if (!enabled[c.id] || !data[c.id]) continue;
      for (const f of data[c.id].features) {
        const name = featureName(f.properties);
        const city = f.properties["addr:city"];
        if ((name && normalize(name).includes(q)) || (city && normalize(city).includes(q))) {
          out.push(f);
        }
      }
    }
    return out;
  }, [query, data, enabled]);

  const toggleAll = () =>
    setEnabled(Object.fromEntries(CATEGORIES.map((c) => [c.id, !allOn])));

  const only = (id) => setEnabled(Object.fromEntries(CATEGORIES.map((c) => [c.id, c.id === id])));

  return (
    <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Panel sterowania">
      <header className="sb-header">
        <div>
          <h1>Obiekty wojskowe w Polsce</h1>
          <p className="muted">Dane: OpenStreetMap · {visibleCount.toLocaleString("pl-PL")} widocznych obiektów</p>
        </div>
        <button className="icon-btn sb-close" onClick={() => setOpen(false)} aria-label="Zamknij panel">✕</button>
      </header>

      {loaded < total && (
        <div className="progress" role="status">
          <div className="progress-bar" style={{ width: `${(loaded / total) * 100}%` }} />
          <span>Wczytywanie warstw… {loaded}/{total}</span>
        </div>
      )}
      {failed.length > 0 && (
        <div className="alert" role="alert">
          Nie udało się wczytać: {failed.map((id) => CATEGORY_BY_ID[id].label).join(", ")}
        </div>
      )}

      <section className="sb-section">
        <label className="search">
          <span className="sr-only">Szukaj obiektu</span>
          <input
            type="search"
            placeholder="Szukaj po nazwie lub mieście…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {results && (
          <div className="results">
            <div className="results-head muted">
              {results.length === 0 ? "Brak wyników w włączonych warstwach" : `Znaleziono: ${results.length}`}
            </div>
            <ul>
              {results.slice(0, MAX_RESULTS).map((f) => {
                const cat = CATEGORY_BY_ID[f.properties._cat];
                return (
                  <li key={f.properties._cat + f.properties._osm}>
                    <button
                      onClick={() => {
                        onSelect(f);
                        if (window.matchMedia("(max-width: 720px)").matches) setOpen(false);
                      }}
                    >
                      <span className="dot" style={{ background: colors[cat.id] }} />
                      <span className="res-name">{featureName(f.properties) || "Obiekt bez nazwy"}</span>
                      <span className="res-meta muted">
                        {cat.label}
                        {f.properties["addr:city"] ? ` · ${f.properties["addr:city"]}` : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {results.length > MAX_RESULTS && (
              <div className="muted results-more">…i {results.length - MAX_RESULTS} więcej. Doprecyzuj wyszukiwanie.</div>
            )}
          </div>
        )}
      </section>

      <section className="sb-section">
        <div className="sb-row">
          <h2>Warstwy</h2>
          <button className="link-btn" onClick={toggleAll}>{allOn ? "Ukryj wszystkie" : "Pokaż wszystkie"}</button>
        </div>
        <ul className="layers">
          {CATEGORIES.map((c) => (
            <li key={c.id} className={enabled[c.id] ? "" : "is-off"}>
              <input
                type="color"
                value={colors[c.id]}
                onChange={(e) => setColors((s) => ({ ...s, [c.id]: e.target.value }))}
                aria-label={`Kolor: ${c.label}`}
                title="Zmień kolor"
              />
              <label>
                <input
                  type="checkbox"
                  checked={!!enabled[c.id]}
                  onChange={(e) => setEnabled((s) => ({ ...s, [c.id]: e.target.checked }))}
                />
                <span className="layer-name">{c.label}</span>
              </label>
              <span className="count">{counts[c.id] ?? "…"}</span>
              <button className="link-btn only" onClick={() => only(c.id)} title={`Pokaż tylko: ${c.label}`}>tylko</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="sb-section">
        <div className="sb-row">
          <h2>Styl</h2>
          <button className="link-btn" onClick={onResetStyle}>Przywróć domyślne</button>
        </div>
        <label className="slider">
          <span>Grubość linii <b>{weight}px</b></span>
          <input type="range" min="1" max="10" value={weight} onChange={(e) => setWeight(+e.target.value)} />
        </label>
        <label className="slider">
          <span>Krycie <b>{Math.round(opacity * 100)}%</b></span>
          <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(+e.target.value)} />
        </label>
        <label className="check">
          <input type="checkbox" checked={smallAsPoints} onChange={(e) => setSmallAsPoints(e.target.checked)} />
          <span>Małe obiekty jako punkty przy oddaleniu</span>
        </label>
      </section>

      <footer className="sb-footer">
        <button className="btn" onClick={onFit} disabled={visibleCount === 0}>Dopasuj widok do warstw</button>
      </footer>
    </aside>
  );
}
