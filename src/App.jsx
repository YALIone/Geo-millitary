import { useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, LayersControl, ScaleControl, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import MilitaryLayer from "./MilitaryLayer";
import Sidebar from "./components/Sidebar";
import useMilitaryData from "./useMilitaryData";
import { CATEGORIES } from "./categories";
import { popupHtml } from "./popup";
import "./style.css";

const CENTER = [52.07, 19.48];
const DEFAULT_COLORS = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.color]));
const DEFAULT_STYLE = { weight: 2, opacity: 0.85 };
const STORAGE_KEY = "military-geo:settings";

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

const saved = loadSettings();

export default function App() {
  const { data, loaded, total, failed } = useMilitaryData();

  const [enabled, setEnabled] = useState(
    () => saved.enabled || Object.fromEntries(CATEGORIES.map((c) => [c.id, true]))
  );
  const [colors, setColors] = useState(() => ({ ...DEFAULT_COLORS, ...saved.colors }));
  const [weight, setWeight] = useState(saved.weight ?? DEFAULT_STYLE.weight);
  const [opacity, setOpacity] = useState(saved.opacity ?? DEFAULT_STYLE.opacity);
  const [smallAsPoints, setSmallAsPoints] = useState(saved.smallAsPoints ?? true);
  const [selected, setSelected] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 720);
  const [map, setMap] = useState(null);

  // Zapamiętanie ustawień użytkownika między wizytami
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, colors, weight, opacity, smallAsPoints }));
    } catch {
      /* tryb prywatny – ignorujemy */
    }
  }, [enabled, colors, weight, opacity, smallAsPoints]);

  // Po otwarciu/zamknięciu panelu mapa musi przeliczyć rozmiar
  useEffect(() => {
    if (!map) return;
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [sidebarOpen, map]);

  const fitVisible = useCallback(() => {
    if (!map) return;
    const bounds = L.latLngBounds([]);
    CATEGORIES.forEach(({ id }) => {
      if (enabled[id] && data[id]) bounds.extend(L.geoJSON(data[id]).getBounds());
    });
    if (bounds.isValid()) map.flyToBounds(bounds, { padding: [30, 30], duration: 0.8 });
  }, [map, data, enabled]);

  const selectFeature = useCallback(
    (feature) => {
      if (!map) return;
      setSelected(feature);
      const bounds = L.geoJSON(feature).getBounds();
      map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 16, duration: 0.8 });
      map.once("moveend", () => {
        L.popup({ maxWidth: 320 }).setLatLng(feature.properties._c).setContent(popupHtml(feature.properties)).openOn(map);
      });
    },
    [map]
  );

  // Klawisz Esc czyści zaznaczenie
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const resetStyle = () => {
    setColors(DEFAULT_COLORS);
    setWeight(DEFAULT_STYLE.weight);
    setOpacity(DEFAULT_STYLE.opacity);
    setSmallAsPoints(true);
  };

  return (
    <div className={`app ${sidebarOpen ? "sb-open" : ""}`}>
      <Sidebar
        data={data} loaded={loaded} total={total} failed={failed}
        enabled={enabled} setEnabled={setEnabled}
        colors={colors} setColors={setColors}
        weight={weight} setWeight={setWeight}
        opacity={opacity} setOpacity={setOpacity}
        smallAsPoints={smallAsPoints} setSmallAsPoints={setSmallAsPoints}
        onSelect={selectFeature} onFit={fitVisible} onResetStyle={resetStyle}
        open={sidebarOpen} setOpen={setSidebarOpen}
      />

      <main className="map-wrap">
        {!sidebarOpen && (
          <button className="sb-toggle btn" onClick={() => setSidebarOpen(true)} aria-label="Otwórz panel">
            ☰ Warstwy i wyszukiwanie
          </button>
        )}
        <MapContainer
          center={CENTER}
          zoom={6}
          minZoom={5}
          preferCanvas
          ref={setMap}
          className="map"
          zoomControl={false}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Mapa (OSM)">
              <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Jasna (CARTO)">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                maxZoom={20}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Ciemna (CARTO)">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                maxZoom={20}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satelita (Esri)">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
                attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics"
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          <ScaleControl position="bottomleft" imperial={false} />
          <ZoomControl position="bottomright" />

          <MilitaryLayer
            data={data}
            enabled={enabled}
            colors={colors}
            weight={weight}
            opacity={opacity}
            smallAsPoints={smallAsPoints}
            selected={selected}
          />
        </MapContainer>
      </main>
    </div>
  );
}

