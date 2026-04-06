import { useState } from 'react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const coordStops = stops.filter((s) => s.address_lat && s.address_lon);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white' // Full-screen overlay on mobile
          : 'relative h-64 md:h-full w-full' // Compact mode: 256px on mobile, full height on desktop
      }
    >
      {/* Full-screen toggle button — visible on mobile only (per D-01) */}
      <button
        onClick={() => setIsFullscreen((v) => !v)}
        className="md:hidden absolute top-2 right-2 z-[1001] bg-white rounded-lg shadow-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[44px] min-w-[44px] flex items-center gap-1"
        aria-label={isFullscreen ? 'Exit full-screen map' : 'Expand map full-screen'}
      >
        {isFullscreen ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Close</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>Map</span>
          </>
        )}
      </button>

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
    </div>
  );
}
