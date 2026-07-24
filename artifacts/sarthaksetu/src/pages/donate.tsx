import {
  useCreateDonation,
  getGetMyDonationsQueryKey,
  getGetDonorStatsQueryKey,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LocateFixed, MapPin } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:#f97316;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { "Accept-Language": "en" } },
    );
    const data = await res.json();
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

function ClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  address: string;
  onPick: (lat: number, lng: number, address: string) => void;
}

function LocationPicker({ lat, lng, address, onPick }: LocationPickerProps) {
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const handleMapClick = useCallback(
    async (clickLat: number, clickLng: number) => {
      setGeocoding(true);
      const addr = await reverseGeocode(clickLat, clickLng);
      setGeocoding(false);
      onPick(clickLat, clickLng, addr);
      mapRef.current?.flyTo(
        [clickLat, clickLng],
        Math.max(mapRef.current.getZoom(), 14),
        { animate: true, duration: 0.5 },
      );
    },
    [onPick],
  );

  const handleGPS = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocating(false);
        setGeocoding(true);
        const addr = await reverseGeocode(latitude, longitude);
        setGeocoding(false);
        onPick(latitude, longitude, addr);
        mapRef.current?.flyTo([latitude, longitude], 16, {
          animate: true,
          duration: 0.8,
        });
      },
      () => {
        setLocating(false);
        alert(
          "Could not get your location. Please allow location access or click on the map.",
        );
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const center: [number, number] = lat && lng ? [lat, lng] : [20.5937, 78.9629];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Pickup Location <span className="text-destructive">*</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGPS}
          disabled={locating || geocoding}
          className="gap-2 text-xs"
        >
          {locating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LocateFixed className="w-3.5 h-3.5 text-primary" />
          )}
          Use My GPS Location
        </Button>
      </div>

      <div
        className="rounded-xl overflow-hidden border border-border shadow-sm"
        style={{ height: 240 }}
      >
        <MapContainer
          center={center}
          zoom={lat && lng ? 14 : 5}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMapClick={handleMapClick} />
          {lat && lng && <Marker position={[lat, lng]} icon={pinIcon} />}
        </MapContainer>
      </div>

      {geocoding && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Looking up address…
        </p>
      )}

      {!lat && !lng && !geocoding && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Tap the map or use GPS to set your
          pickup location
        </p>
      )}

      {address && (
        <div className="flex items-start gap-2 bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
          <span>{address}</span>
        </div>
      )}
    </div>
  );
}

const donateSchema = z.object({
  foodName: z.string().min(2, "Food name is required"),
  foodType: z.enum(["veg"]),
  quantityPlates: z.coerce.number().min(1, "Must be at least 1 plate"),
  estimatedServings: z.coerce.number().optional(),
  pickupDeadline: z.string().min(1, "Pickup deadline is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export default function Donate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createDonation = useCreateDonation();

  const form = useForm<z.infer<typeof donateSchema>>({
    resolver: zodResolver(donateSchema),
    defaultValues: {
      foodName: "",
      foodType: "veg",
      quantityPlates: 10,
      description: "",
      address: "",
      lat: undefined,
      lng: undefined,
      pickupDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16),
    },
  });

  const lat = form.watch("lat") ?? null;
  const lng = form.watch("lng") ?? null;
  const address = form.watch("address") ?? "";

  const handleLocationPick = (
    pickedLat: number,
    pickedLng: number,
    pickedAddress: string,
  ) => {
    form.setValue("lat", pickedLat, { shouldDirty: true });
    form.setValue("lng", pickedLng, { shouldDirty: true });
    form.setValue("address", pickedAddress, { shouldDirty: true });
  };

  const onSubmit = (values: z.infer<typeof donateSchema>) => {
    if (!values.lat || !values.lng) {
      toast({
        variant: "destructive",
        title: "Location required",
        description: "Please pin your pickup location on the map.",
      });
      return;
    }
    const payload = {
      ...values,
      pickupDeadline: new Date(values.pickupDeadline).toISOString(),
    };
    createDonation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetMyDonationsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetDonorStatsQueryKey(),
          });
          toast({
            title: "Donation Listed",
            description: "Your food donation is now visible on the map.",
          });
          setLocation("/my-donations");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create donation. Please try again.",
          });
        },
      },
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
          List Food for Donation
        </h1>
        <p className="text-muted-foreground">
          Pin your location on the map so NGOs can find you quickly.
        </p>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="foodName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Name / Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Mixed Veg Curry and Roti"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-green-800 text-sm font-medium">
              🌿 SarthakSetu lists only <strong>vegetarian food</strong> — all
              donations are 100% veg.
            </div>

            <FormField
              control={form.control}
              name="quantityPlates"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity (Plates)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pickupDeadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Deadline</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LocationPicker
              lat={lat}
              lng={lng}
              address={address}
              onPick={handleLocationPick}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any packaging details or pickup instructions..."
                      className="resize-none h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/dashboard")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createDonation.isPending}>
                {createDonation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                List Donation
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
