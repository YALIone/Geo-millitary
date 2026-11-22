# Mapa obiektów wojskowych w Polsce

Interaktywna mapa (React + Leaflet) obiektów oznaczonych w OpenStreetMap tagiem `military=*`.

## Funkcje

- 12 warstw (lotniska, koszary, bunkry, poligony…) – każda z własnym kolorem, licznikiem i przełącznikiem („tylko” pokazuje jedną warstwę)
- Wyszukiwarka po nazwie obiektu lub mieście (działa też bez polskich znaków) – kliknięcie przybliża i otwiera opis
- Okienko obiektu: nazwa, kategoria, adres, operator, opis, linki do OpenStreetMap / Google Maps / Wikipedii
- Małe obiekty (np. bunkry) wyświetlane jako punkty przy oddaleniu, jako kształty po przybliżeniu
- Podkłady: OSM, jasny, ciemny, satelitarny
- Ustawienia (warstwy, kolory, styl) zapamiętywane w przeglądarce
- Widok na telefon (panel wysuwany od dołu)

## Uruchomienie lokalne

```bash
npm install
npm run dev        # http://localhost:5173
```

## Dane

Surowe eksporty z Overpass leżą w `data/`. Skrypt `scripts/prepare-data.mjs` (uruchamiany automatycznie
przed `dev` i `build`) odchudza je do `public/data/` (5,4 MB → 1,6 MB). Aby dodać warstwę: wrzuć plik
`data/<military>.json` i dopisz kategorię w `src/categories.js`.

## Publikacja online

`npm run build` tworzy statyczną stronę w `dist/` (ścieżki względne – działa pod dowolnym adresem).

**GitHub Pages (automatycznie):** w repozytorium wejdź w *Settings → Pages → Source: GitHub Actions*.
Każdy push na `main` buduje i publikuje stronę (`.github/workflows/deploy.yml`) pod adresem
`https://<użytkownik>.github.io/Geo-millitary/`.

**Netlify / Vercel:** build command `npm run build`, katalog `dist`.
