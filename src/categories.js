// Kategorie obiektów wojskowych (tag OSM `military=*`) – nazwa pliku = id
export const CATEGORIES = [
  { id: "airfield", label: "Lotniska wojskowe", color: "#2563eb" },
  { id: "naval_base", label: "Bazy morskie", color: "#0891b2" },
  { id: "barracks", label: "Koszary", color: "#16a34a" },
  { id: "office", label: "Biura / sztaby", color: "#7c3aed" },
  { id: "primary", label: "Obiekty główne", color: "#0f766e" },
  { id: "training_area", label: "Obszary szkoleniowe", color: "#ca8a04" },
  { id: "range", label: "Strzelnice / poligony", color: "#ea580c" },
  { id: "danger_area", label: "Strefy niebezpieczne", color: "#dc2626" },
  { id: "checkpoint", label: "Punkty kontrolne", color: "#db2777" },
  { id: "bunker", label: "Bunkry", color: "#92400e" },
  { id: "shelter", label: "Schrony", color: "#65a30d" },
  { id: "yes", label: "Inne obiekty wojskowe", color: "#64748b" },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// Tagi pokazywane w okienku obiektu
export const TAG_LABELS = {
  operator: "Operator",
  description: "Opis",
  bunker_type: "Typ bunkra",
  historic: "Historyczny",
  building: "Budynek",
  access: "Dostęp",
  icao: "ICAO",
  ele: "Wysokość",
  website: "Strona",
  wikipedia: "Wikipedia",
};
