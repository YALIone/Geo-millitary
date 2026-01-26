import { MapContainer, TileLayer } from "react-leaflet";
import MilitaryOSMLayer from "./MilitaryLayer";
import "leaflet/dist/leaflet.css";

export default function App() {
  const center = [52.069167, 19.480556];
  const zoom = 7;

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: "100vh", width: "100vw" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MilitaryOSMLayer />
    </MapContainer>
  );
}