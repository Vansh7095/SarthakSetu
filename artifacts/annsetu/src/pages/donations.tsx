import { useListDonations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Clock, Search, Filter } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Donations() {
  const [foodType, setFoodType] = useState<string>("all");

  const { data: donations, isLoading } = useListDonations({
    status: "available",
    ...(foodType !== "all" ? { foodType: foodType as any } : {}),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Available Food
          </h1>
          <p className="text-muted-foreground">
            Find and claim surplus food nearby.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={foodType} onValueChange={setFoodType}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Food Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Donations</SelectItem>
              <SelectItem value="veg">🌿 Vegetarian</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/map">
            <Button variant="outline">
              <MapPin className="mr-2 h-4 w-4" /> Map View
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : donations && donations.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donations.map((donation) => (
            <div
              key={donation.id}
              className="bg-card border rounded-2xl p-5 flex flex-col gap-4 hover-elevate transition-all"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-xl">{donation.foodName}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    donation.foodType === "veg"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : donation.foodType === "non_veg"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  }`}
                >
                  {donation.foodType.replace("_", "-").toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {donation.donor?.name?.charAt(0) || "D"}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {donation.donor?.name || "Anonymous Donor"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {donation.donor?.donorCategory?.replace("_", " ") ||
                      "Donor"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 py-2 border-y border-border">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    Quantity
                  </span>
                  <span className="font-semibold text-lg">
                    {donation.quantityPlates}{" "}
                    <span className="text-sm font-normal">plates</span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    Deadline
                  </span>
                  <span className="font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-destructive" />
                    {donation.pickupDeadline
                      ? new Date(donation.pickupDeadline).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" },
                        )
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground flex items-start gap-2 mb-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">
                  {donation.address || "Address provided upon claiming"}
                </span>
              </div>

              <Link href={`/donations/${donation.id}`} className="mt-auto">
                <Button className="w-full">View & Claim</Button>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border rounded-xl p-12 text-center flex flex-col items-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-xl font-medium text-foreground">
            No donations found
          </p>
          <p className="text-muted-foreground mt-2 max-w-md">
            There are no available food donations matching your criteria right
            now. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
