import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { cn } from "@/lib/utils";
import { MapPin, Navigation, Compass } from "lucide-react";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export function MapWrapper({ children, className, style }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-inner", className)} style={style}>
      {children}
    </div>
  );
}

// ─── Development Interactive Fallback Map Component ──────────────────────────
function DevFallbackMap({
  center = { lat: 12.9716, lng: 77.5946 },
  markers = [],
  route = [],
  className,
  height = 320,
  onMapClick,
}) {
  const [selectedMarker, setSelectedMarker] = useState(null);

  const handleClick = (e) => {
    if (!onMapClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    // Map relative click x,y to lat, lng offset around center
    const lat = Number((center.lat + (0.5 - y) * 0.05).toFixed(4));
    const lng = Number((center.lng + (x - 0.5) * 0.05).toFixed(4));
    onMapClick({ lat, lng });
  };

  // Helper to map lat/lng to percentage X/Y relative to center
  const getCoordsPct = (pos) => {
    if (!pos || pos.lat === undefined || pos.lng === undefined) return { x: 50, y: 50 };
    const dx = (Number(pos.lng) - center.lng) * 2000;
    const dy = (center.lat - Number(pos.lat)) * 2000;
    const x = Math.max(10, Math.min(90, 50 + dx));
    const y = Math.max(10, Math.min(90, 50 + dy));
    return { x, y };
  };

  return (
    <MapWrapper className={className} style={{ height }}>
      {/* Background SVG Grid pattern mimicking live map terrain */}
      <div className="absolute inset-0 cursor-crosshair overflow-hidden" onClick={handleClick}>
        <svg className="w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Simulated rivers / main arterial roads */}
          <path d="M 0 100 Q 150 120 300 80 T 600 200" fill="none" stroke="currentColor" strokeWidth="6" className="text-emerald-200/50 dark:text-emerald-900/30" />
          <path d="M 120 0 L 120 600 M 400 0 L 400 600" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200 dark:text-slate-800" />
          <circle cx="50%" cy="50%" r="180" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-emerald-500/20" />
        </svg>

        {/* Route polyline rendering */}
        {route.length > 1 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <polyline
              points={route.map((p) => {
                const pt = getCoordsPct(p);
                return `${pt.x}%,${pt.y}%`;
              }).join(" ")}
              fill="none"
              stroke="#059669"
              strokeWidth="4"
              strokeDasharray="6 3"
              className="animate-pulse"
            />
          </svg>
        )}

        {/* Render Markers */}
        {markers.map((m, idx) => {
          const pt = getCoordsPct(m.position);
          const isAgent = m.title?.toLowerCase().includes("agent") || m.title?.toLowerCase().includes("live");
          return (
            <div
              key={idx}
              className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125"
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMarker(m);
              }}
            >
              <div className="relative group flex flex-col items-center">
                {isAgent ? (
                  <div className="h-7 w-7 rounded-full bg-emerald-600 text-white shadow-lg flex items-center justify-center border-2 border-white ring-2 ring-emerald-400/50 animate-bounce">
                    <Navigation className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="h-7 w-7 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center border-2 border-white ring-2 ring-amber-300">
                    <MapPin className="h-4 w-4" />
                  </div>
                )}
                <span className="mt-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-900 text-white shadow whitespace-nowrap opacity-90 group-hover:opacity-100">
                  {m.title || `Point #${idx + 1}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Overlay Controls & Info Badges */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border shadow-sm flex items-center gap-1.5">
          <Compass className="h-3.5 w-3.5 text-emerald-600 animate-spin" style={{ animationDuration: "12s" }} />
          EcoXchange GPS Engine
        </span>
        <span className="px-2 py-1 text-[10px] font-mono rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200">
          Lat: {center.lat.toFixed(3)}, Lng: {center.lng.toFixed(3)}
        </span>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-3 left-3 z-30 flex items-center gap-3 text-[11px] bg-white/90 dark:bg-slate-900/90 p-2 rounded-lg border shadow-sm backdrop-blur-sm">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600 inline-block" /> Agent GPS</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" /> Pickup Point</span>
        <span className="flex items-center gap-1"><span className="h-2 w-4 bg-emerald-500 inline-block rounded" /> Route</span>
      </div>

      {/* Selected Marker Detail Modal */}
      {selectedMarker && (
        <div className="absolute bottom-3 right-3 z-30 max-w-xs bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-lg text-xs space-y-1 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center font-bold text-foreground">
            <span>{selectedMarker.title || "Location Point"}</span>
            <button onClick={() => setSelectedMarker(null)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          {selectedMarker.position && (
            <p className="text-muted-foreground font-mono text-[10px]">
              {selectedMarker.position.lat}, {selectedMarker.position.lng}
            </p>
          )}
        </div>
      )}
    </MapWrapper>
  );
}

// ─── Main Google Map Export Component ─────────────────────────────────────────
export function GoogleMap({
  center = { lat: 12.9716, lng: 77.5946 },
  zoom = 12,
  markers = [],
  route = [],
  className,
  height = 320,
  onMapClick,
  showCurrentLocation = false,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const mapsLib = useRef(null);
  const activeMarkers = useRef([]);
  const [loading, setLoading] = useState(Boolean(API_KEY));
  const [error, setError] = useState(API_KEY ? null : "Google Maps API key not configured");

  useEffect(() => {
    if (!API_KEY) return undefined;

    let cancelled = false;
    const loader = new Loader({ apiKey: API_KEY, version: "weekly" });

    Promise.all([loader.importLibrary("maps"), loader.importLibrary("marker")])
      .then(([maps, marker]) => {
        if (cancelled || !mapRef.current) return;
        mapsLib.current = { maps, marker };

        const map = new maps.Map(mapRef.current, {
          center,
          zoom,
          mapId: "ecoxchange-map",
        });
        mapInstance.current = map;

        if (onMapClick) {
          map.addListener("click", (e) => {
            onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          });
        }

        if (showCurrentLocation && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            map.setCenter(loc);
            try {
              if (marker.AdvancedMarkerElement) {
                const youMarker = new marker.AdvancedMarkerElement({ map, position: loc, title: "You" });
                activeMarkers.current.push(youMarker);
              } else {
                const youMarker = new maps.Marker({ map, position: loc, title: "You" });
                activeMarkers.current.push(youMarker);
              }
            } catch (err) {
              console.error("Failed to add 'You' marker:", err);
            }
          });
        }

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    const markerLib = mapsLib.current?.marker;
    const maps = mapsLib.current?.maps;
    if (!map) return;

    activeMarkers.current.forEach((m) => {
      try {
        if (m.setMap) m.setMap(null);
        else m.map = null;
      } catch (e) {
        console.error("Error clearing marker:", e);
      }
    });
    activeMarkers.current = [];

    try {
      markers.forEach((m) => {
        if (!m.position || m.position.lat === undefined || m.position.lng === undefined) return;
        const lat = Number(m.position.lat);
        const lng = Number(m.position.lng);
        if (isNaN(lat) || isNaN(lng)) return;

        if (markerLib && markerLib.AdvancedMarkerElement) {
          const am = new markerLib.AdvancedMarkerElement({
            map,
            position: { lat, lng },
            title: m.title,
          });
          activeMarkers.current.push(am);
        } else if (maps && maps.Marker) {
          const legacyMarker = new maps.Marker({
            map,
            position: { lat, lng },
            title: m.title,
          });
          activeMarkers.current.push(legacyMarker);
        }
      });
    } catch (e) {
      console.error("Failed to render markers on Google Map:", e);
    }
  }, [markers]);

  useEffect(() => {
    const map = mapInstance.current;
    const maps = mapsLib.current?.maps;
    if (!map || !route.length || !maps) return;

    new maps.Polyline({
      path: route,
      geodesic: true,
      strokeColor: "#2E8B57",
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map,
    });
  }, [route]);

  // Render Dev Fallback Map if API_KEY is absent or failed to load
  if (error || !API_KEY) {
    return (
      <DevFallbackMap
        center={center}
        markers={markers}
        route={route}
        className={className}
        height={height}
        onMapClick={onMapClick}
      />
    );
  }

  return (
    <MapWrapper className={className} style={{ height }}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 text-sm">
          Loading map…
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" style={{ minHeight: height }} />
    </MapWrapper>
  );
}

export function LocationPicker({ value, onChange, className, height = 280 }) {
  return (
    <GoogleMap
      center={value || { lat: 12.9716, lng: 77.5946 }}
      markers={value ? [{ position: value, title: "Selected Location" }] : []}
      onMapClick={onChange}
      className={className}
      height={height}
      showCurrentLocation
    />
  );
}

export function LiveMarkerMap({ position, className, height = 240 }) {
  return (
    <GoogleMap
      center={position || { lat: 12.9716, lng: 77.5946 }}
      zoom={15}
      markers={position ? [{ position, title: "Live GPS Position" }] : []}
      className={className}
      height={height}
    />
  );
}

export function RouteMap({ route, markers = [], className, height = 320 }) {
  const center = route[0] || markers[0]?.position || { lat: 12.9716, lng: 77.5946 };
  return <GoogleMap center={center} route={route} markers={markers} className={className} height={height} />;
}
