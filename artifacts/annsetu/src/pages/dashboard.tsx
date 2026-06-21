import { useGetMyProfile, useGetDonorStats, useGetNgoStats, useGetMyDonations, useListDonations } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Heart, MapPin, Clock } from "lucide-react";
import { useEffect } from "react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading, error } = useGetMyProfile({
    query: {
      retry: false
    }
  });

  useEffect(() => {
    if (error) {
      setLocation("/onboarding");
    }
  }, [error, setLocation]);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!profile) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Welcome back, {profile.name}</h1>
          <p className="text-muted-foreground capitalize">{profile.role}</p>
        </div>
        {profile.role === "donor" && (
          <Link href="/donate">
            <Button><Plus className="mr-2 h-4 w-4" /> New Donation</Button>
          </Link>
        )}
      </div>

      {profile.role === "donor" ? <DonorDashboard /> : <NgoDashboard />}
    </div>
  );
}

function DonorDashboard() {
  const { data: stats } = useGetDonorStats();
  const { data: donations } = useGetMyDonations({ status: 'available' });

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border p-6 rounded-2xl">
          <p className="text-muted-foreground text-sm font-medium">Total Donations</p>
          <p className="text-3xl font-bold text-primary mt-2">{stats?.totalDonations || 0}</p>
        </div>
        <div className="bg-card border p-6 rounded-2xl">
          <p className="text-muted-foreground text-sm font-medium">Plates Shared</p>
          <p className="text-3xl font-bold text-secondary mt-2">{stats?.totalPlates || 0}</p>
        </div>
        <div className="bg-card border p-6 rounded-2xl">
          <p className="text-muted-foreground text-sm font-medium">Active Listings</p>
          <p className="text-3xl font-bold text-accent mt-2">{stats?.activeDonations || 0}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-serif">Active Donations</h2>
          <Link href="/my-donations"><Button variant="ghost">View All</Button></Link>
        </div>
        
        {donations && donations.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {donations.slice(0, 3).map(donation => (
              <div key={donation.id} className="bg-card border rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">{donation.foodName}</h3>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">
                    {donation.quantityPlates} plates
                  </span>
                </div>
                <div className="text-sm text-muted-foreground flex flex-col gap-1">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> By {new Date(donation.pickupDeadline).toLocaleTimeString()}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {donation.address || 'Location provided'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border rounded-xl p-8 text-center flex flex-col items-center">
            <Heart className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium text-foreground">No active donations</p>
            <p className="text-muted-foreground mb-4">You don't have any available food listed right now.</p>
            <Link href="/donate"><Button>Create Listing</Button></Link>
          </div>
        )}
      </div>
    </div>
  );
}

function NgoDashboard() {
  const { data: stats } = useGetNgoStats();
  const { data: donations } = useListDonations({ status: 'available' });

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border p-6 rounded-2xl">
          <p className="text-muted-foreground text-sm font-medium">Total Claims</p>
          <p className="text-3xl font-bold text-primary mt-2">{stats?.totalClaims || 0}</p>
        </div>
        <div className="bg-card border p-6 rounded-2xl">
          <p className="text-muted-foreground text-sm font-medium">Plates Collected</p>
          <p className="text-3xl font-bold text-secondary mt-2">{stats?.totalPlatesCollected || 0}</p>
        </div>
        <div className="bg-card border p-6 rounded-2xl">
          <p className="text-muted-foreground text-sm font-medium">Active Pickups</p>
          <p className="text-3xl font-bold text-accent mt-2">{stats?.activeClaims || 0}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-serif">Available Nearby</h2>
          <Link href="/donations"><Button variant="ghost">Browse All</Button></Link>
        </div>
        
        {donations && donations.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {donations.slice(0, 3).map(donation => (
              <div key={donation.id} className="bg-card border rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">{donation.foodName}</h3>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">
                    {donation.quantityPlates} plates
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">{donation.donor?.name || 'Anonymous Donor'}</p>
                <div className="text-sm text-muted-foreground flex flex-col gap-1">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Due: {new Date(donation.pickupDeadline).toLocaleTimeString()}</span>
                  <span className="flex items-center gap-1 truncate"><MapPin className="w-4 h-4" /> {donation.address || 'Location provided'}</span>
                </div>
                <Link href={`/donations/${donation.id}`} className="mt-2">
                  <Button variant="outline" className="w-full">View Details</Button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border rounded-xl p-8 text-center flex flex-col items-center">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium text-foreground">No food available nearby</p>
            <p className="text-muted-foreground">Check back later or expand your search radius.</p>
          </div>
        )}
      </div>
    </div>
  );
}
