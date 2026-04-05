import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

function createNumberedIcon(number) {
  return L.divIcon({
    className: 'stop-marker-icon',
    html: `<div style="background-color:#3b82f6;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

/**
 * Renders a numbered circular marker for a trip stop.
 *
 * Props:
 *   stop    — stop object with address_lat, address_lon, address
 *   number  — display number (1-based)
 *   onClick — optional callback called with stop when marker is clicked
 */
export default function StopMarker({ stop, number, onClick }) {
  const position = [stop.address_lat, stop.address_lon];
  const icon = createNumberedIcon(number);
  const label = stop.address ? stop.address.substring(0, 60) : `Stop ${number}`;

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{ click: () => onClick?.(stop) }}
    >
      <Popup>{label}</Popup>
    </Marker>
  );
}
