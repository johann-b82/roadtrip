import { Polyline } from 'react-leaflet';
import polyline from '@mapbox/polyline';

/**
 * Decodes an OSRM-encoded polyline string and renders it as a Leaflet Polyline.
 *
 * Props:
 *   geometry — encoded polyline string from OSRM route response
 *   color    — stroke color (default: '#3b82f6')
 *   weight   — stroke weight in pixels (default: 4)
 */
export default function RoutePolyline({ geometry, color = '#3b82f6', weight = 4 }) {
  const positions = polyline.decode(geometry);
  return (
    <Polyline
      positions={positions}
      pathOptions={{ color, weight, opacity: 0.8 }}
    />
  );
}
