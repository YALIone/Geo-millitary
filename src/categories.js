// Kategorie atrakcji turystycznych – id = nazwa pliku w data/ (patrz scripts/fetch-data.mjs)
export const CATEGORIES = [
  { id: "castles", label: "Zamki i pałace", color: "#b91c1c" },
  { id: "museums", label: "Muzea i galerie", color: "#7c3aed" },
  { id: "monuments", label: "Pomniki i zabytki", color: "#92400e" },
  { id: "viewpoints", label: "Punkty widokowe", color: "#0891b2" },
  { id: "nature", label: "Parki i atrakcje przyrodnicze", color: "#16a34a" },
  { id: "religious", label: "Obiekty sakralne", color: "#ca8a04" },
  { id: "other", label: "Inne atrakcje", color: "#db2777" },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// Polskie nazwy rodzajów obiektów (wartości tagów OSM) pokazywane w okienku
const KIND_LABELS = {
  castle: "Zamek",
  palace: "Pałac",
  manor: "Dwór",
  museum: "Muzeum",
  gallery: "Galeria",
  church: "Kościół",
  cathedral: "Katedra",
  basilica: "Bazylika",
  monastery: "Klasztor",
  abbey: "Opactwo",
  chapel: "Kaplica",
  synagogue: "Synagoga",
  mosque: "Meczet",
  viewpoint: "Punkt widokowy",
  observation: "Wieża widokowa",
  national_park: "Park narodowy",
  nature_reserve: "Rezerwat przyrody",
  zoo: "Zoo",
  aquarium: "Akwarium",
  botanical: "Ogród botaniczny",
  park: "Park",
  waterfall: "Wodospad",
  cave_entrance: "Jaskinia",
  monument: "Pomnik",
  memorial: "Miejsce pamięci",
  ruins: "Ruiny",
  archaeological_site: "Stanowisko archeologiczne",
  city_gate: "Brama miejska",
  citywalls: "Mury miejskie",
  attraction: "Atrakcja",
  theme_park: "Park rozrywki",
};

// Rodzaj obiektu na podstawie tagów (pierwsze dopasowanie)
export function kindLabel(p) {
  const candidates = [
    p.historic, p.building, p["tower:type"], p.tourism, p.boundary,
    p["garden:type"], p.leisure, p.natural, p.amenity === "place_of_worship" ? "church" : null,
  ];
  for (const v of candidates) if (v && KIND_LABELS[v]) return KIND_LABELS[v];
  return null;
}

// Tagi pokazywane w okienku obiektu
export const TAG_LABELS = {
  description: "Opis",
  start_date: "Data powstania",
  architect: "Architekt",
  heritage: "Rejestr zabytków",
  operator: "Zarządca",
  opening_hours: "Godziny otwarcia",
  fee: "Opłata",
  ele: "Wysokość n.p.m.",
  phone: "Telefon",
  website: "Strona",
  wikipedia: "Wikipedia",
};
