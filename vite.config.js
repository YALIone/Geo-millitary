import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' – względne ścieżki, więc zbudowana strona działa pod dowolnym adresem
// (GitHub Pages /Geo-millitary/, Netlify, Vercel, własny serwer).
export default defineConfig({
  plugins: [react()],
  base: './',
})
