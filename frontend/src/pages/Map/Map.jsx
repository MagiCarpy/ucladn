import L from "leaflet";
import InfoPanel from "./InfoPanel/InfoPanel";
import RequestMarker from "@/components/RequestMarker";
import RoutePolyline from "../../components/RoutePolyline";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRoutesManager } from "../../hooks/useRoutesManager";
import { useLocation, useNavigate } from "react-router-dom";
import { RiArrowDownSLine, RiFocus3Line } from "@remixicon/react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../../context/SocketContext";
import { createClusterCustomIcon } from "../../constants/clusterIcon.js";
import { MapContainer, TileLayer, useMap, ScaleControl, ZoomControl } from "react-leaflet";
import {
  pickupIcon,
  acceptedIcon,
  completedIcon,
} from "../../constants/mapIcons";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

function MapScreen() {
  const socket = useSocket();
  const { authFetch } = useAuth();
  const routesManager = useRoutesManager();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedRoute = location.state;

  const mapRef = useRef(null);
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(selectedRoute || null);
  const [loading, setLoading] = useState(true);
  const [legendOpen, setLegendOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // refresh map requests data
  const refreshData = async () => {
    const resp = await authFetch("/api/requests");
    const data = await resp.json();
    const list = data.requests || [];
    setRequests(list);

    // Update selected request if new data
    if (selected) {
      const updated = list.find((req) => req.id === selected.id);
      if (updated) {
        setSelected(updated);
        navigate(".", { state: updated, replace: true });
      } else {
        // Clear if deleted
        setSelected(null);
        navigate(".", { state: null, replace: true });
      }
    }
  };

  //
  // EFFECT 1 - Refresh map when change in any request
  //
  useEffect(() => {
    const init = async () => {
      try {
        await refreshData();
      } finally {
        setLoading(false);
      }
    };
    init();

    if (!socket) return;

    const handleCreated = (newReq) => {
      setRequests((prev) => [newReq, ...prev]);
    };

    const handleUpdated = (updatedReq) => {
      setRequests((prev) =>
        prev.map((req) => (req.id === updatedReq.id ? updatedReq : req))
      );

      setSelected((prevSelected) => {
        if (prevSelected && prevSelected.id === updatedReq.id) {
          return updatedReq;
        }
        return prevSelected;
      });
    };

    const handleDeleted = ({ id }) => {
      setRequests((prev) =>
        prev.filter((req) => {
          return req.id !== id;
        })
      );

      // If the deleted request is the one currently selected, deselect it.
      setSelected((prevSelected) => {
        if (prevSelected && prevSelected.id === id) {
          navigate(".", { state: null, replace: true });
          return null;
        }
        return prevSelected;
      });
    };

    socket.on("request:created", handleCreated);
    socket.on("request:updated", handleUpdated);
    socket.on("request:deleted", handleDeleted);

    return () => {
      socket.off("request:created", handleCreated);
      socket.off("request:updated", handleUpdated);
      socket.off("request:deleted", handleDeleted);
    };
  }, [socket]);

  // EFFECT 2 — LOAD ONLY THE SELECTED ROUTE WHEN SELECTED CHANGES
  useEffect(() => {
    const loadSelectedRoute = async () => {
      if (!selected) return;

      const req = requests.find((req) => req.id === selected.id);
      if (!req || !req.pickupLat) return;

      const existing = routesManager.routes.find(
        (request) => request.id === req.id
      );

      // If route exists AND has polyline → just select it (no redraw)
      if (existing && existing.polyline) {
        if (existing.selected) return;

        routesManager.selectRoute(req.id);
        return;
      }

      // Otherwise fetch directions
      const resp = await authFetch(
        `/api/directions?from=${req.pickupLat},${req.pickupLng}&to=${req.dropoffLat},${req.dropoffLng}`
      );
      const data = await resp.json();

      routesManager.addRoute(req, data.polyline, {
        distance: data.distance,
        duration: data.duration,
      });

      const updated = routesManager.routes.find(
        (request) => request.id === req.id
      );
      if (updated?.selected) return;

      routesManager.selectRoute(req.id);
    };

    loadSelectedRoute();
  }, [selected, requests]);

  // EFFECT 3 - reset bounds if route unselected
  useEffect(() => {
    if (!selected) resetBounds();
  }, [selected]);
  //
  // MARKER CLICK HANDLER
  //
  // Keep selected route in state, unless cancelled in info panel or deselected.
  async function handleMarkerClick(req) {
    if (selected?.id === req.id) {
      setSelected(null);
      navigate(".", { state: null, replace: true });
      return;
    }
    setSelected(req);
    navigate(".", { state: req, replace: true });
  }

  const resetBounds = async () => {
    if (!mapRef.current || requests.length === 0) return;

    const bounds = getAllBounds(requests);
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    // unselect route
    setSelected(null);
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* MAP AREA */}
      <div className="absolute inset-0 z-0">
        {/* Top button (Show Routes) */}
        <div className="absolute z-[1000] top-6 left-6 pointer-events-none">
          <div
            onClick={() => resetBounds()}
            className="pointer-events-auto relative cursor-pointer active:scale-90 transition-transform duration-75 text-black dark:text-white drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] hover:opacity-70"
            aria-label="Center map on requests"
          >
            <RiFocus3Line size={32} />
          </div>
        </div>

        {/* MAP */}
        <MapCore
          requests={requests}
          selected={selected}
          routesManager={routesManager}
          loading={loading}
          handleMarkerClick={handleMarkerClick}
          mapRef={mapRef}
          isMinimized={isMinimized}
        />

        {/* LEGEND */}
        <div 
          className={`absolute right-6 md:right-10 z-[1000] pointer-events-none transition-all duration-300 ${
            !selected || !isMinimized
              ? "bottom-6 md:bottom-10" 
              : "bottom-20 md:bottom-10" 
          }`}
        >
          <div className="space-y-1.5 font-medium drop-shadow-md">
            <LegendItem color="#377dff" label="Pickup" />
            <LegendItem color="#ff4d4d" label="Dropoff" />
            <LegendItem color="#f0c419" label="Accepted" />
            <LegendItem color="#3ccf4e" label="Completed" />
          </div>
        </div>
      </div>

      {/* RIGHT: INFO PANEL */}
      <InfoPanel
        request={selected}
        clearSelection={() => {
          setSelected(null);
          navigate(".", { state: null, replace: true });
        }}
        currentUserHasActiveDelivery={requests.some(
          (req) =>
            req.helperId === routesManager.currentUserId &&
            req.status === "accepted"
        )}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
      />
    </div>
  );
}

