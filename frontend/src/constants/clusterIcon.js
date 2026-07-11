import L from "leaflet";
import { pickupIcon, dropoffIcon } from "./mapIcons";

export function createClusterCustomIcon(cluster) {
  const markers = cluster.getAllChildMarkers();

  // Only group pickup locations
  const pickupMarkers = markers.filter((marker) => {
    return marker.options.type === "pickup";
  });

  const count = pickupMarkers.length;
  const iconUrl = pickupIcon.options.iconUrl;
  const colorName = "Pickups";

  // Initialize html to an empty string or a default icon if count is 0
  let html = "";

  if (count > 0) {
    // groups and renders multiple pickups (not dropoffs)
    if (count === 1) {
      return L.divIcon({
        html: `<img src="${iconUrl}" class="w-10 h-10 object-contain pointer-events-none" style="width: 40px; height: 40px;" />`,
        className: "cluster-pin-single group",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
    }
    html = `
    <div class="relative">
      <img src="${iconUrl}" class="w-10 h-10 object-contain pointer-events-none" />
      <div class="absolute -top-[3px] -right-[3px] bg-blue-800 text-white rounded-full px-1.5 py-0.5 text-xs font-semibold border-2 border-white pointer-events-none">${count}</div>
      <div class="absolute bottom-[45px] left-1/2 -translate-x-1/2 bg-black/75 text-white px-2 py-1 text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">${colorName}: ${count} nearby</div>
    </div>
    `;
  } else {
    // if count === 0, cluster of dropoffs. Only group and render multiple pickups.
    html = `<img src="${dropoffIcon.options.iconUrl}" />`;
  }

  return L.divIcon({
    html,
    className: "cluster-pin group",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    tooltipAnchor: [0, -40],
  });
}
