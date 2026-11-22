import { useEffect, useState } from "react";
import { CATEGORIES } from "./categories";

// Wczytuje wszystkie warstwy równolegle; błąd jednej nie blokuje pozostałych.
export default function useAttractionData() {
  const [data, setData] = useState({});
  const [loaded, setLoaded] = useState(0);
  const [failed, setFailed] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const base = import.meta.env.BASE_URL;

    CATEGORIES.forEach(({ id }) => {
      fetch(`${base}data/${id}.json`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((geojson) => {
          if (cancelled) return;
          geojson.features.forEach((f) => (f.properties._cat = id));
          setData((d) => ({ ...d, [id]: geojson }));
        })
        .catch((err) => {
          console.error(`Nie udało się wczytać warstwy ${id}:`, err);
          if (!cancelled) setFailed((f) => [...f, id]);
        })
        .finally(() => !cancelled && setLoaded((n) => n + 1));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loaded, total: CATEGORIES.length, failed };
}
