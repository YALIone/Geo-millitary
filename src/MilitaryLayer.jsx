import { useEffect, useState, useRef } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import "./style.css";

const MILITARY_TYPES = [
  "all", // Nowa opcja
  "barracks", "naval_base", "airfield", "training_area", 
  "range", "primary", "office", "danger_area", "shelter", "bunker"
];

const MILITARY_LABELS = {
  all: "Wszystkie warstwy",
  barracks: "Koszary",
  naval_base: "Baza morska",
  airfield: "Lotnisko wojskowe",
  training_area: "Obszar szkoleniowy",
  range: "Poligon",
  primary: "Główny obiekt",
  office: "Biuro/Sztab",
  danger_area: "Strefa niebezpieczna",
  shelter: "Schron",
  bunker: "Bunkier"
};

export default function MilitaryOSMLayer() {
  const [militaryType, setMilitaryType] = useState("all"); // Domyślnie wszystkie
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [color, setColor] = useState("#ff0000");
  const [weight, setWeight] = useState(4); // Nieco cieńsze linie dla wielu warstw
  const [opacity, setOpacity] = useState(0.8);

  const layerRef = useRef(null);
  const map = useMap();

  const fetchData = async (type) => {
    setLoading(true);
    setData(null);
    setError(null);

    try {
      if (type === "all") {
        // Pobieranie wszystkich plików jednocześnie (z pominięciem 'all')
        const typesToFetch = MILITARY_TYPES.filter(t => t !== "all");
        const promises = typesToFetch.map(t => fetch(`/data/${t}.json`).then(r => {
          if (!r.ok) throw new Error(`Błąd pliku ${t}`);
          return r.json();
        }));

        const results = await Promise.all(promises);
        
        // Łączenie wszystkich feature'ów w jeden obiekt GeoJSON
        const combinedGeoJSON = {
          type: "FeatureCollection",
          features: results.flatMap(geojson => geojson.features)
        };
        setData(combinedGeoJSON);
      } else {
        // Standardowe pobieranie pojedynczej warstwy
        const result = await fetch(`/data/${type}.json`);
        if (!result.ok) throw new Error("Nie znaleziono pliku");
        const geojson = await result.json();
        setData(geojson);
      }
    } catch (err) {
      console.error("Szczegóły błędu:", err);
      setError(`Błąd wczytywania danych: ${type === "all" ? "zbiorczych" : type}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(militaryType);
  }, [militaryType]);

  useEffect(() => {
    if (!data || !layerRef.current) return;
    const bounds = layerRef.current.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { animate: true, padding: [30, 30] });
    }
  }, [data, map]);

  return (
    <>
      {loading && (
        <div className="mil-loader">
          Pobieranie danych: {MILITARY_LABELS[militaryType]}...
        </div>
      )}

      {error && <div className="mil-error">⚠️ {error}</div>}

      <div className="mil-style-panel">
        <h4>Styl warstwy</h4>
        <label>Kolor:</label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        
        <label>Grubość: {weight}px</label>
        <input type="range" min="1" max="15" value={weight} onChange={(e) => setWeight(parseInt(e.target.value))} />
        
        <label>Przezroczystość: {Math.round(opacity * 100)}%</label>
        <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} />
      </div>

      <div className="mil-legend">
        <h4>Legenda</h4>
        <div className="mil-legend-item">
          <strong>Kategoria:</strong> {MILITARY_LABELS[militaryType]}
        </div>
        <div className="mil-legend-item">
          <strong>Liczba obiektów:</strong> {loading ? "..." : (data ? data.features.length : "0")}
        </div>
      </div>

      <div className="mil-type-selector">
        {MILITARY_TYPES.map((type) => (
          <button 
            key={type} 
            onClick={() => setMilitaryType(type)} 
            className={`mil-btn ${type === "all" ? "btn-all" : ""}`}
            style={{
              background: type === militaryType ? color : "rgba(255,255,255,0.9)",
              color: type === militaryType ? "#fff" : "#333",
              border: type === "all" ? `2px solid ${color}` : "1px solid #999"
            }}
          >
            {MILITARY_LABELS[type]}
          </button>
        ))}
      </div>

      {data && (
        <GeoJSON
          key={`${militaryType}-${color}-${weight}-${opacity}`}
          data={data}
          ref={layerRef}
          style={() => ({
            color: color,
            weight: weight,
            opacity: opacity,
            fillColor: color,
            fillOpacity: opacity * 0.3,
          })}
          onEachFeature={(feature, layer) => {
            const name = feature.properties?.name || "Obiekt bez nazwy";
            const milTag = feature.properties?.military || "wojskowy";
            layer.bindPopup(`<b>${name}</b><br/>Typ: ${milTag}`);
          }}
        />
      )}
    </>
  );
}