import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon issue
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Custom icons for Pickup (Green) and Drop-off (Red)
const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dropIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const driverIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",
  iconSize: [35, 35],
  iconAnchor: [17, 17],
  popupAnchor: [0, -15],
});

// Helper component to auto-zoom/pan to markers with smooth animations
function AutoFitBounds({ pickup, drop, driver }) {
  const map = useMap();

  useEffect(() => {
    if (pickup && drop && pickup.lat && drop.lat) {
      const points = [[pickup.lat, pickup.lng], [drop.lat, drop.lng]];
      if (driver && driver.lat) points.push([driver.lat, driver.lng]);
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
    } else if (pickup && pickup.lat) {
      map.flyTo([pickup.lat, pickup.lng], 16, { duration: 1.5 });
    }
  }, [pickup, drop, driver, map]);

  return null;
}

function MapComponent({ pickup, drop, route, driver }) {
  const defaultPosition = [13.0827, 80.2707]; // Chennai

  return (
    <MapContainer
      center={defaultPosition}
      zoom={13}
      style={{ height: "100%", width: "100%", borderRadius: "var(--radius)" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <AutoFitBounds pickup={pickup} drop={drop} driver={driver} />

      {route && route.length > 0 && (
        <Polyline
          positions={route}
          color="#1e1e2f"
          weight={5}
          opacity={0.8}
        />
      )}

      {pickup && pickup.lat && (
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup><strong>Pickup Point</strong></Popup>
        </Marker>
      )}

      {drop && drop.lat && (
        <Marker position={[drop.lat, drop.lng]} icon={dropIcon}>
          <Popup><strong>Destination</strong></Popup>
        </Marker>
      )}

      {driver && driver.lat && (
        <Marker position={[driver.lat, driver.lng]} icon={driverIcon}>
          <Popup><strong>Cab Position</strong></Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

// Add global style for driver marker animation
const style = document.createElement('style');
style.innerHTML = `
  .leaflet-marker-icon {
    transition: all 1s linear;
  }
`;
document.head.appendChild(style);

export default MapComponent;
