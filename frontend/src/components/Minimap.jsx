import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const clickIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    },
  });
  return null;
}

export default function MinimapPicker({ value, onChange }) {
  return (
    <div className={`relative w-full h-48 rounded-md overflow-hidden mt-2 border ${
      value ? "border-blue-500" : "border-border"
    }`}>
      {/* Instruction overlay */}
      {!value && (
        <div className="absolute top-2 left-2 z-[500] bg-white/80 dark:bg-card/80 px-2 py-1 rounded text-xs shadow">
          Click the map to choose a location
        </div>
      )}

      {/* Clear selection button */}
      {value && (
        <button
          className="absolute top-2 right-2 z-[500] bg-white dark:bg-card px-2 py-1 rounded text-xs shadow border hover:bg-gray-100 dark:hover:bg-card/80"
          onClick={() => onChange(null)}
          type="button"
        >
          Clear
        </button>
      )}

      <MapContainer
        center={[34.0699, -118.4465]} // Center on UCLA
        zoom={16}
        className="h-full w-full !cursor-crosshair [&_*]:!cursor-crosshair"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <ClickHandler onPick={onChange} />

        {value && (
          <Marker position={[value.lat, value.lng]} icon={clickIcon} />
        )}
      </MapContainer>
    </div>
  );
}
