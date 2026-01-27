import { useEffect, useState, useRef } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import "./style.css"; // Import oddzielnych styli

const MILITARY_TYPES = [
  "barracks", "naval_base", "airfield", "training_area", 
  "range", "primary", "office", "danger_area", "shelter", "bunker"
];

const MILITARY_LABELS = {
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
  const [militaryType, setMilitaryType] = useState("barracks");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [color, setColor] = useState("#ff0000");
  const [weight, setWeight] = useState(6);
  const [opacity, setOpacity] = useState(1);

  const layerRef = useRef(null);
  const map = useMap();

  const fetchData = async (type) => {
    setLoading(true);
    setData(null);
    setError(null);

    const url = `/data/${type}.json`;
    try {
      const result = await fetch(url);
      
      if (!result.ok) {
        console.error("Błąd: Nie znaleziono pliku pod adresem:", url);
        setError(`Nie znaleziono danych dla: ${MILITARY_LABELS[type]}`);
        return;
      }
      
      const geojson = await result.json();
      setData(geojson);
    } catch (err) {
      // Rozwiązanie błędu ESLint: err jest teraz używane w konsoli
      console.error("Szczegóły błędu ładowania:", err);
      setError("Wystąpił błąd podczas wczytywania lokalnego pliku JSON.");
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
      map.fitBounds(bounds, { animate: false, padding: [20, 20] });
    }
  }, [data, map]);

  return (
    <>
      {loading && (
        <div className="mil-loader">
          Wczytywanie: {MILITARY_LABELS[militaryType]}...
        </div>
      )}

      {error && (
        <div className="mil-error">
          ⚠️ {error}
        </div>
      )}

      {/* PANEL STYLU */}
      <div className="mil-style-panel">
        <h4>Styl warstwy</h4>
        <label>Kolor linii:</label>
        <input 
          type="color" 
          value={color} 
          onChange={(e) => setColor(e.target.value)} 
        />
        
        <label>Grubość: {weight}px</label>
        <input 
          type="range" 
          min="1" 
          max="15" 
          value={weight} 
          onChange={(e) => setWeight(parseInt(e.target.value))} 
        />
        
        <label>Przezroczystość: {Math.round(opacity * 100)}%</label>
        <input 
          type="range" 
          min="0.1" 
          max="1" 
          step="0.1" 
          value={opacity} 
          onChange={(e) => setOpacity(parseFloat(e.target.value))} 
        />
      </div>

      {/* LEGENDA */}
      <div className="mil-legend">
        <h4>Legenda</h4>
        <div><strong>Kategoria:</strong> {MILITARY_LABELS[militaryType]}</div>
        <div><strong>Liczba obiektów:</strong> {data ? data.features.length : 0}</div>
      </div>

      {/* WYBÓR TYPU */}
      <div className="mil-type-selector">
        {MILITARY_TYPES.map((type) => (
          <button 
            key={type} 
            onClick={() => setMilitaryType(type)} 
            className="mil-btn"
            style={{
              background: type === militaryType ? color : "rgba(255,255,255,0.9)",
              color: type === militaryType ? "#fff" : "#333",
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
            fillOpacity: opacity * 0.4,
          })}
          onEachFeature={(feature, layer) => {
            if (feature.properties && feature.properties.name) {
              layer.bindPopup(`<b>${feature.properties.name}</b>`);
            } else {
              layer.bindPopup(`<b>Obiekt wojskowy (${MILITARY_LABELS[militaryType]})</b>`);
            }
          }}
        />
      )}
    </>
  );
}