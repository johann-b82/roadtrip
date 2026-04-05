import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths (known Vite/webpack issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Inner component to re-center map when position changes
function MapController({ position }) {
  const map = useMap();
  map.setView(position, 13);
  return null;
}

// Props:
//   lat: number
//   lon: number
//   address: string (shown in marker popup)
export default function MapPreview({ lat, lon, address }) {
  const position = [lat, lon];

  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-slate-200" style={{ height: '180px' }}>
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController position={position} />
        <Marker position={position}>
        </Marker>
      </MapContainer>
    </div>
  );
}
