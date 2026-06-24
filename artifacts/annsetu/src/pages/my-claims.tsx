import { useGetMyClaims } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Clock, CheckCircle2 } from "lucide-react";

export default function MyClaims() {
  const { data: claims, isLoading } = useGetMyClaims();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">My Claims</h1>
        <p className="text-muted-foreground">Track the donations you have claimed.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : claims && claims.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {claims.map(claim => {
            const donation = claim.donation;
            if (!donation) return null;
            const deadline = donation.pickupDeadline ? new Date(donation.pickupDeadline) : null;
            return (
              <div key={claim.id} className="bg-card border rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-xl">{donation.foodName}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    donation.status === 'completed' ? 'bg-secondary/20 text-secondary-foreground' : 'bg-accent/20 text-accent-foreground'
                  }`}>
                    {donation.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="text-sm font-medium text-foreground">
                  {donation.donor?.name || 'Anonymous Donor'}
                </div>
                
                <div className="text-sm text-muted-foreground flex flex-col gap-2">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Pick up by {deadline ? deadline.toLocaleString([], {month:'short', day:'numeric', hour: '2-digit', minute:'2-digit'}) : 'N/A'}</span>
                  <span className="flex items-start gap-1"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {donation.address || 'Address not provided'}</span>
                </div>

                {donation.status === 'claimed' && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-2 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Provide this OTP to the donor</p>
                    <p className="text-2xl font-mono font-bold tracking-widest text-foreground">{claim.otp}</p>
                  </div>
                )}

                {donation.status === 'completed' && (
                  <div className="flex items-center gap-2 text-secondary text-sm font-medium mt-2 p-3 bg-secondary/5 rounded-xl border border-secondary/10">
                    <CheckCircle2 className="w-5 h-5" /> Completed on {claim.completedAt ? new Date(claim.completedAt).toLocaleDateString() : 'N/A'}
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-border">
                  <Link href={`/donations/${donation.id}`}>
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border rounded-xl p-12 text-center flex flex-col items-center">
          <p className="text-xl font-medium text-foreground">No claims yet</p>
          <p className="text-muted-foreground mt-2 max-w-md mb-6">You haven't claimed any donations yet.</p>
          <Link href="/donations"><Button>Browse available food</Button></Link>
        </div>
      )}
    </div>
  );
}
