import { useMemo } from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";
import { popupHtml, featureName } from "./popup";

function bindFeature(feature, layer) {
  layer.bindPopup(() => popupHtml(feature.properties), { maxWidth: 320 });
  const name = featureName(feature.properties);
  if (name) layer.bindTooltip(name, { sticky: true, direction: "top", className: "attr-tip" });
}

function CategoryLayer({ geojson, color, size, opacity }) {
  const style = useMemo(
    () => ({ color: "#fff", weight: 1, fillColor: color, fillOpacity: opacity, opacity: Math.min(1, opacity + 0.1), radius: size }),
    [color, size, opacity]
  );

  // Atrakcje są punktami (środek obiektu) – rysujemy je jako kółka na canvasie
  return <GeoJSON data={geojson} style={style} pointToLayer={(_, latlng) => L.circleMarker(latlng, style)} onEachFeature={bindFeature} />;
}

export default function AttractionLayer({ data, enabled, colors, size, opacity, selected }) {
  return (
    <>
      {Object.entries(data)
        .filter(([id]) => enabled[id])
        .map(([id, geojson]) => (
          <CategoryLayer key={id} geojson={geojson} color={colors[id]} size={size} opacity={opacity} />
        ))}
      {selected && (
        <GeoJSON
          key={selected.properties._osm + selected.properties._cat}
          data={selected}
          interactive={false}
          style={{ color: "#facc15", weight: 3, opacity: 1, fill: false }}
          pointToLayer={(_, latlng) => L.circleMarker(latlng, { radius: size + 6, color: "#facc15", weight: 3, fill: false })}
        />
      )}
    </>
  );
}
