import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import TripMapController from './TripMapController';
import StopMarker from './StopMarker';
import RoutePolyline from './RoutePolyline';

// Fix Leaflet default icon paths (known Vite/webpack issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Full interactive trip map showing all stops as numbered markers
 * connected by a routed polyline.
 *
 * Props:
 *   stops         — array of stop objects from useTrip
 *   routeGeometry — encoded polyline string (null when route unavailable)
 *   onStopClick   — optional callback called with stop object on marker click
 */
export default function TripMap({ stops = [], routeGeometry, onStopClick }) {
  const coordStops = stops.filter((s) => s.address_lat && s.address_lon);

  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={5}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <TripMapController stops={stops} />
      {routeGeometry && <RoutePolyline geometry={routeGeometry} />}
      {coordStops.map((stop, index) => (
        <StopMarker
          key={stop.id}
          stop={stop}
          number={index + 1}
          onClick={onStopClick}
        />
      ))}
    </MapContainer>
  );
}