//
// MapCore: handles markers, polylines, and map behaviors
//
function MapCore({
  requests,
  selected,
  routesManager,
  handleMarkerClick,
  loading,
  mapRef,
  isMinimized,
}) {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <MapContainer
      center={[34.0699, -118.4465]}
      zoom={15}
      zoomSnap={0.5}
      zoomDelta={0.5}
      zoomControl={false}
      className="map-container h-full w-full"
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ScaleControl position="bottomleft" />
      <ZoomControl position={isDesktop ? "bottomleft" : "topright"} />

      <MapBehavior
        routes={routesManager.routes}
        requests={requests}
        selected={selected}
        loading={loading}
        isMinimized={isMinimized}
      />

      {/* Pickup markers grouped */}
      <MarkerClusterGroup
        chunkedLoading
        polygonOptions={{
          stroke: false,
          fill: false,
        }}
        spiderLegPolylineOptions={{ weight: 0, opacity: 0 }}
        showCoverageOnHover={false}
        iconCreateFunction={createClusterCustomIcon}
      >
        {/* PICKUP markers */}
        {(() => {
          const requestsToRender = selected ? [selected] : requests;

          return requestsToRender.map((req) => {
            const pickupIconToUse =
              req.status === "accepted"
                ? acceptedIcon
                : req.status === "completed"
                  ? completedIcon
                  : pickupIcon;

            return (
              <RequestMarker
                key={`$pickup-${req.id}`}
                icon={pickupIconToUse}
                request={req}
                type="pickup"
                handleMarkerClick={handleMarkerClick}
              />
            );
          });
        })()}
      </MarkerClusterGroup>

      {/* DROPOFF markers */}
      {selected && (
        <RequestMarker
          request={selected}
          type="dropoff"
          handleMarkerClick={handleMarkerClick}
        />
      )}

      {/* Polylines */}
      {routesManager.routes.map((route) => {
        const isSelected = selected && selected.id === route.id;

        if (!isSelected) return null;

        return (
          <RoutePolyline key={route.id} route={route} highlight={isSelected} />
        );
      })}
    </MapContainer>
  );
}

//
// MapBehavior: handles fitting the map to the selected route
//
function MapBehavior({ routes, requests, selected, loading, isMinimized }) {
  const map = useMap();
  const hasFittedInitial = useRef(false);

  // Effect 1: Fit to ALL requests on load (runs once)
  useEffect(() => {
    // If we are loading, or have already done the initial fit, or have no requests, or have a specific selection -> skip
    if (
      loading ||
      hasFittedInitial.current ||
      requests.length === 0 ||
      selected
    ) {
      return;
    }

    const bounds = getAllBounds(requests);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
      hasFittedInitial.current = true;
    }
  }, [loading, requests, selected, map]);

  // Effect 2: Fit to SELECTED route
  // Intentionally excludes 'requests' from dependency array to prevent re-fitting on polling updates
  useEffect(() => {
    if (!selected) return;

    const route = routes.find((r) => r.id === selected.id);
    if (!route || !route.polyline) return;

    const fitRoute = () => {
      map.invalidateSize();
      const isMobile = window.innerWidth < 768;
      
      let paddingRight = 50;
      let paddingBottom = 50;

      if (!isMinimized) {
        paddingRight = isMobile ? 50 : 450;
        paddingBottom = isMobile ? window.innerHeight * 0.45 : 50;
      }
      
      map.fitBounds(route.polyline, { 
        paddingTopLeft: [50, 50],
        paddingBottomRight: [paddingRight, paddingBottom]
      });
    };

    // Initial fit
    setTimeout(fitRoute, 100);

    // Re-fit on window resize
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fitRoute, 200);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [selected, routes, map, isMinimized]);

  return null;
}

function LegendItem({ color, label }) {
  return (
    <div className="text-xs flex items-center gap-2">
      <span
        className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-black/10 dark:border-white/10"
        style={{ backgroundColor: color }}
      />
      <span className="text-black dark:text-white font-bold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
        {label}
      </span>
    </div>
  );
}

//
// Compute global bounds
//
function getAllBounds(requests) {
  const points = [];

  requests.forEach((req) => {
    if (req.pickupLat && req.pickupLng) {
      points.push([req.pickupLat, req.pickupLng]);
    }
  });

  return L.latLngBounds(points);
}

export default MapScreen;
