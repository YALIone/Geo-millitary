import { useMemo, useState } from "react";
import { GeoJSON, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { popupHtml, featureName } from "./popup";

// Obiekt mniejszy niż tyle pikseli na ekranie jest rysowany jako kropka
const MIN_SHAPE_PX = 8;
const pxPerDegree = (zoom) => (256 * 2 ** zoom) / 360;

function bindFeature(feature, layer) {
  layer.bindPopup(() => popupHtml(feature.properties), { maxWidth: 320 });
  const name = featureName(feature.properties);
  if (name) layer.bindTooltip(name, { sticky: true, direction: "top", className: "mil-tip" });
}

function CategoryLayer({ id, geojson, color, weight, opacity, zoom, smallAsPoints }) {
  // Podział na kształty i kropki zależnie od rozmiaru obiektu przy obecnym zoomie
  const minSize = MIN_SHAPE_PX / pxPerDegree(zoom);
  const bucket = smallAsPoints ? zoom : "all";

  const { shapes, points } = useMemo(() => {
    if (!smallAsPoints) return { shapes: geojson, points: null };
    const big = [], small = [];
    for (const f of geojson.features) (f.properties._s >= minSize ? big : small).push(f);
    return {
      shapes: { type: "FeatureCollection", features: big },
      points: {
        type: "FeatureCollection",
        features: small.map((f) => ({
          type: "Feature",
          properties: f.properties,
          geometry: { type: "Point", coordinates: [f.properties._c[1], f.properties._c[0]] },
        })),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojson, bucket, smallAsPoints]);

  const style = useMemo(
    () => ({ color, weight, opacity, fillColor: color, fillOpacity: opacity * 0.3 }),
    [color, weight, opacity]
  );
  const pointStyle = useMemo(
    () => ({ color: "#fff", weight: 1, fillColor: color, fillOpacity: Math.max(opacity, 0.6), radius: 3 + weight / 3 }),
    [color, weight, opacity]
  );

  return (
    <>
      <GeoJSON key={`${id}-s-${bucket}`} data={shapes} style={style} onEachFeature={bindFeature} />
      {points && points.features.length > 0 && (
        <GeoJSON
          key={`${id}-p-${bucket}`}
          data={points}
          style={pointStyle}
          pointToLayer={(_, latlng) => L.circleMarker(latlng, pointStyle)}
          onEachFeature={bindFeature}
        />
      )}
    </>
  );
}

export default function MilitaryLayer({ data, enabled, colors, weight, opacity, smallAsPoints, selected }) {
  const map = useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const [zoom, setZoom] = useState(() => map.getZoom());

  return (
    <>
      {Object.entries(data)
        .filter(([id]) => enabled[id])
        .map(([id, geojson]) => (
          <CategoryLayer
            key={id}
            id={id}
            geojson={geojson}
            color={colors[id]}
            weight={weight}
            opacity={opacity}
            zoom={zoom}
            smallAsPoints={smallAsPoints}
          />
        ))}
      {selected && (
        <GeoJSON
          key={selected.properties._osm + selected.properties._cat}
          data={selected}
          interactive={false}
          style={{ color: "#facc15", weight: weight + 4, opacity: 1, fill: false }}
          pointToLayer={(_, latlng) => L.circleMarker(latlng, { radius: 10, color: "#facc15", weight: 3, fill: false })}
        />
      )}
    </>
  );
}
