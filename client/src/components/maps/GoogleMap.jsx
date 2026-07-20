import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { cn } from "@/lib/utils";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export function MapWrapper({ children, className, style }) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg border bg-muted", className)} style={style}>
      {children}
    </div>
  );
}

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
            new marker.AdvancedMarkerElement({ map, position: loc, title: "You" });
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
    // Map initializes once; center/zoom updates handled by separate effects if needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    const markerLib = mapsLib.current?.marker;
    if (!map || !markerLib) return;

    markers.forEach((m) => {
      new markerLib.AdvancedMarkerElement({
        map,
        position: m.position,
        title: m.title,
      });
    });
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

  if (error) {
    return (
      <MapWrapper className={className} style={{ height }}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-4 text-center">
          {error}
        </div>
      </MapWrapper>
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
      markers={value ? [{ position: value, title: "Selected" }] : []}
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
      center={position}
      zoom={15}
      markers={position ? [{ position, title: "Live" }] : []}
      className={className}
      height={height}
    />
  );
}

export function RouteMap({ route, markers = [], className, height = 320 }) {
  const center = route[0] || markers[0]?.position || { lat: 12.9716, lng: 77.5946 };
  return <GoogleMap center={center} route={route} markers={markers} className={className} height={height} />;
}
