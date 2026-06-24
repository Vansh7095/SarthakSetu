import { useEffect, useState, useCallback } from "react";
import { useListDonations } from "@workspace/api-client-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Loader2, Navigation, LocateFixed, Route } from "lucide-react";

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const userLocationIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;background:#6366f1;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(99,102,241,0.8);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const destinationIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:#f97316;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28]
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [60, 60], animate: true, maxZoom: 16 });
    }
  }, [points, map]);
  return null;
}

function LocateButton({ onLocate }: { onLocate: (pos: [number, number]) => void }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        map.flyTo(coords, 14, { animate: true });
        onLocate(coords);
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert("Could not get your location. Please allow location access.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: "80px" }}>
      <div className="leaflet-control">
        <button
          onClick={handleLocate}
          title="My Location"
          style={{
            background: "white", border: "2px solid rgba(0,0,0,0.2)", borderRadius: "4px",
            padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center",
            gap: "4px", fontSize: "13px", fontWeight: 500, color: "#374151",
          }}
        >
          {locating
            ? <span className="inline-block w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            : <LocateFixed size={16} color="#6366f1" />}
          My Location
        </button>
      </div>
    </div>
  );
}

export default function MapView() {
  const { data: donations, isLoading } = useListDonations({ status: "available" });
  const [mapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [mapZoom] = useState(5);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [routeDest, setRouteDest] = useState<[number, number] | null>(null);

  const getMarkerColor = (donation: any) => {
    const deadline = donation.pickupDeadline ? new Date(donation.pickupDeadline).getTime() : 0;
    const now = Date.now();
    const hoursLeft = deadline ? (deadline - now) / (1000 * 60 * 60) : 999;
    if (hoursLeft <= 2) return "#ef4444";
    switch (donation.donor?.donorCategory) {
      case 'household': return "#22c55e";
      case 'restaurant': return "#eab308";
      case 'caterer': case 'event_org': return "#f97316";
      default: return "#3b82f6";
    }
  };

  const showRoute = useCallback((lat: number, lng: number) => {
    setRouteDest([lat, lng]);
  }, []);

  const clearRoute = useCallback(() => {
    setRouteDest(null);
  }, []);

  const routePoints: [number, number][] = [];
  if (userPos && routeDest) {
    routePoints.push(userPos, routeDest);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Interactive Map</h1>
          <p className="text-muted-foreground">Find available food donations nearby. Click a pin to see the route.</p>
        </div>
        <div className="flex items-center gap-3 text-sm bg-card p-2 rounded-lg border">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Urgent</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Household</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Restaurant</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> You</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Destination</div>
        </div>
      </div>

      {routeDest && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm">
          <Route className="w-4 h-4 text-blue-600" />
          <span className="text-blue-800 font-medium">Showing route to donation</span>
          <Button variant="ghost" size="sm" onClick={clearRoute} className="text-blue-700 h-6 text-xs ml-auto">
            Clear route
          </Button>
        </div>
      )}

      <div className="flex-1 rounded-2xl overflow-hidden border border-border shadow-sm relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 z-[1000] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocateButton onLocate={setUserPos} />
          {routePoints.length >= 2 && <FitBounds points={routePoints} />}

          {userPos && (
            <Marker position={userPos} icon={userLocationIcon}>
              <Popup><div className="font-medium text-indigo-600">📍 Your Location</div></Popup>
            </Marker>
          )}

          {userPos && routeDest && (
            <Polyline
              positions={routePoints}
              pathOptions={{ color: "#6366f1", weight: 4, opacity: 0.8, dashArray: "10 10" }}
            />
          )}

          {routeDest && (
            <Marker position={routeDest} icon={destinationIcon}>
              <Popup><div className="font-medium text-orange-600">📍 Destination</div></Popup>
            </Marker>
          )}

          {donations?.map((donation) => {
            if (!donation.lat || !donation.lng) return null;
            const deadlineTs = donation.pickupDeadline ? new Date(donation.pickupDeadline).getTime() : 0;
            const now = Date.now();
            const hoursLeft = deadlineTs ? (deadlineTs - now) / (1000 * 60 * 60) : 999;
            return (
              <Marker
                key={donation.id}
                position={[donation.lat, donation.lng]}
                icon={createColoredIcon(getMarkerColor(donation))}
              >
                <Popup className="rounded-xl overflow-hidden">
                  <div className="p-1 min-w-[220px]">
                    <h3 className="font-bold text-base mb-1">{donation.foodName}</h3>
                    <p className="text-primary font-medium text-sm mb-2">{donation.quantityPlates} plates · 🌿 Veg</p>
                    <div className="text-xs text-muted-foreground space-y-1 mb-3">
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {hoursLeft <= 0 ? "⚠️ Expired" : hoursLeft <= 2 ? `⚠️ ${Math.round(hoursLeft * 60)}m left` : `Due ${donation.pickupDeadline ? new Date(donation.pickupDeadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : 'N/A'}`}
                      </p>
                      <p className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 mt-0.5" />
                        <span className="line-clamp-2">{donation.address}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/donations/${donation.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full h-8 text-xs">Details</Button>
                      </Link>
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1"
                        onClick={() => showRoute(donation.lat!, donation.lng!)}
                      >
                        <Navigation className="w-3 h-3" /> Show Route
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
