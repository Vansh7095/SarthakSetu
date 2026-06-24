import { useGetMyDonations, useDeleteDonation, getGetMyDonationsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Edit, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MyDonations() {
  const { data: donations, isLoading } = useGetMyDonations();
  const deleteDonation = useDeleteDonation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = (id: number) => {
    deleteDonation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyDonationsQueryKey() });
          toast({ title: "Donation Deleted", description: "The listing has been removed." });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to delete listing." });
        }
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">My Listings</h1>
          <p className="text-muted-foreground">Manage your food donations.</p>
        </div>
        <Link href="/donate">
          <Button>New Listing</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : donations && donations.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donations.map(donation => (
            <div key={donation.id} className="bg-card border rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-xl">{donation.foodName}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  donation.status === 'available' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  donation.status === 'claimed' ? 'bg-accent/20 text-accent-foreground' :
                  'bg-secondary/20 text-secondary-foreground'
                }`}>
                  {donation.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="text-sm font-medium text-primary">
                {donation.quantityPlates} plates
              </div>
              
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" /> 
                Deadline: {donation.pickupDeadline ? new Date(donation.pickupDeadline).toLocaleString([], {month:'short', day:'numeric', hour: '2-digit', minute:'2-digit'}) : 'N/A'}
              </div>

              {donation.status === 'claimed' && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mt-2">
                  <p className="text-sm font-medium">Action Required</p>
                  <p className="text-xs text-muted-foreground mb-2">Claimed by volunteer. Please verify OTP upon pickup.</p>
                  <Link href={`/donations/${donation.id}`}>
                    <Button size="sm" className="w-full">Verify OTP</Button>
                  </Link>
                </div>
              )}

              {donation.status === 'completed' && (
                <div className="flex items-center gap-2 text-secondary text-sm font-medium mt-2">
                  <CheckCircle2 className="w-4 h-4" /> Successfully delivered
                </div>
              )}

              {donation.status === 'available' && (
                <div className="flex justify-end gap-2 mt-auto pt-4 border-t border-border">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this donation listing.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(donation.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete Listing
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <Link href={`/donations/${donation.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border rounded-xl p-12 text-center flex flex-col items-center">
          <p className="text-xl font-medium text-foreground">No listings yet</p>
          <p className="text-muted-foreground mt-2 max-w-md mb-6">You haven't created any food donation listings.</p>
          <Link href="/donate"><Button>Create your first listing</Button></Link>
        </div>
      )}
    </div>
  );
}
