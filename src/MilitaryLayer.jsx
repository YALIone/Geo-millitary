import { useEffect, useState, useRef } from "react";
import { GeoJSON, useMap } from "react-leaflet";
// cos zmienim
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
        console.error("File not found", url);
        setError(`Brak pliku: ${type}.json`);
        return;
      }
      
      const geojson = await result.json();
      setData(geojson);
    } catch (err) {
      console.error("Błąd ładowania lokalnego pliku:", err);
      setError("Błąd wczytywania danych.");
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
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.5)", zIndex: 99999, display: "flex",
          alignItems: "center", justifyContent: "center", color: "white",
          fontSize: "24px", fontWeight: "bold"
        }}>
          Wczytywanie: {MILITARY_LABELS[militaryType]}...
        </div>
      )}

      {error && (
        <div style={{
          position: "absolute", bottom: "180px", left: "50px", zIndex: 1000,
          background: "#ffcdd2", color: "#b71c1c", padding: "10px", 
          borderRadius: "8px", border: "1px solid #b71c1c"
        }}>
          {error}
        </div>
      )}

      {/* PANEL STYLU - Prawy dolny róg */}
      <div style={{
        position: "absolute", bottom: "20px", right: "20px", zIndex: 1000,
        background: "white", padding: "15px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
        width: "250px"
      }}>
        <h4 style={{ margin: "0 0 10px 0" }}>Styl warstwy</h4>
        <label>Kolor:</label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} 
               style={{ width: "100%", height: "30px", marginBottom: "10px", display: "block" }} />
        <label>Grubość: {weight}</label>
        <input type="range" min="1" max="15" value={weight} onChange={(e) => setWeight(parseInt(e.target.value))}
               style={{ width: "100%", marginBottom: "10px", display: "block" }} />
        <label>Przezroczystość: {opacity}</label>
        <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))}
               style={{ width: "100%", display: "block" }} />
      </div>

      {/* LEGENDA - Lewa strona pod zoomem */}
      <div style={{
        position: "absolute", top: "120px", left: "50px", zIndex: 1000,
        background: "white", padding: "12px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        minWidth: "180px"
      }}>
        <h4 style={{ margin: "0 0 8px 0" }}>Legenda</h4>
        <div><strong>Typ:</strong> {MILITARY_LABELS[militaryType]}</div>
        <div><strong>Liczba obiektów:</strong> {data ? data.features.length : 0}</div>
      </div>

      {/* PRZYCISKI WYBORU - Bez białego prostokąta pod spodem */}
      <div style={{
        position: "absolute", top: "20px", left: "50px", zIndex: 999,
        padding: "10px", maxWidth: "600px"
      }}>
        {MILITARY_TYPES.map((type) => (
          <button key={type} onClick={() => setMilitaryType(type)} style={{
            margin: "3px", padding: "8px 12px", borderRadius: "6px", fontSize: "12px",
            background: type === militaryType ? color : "rgba(255,255,255,0.9)",
            color: type === militaryType ? "#fff" : "#333",
            cursor: "pointer", border: "1px solid #999",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            fontWeight: "bold"
          }}>
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
            color: color, weight: weight, opacity: opacity,
            fillColor: color, fillOpacity: opacity * 0.4
          })}
          onEachFeature={(feature, layer) => {
            if (feature.properties && feature.properties.name) {
              layer.bindPopup(`<b>${feature.properties.name}</b>`);
            }
          }}
        />
      )}
    </>
  );
}