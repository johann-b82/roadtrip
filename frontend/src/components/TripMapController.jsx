import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Invisible controller component that auto-zooms the map to fit all stops.
 * Must be rendered inside a MapContainer.
 *
 * Props:
 *   stops — full stops array; only those with valid coords are used for bounds
 */
export default function TripMapController({ stops }) {
  const map = useMap();

  useEffect(() => {
    const coordStops = stops.filter((s) => s.address_lat && s.address_lon);
    if (coordStops.length === 0) return;

    const bounds = L.latLngBounds(
      coordStops.map((s) => [s.address_lat, s.address_lon])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [map, stops]);

  return null;
}
