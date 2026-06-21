import { useEffect, useState } from "react";
import { useListDonations } from "@workspace/api-client-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Loader2 } from "lucide-react";

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

export default function MapView() {
  const { data: donations, isLoading } = useListDonations({ status: "available" });
  const [mapCenter] = useState<[number, number]>([20.5937, 78.9629]); // India center
  const [mapZoom] = useState(5);

  const getMarkerColor = (donation: any) => {
    const deadline = new Date(donation.pickupDeadline).getTime();
    const now = Date.now();
    const hoursLeft = (deadline - now) / (1000 * 60 * 60);
    
    if (hoursLeft <= 2) return "#ef4444"; // Red for urgent
    
    switch(donation.donor?.donorCategory) {
      case 'household': return "#22c55e"; // Green
      case 'restaurant': return "#eab308"; // Yellow
      case 'caterer':
      case 'event_org': return "#f97316"; // Orange
      default: return "#3b82f6"; // Blue default
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Interactive Map</h1>
          <p className="text-muted-foreground">Find available food donations nearby.</p>
        </div>
        <div className="flex items-center gap-3 text-sm bg-card p-2 rounded-lg border">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Urgent</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Household</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Restaurant</div>
        </div>
      </div>

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
          {donations?.map((donation) => {
            if (!donation.lat || !donation.lng) return null;
            return (
              <Marker 
                key={donation.id} 
                position={[donation.lat, donation.lng]}
                icon={createColoredIcon(getMarkerColor(donation))}
              >
                <Popup className="rounded-xl overflow-hidden">
                  <div className="p-1 min-w-[200px]">
                    <h3 className="font-bold text-base mb-1">{donation.foodName}</h3>
                    <p className="text-primary font-medium text-sm mb-2">{donation.quantityPlates} plates</p>
                    <div className="text-xs text-muted-foreground space-y-1 mb-3">
                      <p className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due {new Date(donation.pickupDeadline).toLocaleTimeString()}</p>
                      <p className="flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5" /> <span className="line-clamp-2">{donation.address}</span></p>
                    </div>
                    <Link href={`/donations/${donation.id}`}>
                      <Button size="sm" className="w-full h-8 text-xs">View Details</Button>
                    </Link>
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
