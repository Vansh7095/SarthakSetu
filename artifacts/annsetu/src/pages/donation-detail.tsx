import {
  useGetDonation,
  useClaimDonation,
  useUnclaimDonation,
  useVerifyPickup,
  useDeleteDonation,
  useGetMyProfile,
  getGetDonationQueryKey,
  getListDonationsQueryKey,
} from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  MapPin,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Trash2,
  Navigation,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/react";

export default function DonationDetail() {
  const { id } = useParams();
  const donationId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const currentUserId = user?.id;

  const [otp, setOtp] = useState("");

  const {
    data: donation,
    isLoading,
    error,
  } = useGetDonation(
    donationId,
    !!donationId ? undefined : { query: { enabled: false } as any },
  );
  const { data: myProfile } = useGetMyProfile();
  const isAdmin = myProfile?.role === "admin";

  const claimDonation = useClaimDonation();
  const unclaimDonation = useUnclaimDonation();
  const verifyPickup = useVerifyPickup();
  const deleteDonation = useDeleteDonation();

  if (isLoading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (error || !donation)
    return (
      <div className="text-center p-12 text-destructive">
        Donation not found
      </div>
    );

  const handleClaim = () => {
    claimDonation.mutate(
      { id: donationId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetDonationQueryKey(donationId),
          });
          queryClient.invalidateQueries({
            queryKey: getListDonationsQueryKey(),
          });
          toast({
            title: "Donation Claimed",
            description:
              "You have successfully claimed this donation. Please pick it up before the deadline.",
          });
        },
        onError: () =>
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not claim donation.",
          }),
      },
    );
  };

  const handleUnclaim = () => {
    unclaimDonation.mutate(
      { id: donationId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetDonationQueryKey(donationId),
          });
          queryClient.invalidateQueries({
            queryKey: getListDonationsQueryKey(),
          });
          toast({
            title: "Claim Cancelled",
            description: "You have cancelled your claim.",
          });
        },
        onError: () =>
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not cancel claim.",
          }),
      },
    );
  };

  const handleVerify = () => {
    if (otp.length < 4) return;
    verifyPickup.mutate(
      { id: donationId, data: { otp } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetDonationQueryKey(donationId),
          });
          toast({
            title: "Pickup Verified!",
            description: "Thank you for completing this donation.",
          });
          setOtp("");
        },
        onError: () =>
          toast({
            variant: "destructive",
            title: "Verification Failed",
            description: "Invalid OTP. Please check with the NGO/volunteer.",
          }),
      },
    );
  };

  const handleAdminDelete = () => {
    if (!confirm("Delete this donation permanently? This cannot be undone."))
      return;
    deleteDonation.mutate(
      { id: donationId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListDonationsQueryKey(),
          });
          toast({
            title: "Donation Removed",
            description: "The donation has been permanently deleted.",
          });
          setLocation("/donations");
        },
        onError: () =>
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete donation.",
          }),
      },
    );
  };

  const handleGetDirections = () => {
    if (!donation.lat || !donation.lng) {
      toast({
        variant: "destructive",
        title: "No location",
        description: "This donation does not have GPS coordinates.",
      });
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${donation.lat},${donation.lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const isDonor = donation.donor?.clerkId === currentUserId;
  const isClaimer = donation.claimedBy?.clerkId === currentUserId;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12">
      <div
        className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground"
        onClick={() => window.history.back()}
      >
        &larr; Back
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                {donation.foodName}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  🌿 VEG
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    donation.status === "available"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : donation.status === "claimed"
                        ? "bg-accent/20 text-accent-foreground"
                        : "bg-secondary/20 text-secondary-foreground"
                  }`}
                >
                  {donation.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">
                {donation.quantityPlates}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Plates Available
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                <User className="w-5 h-5 text-muted-foreground" /> Donor Info
              </h3>
              <div className="space-y-2">
                <p className="font-medium text-foreground">
                  {donation.donor?.name || "Anonymous"}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {donation.donor?.donorCategory?.replace("_", " ") || "Donor"}
                </p>
                {donation.status === "claimed" && (isClaimer || isDonor) && (
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />{" "}
                    {donation.donor?.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                <Clock className="w-5 h-5 text-muted-foreground" /> Logistics
              </h3>
              <div className="space-y-2">
                <p className="text-sm flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>
                    {donation.address || "Address provided upon claim"}
                  </span>
                </p>
                <p className="text-sm flex items-center gap-2 text-destructive font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  Pickup by{" "}
                  {donation.pickupDeadline
                    ? new Date(donation.pickupDeadline).toLocaleString()
                    : "N/A"}
                </p>
                {donation.lat && donation.lng && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 mt-1"
                    onClick={handleGetDirections}
                  >
                    <Navigation className="w-4 h-4" /> Get Directions
                  </Button>
                )}
              </div>
            </div>
          </div>

          {donation.description && (
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-2 border-b pb-2">
                Instructions
              </h3>
              <p className="text-muted-foreground text-sm">
                {donation.description}
              </p>
            </div>
          )}

          {/* Action Area for NGOs/Volunteers */}
          {!isDonor && donation.status === "available" && (
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 text-center">
              <p className="mb-4 font-medium">
                Can you pick this up before the deadline?
              </p>
              <Button
                size="lg"
                className="w-full md:w-auto px-8"
                onClick={handleClaim}
                disabled={claimDonation.isPending}
              >
                {claimDonation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Claim Donation
              </Button>
            </div>
          )}

          {!isDonor && donation.status === "claimed" && isClaimer && (
            <div className="bg-accent/10 p-6 rounded-2xl border border-accent/20">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-accent mt-0.5" />
                <div>
                  <h4 className="font-bold text-lg">
                    You claimed this donation
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Please pick it up from the donor before the deadline. The
                    donor has been notified.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleUnclaim}
                disabled={unclaimDonation.isPending}
              >
                {unclaimDonation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Cancel Claim
              </Button>
            </div>
          )}

          {/* Action Area for Donors */}
          {isDonor && donation.status === "claimed" && (
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <div>
                  <h4 className="font-bold text-lg">Verify Pickup</h4>
                  <p className="text-sm text-muted-foreground">
                    Enter the OTP provided by the volunteer to complete the
                    donation.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="max-w-[200px]"
                />
                <Button
                  onClick={handleVerify}
                  disabled={verifyPickup.isPending || otp.length < 4}
                >
                  {verifyPickup.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Verify & Complete
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    Claimed by: {donation.claimedBy?.name}
                  </p>
                  <p className="text-sm font-mono font-bold bg-primary text-primary-foreground px-3 py-1 rounded-lg">
                    OTP: {donation.otp}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {donation.claimedBy?.phone}
                </p>
              </div>
            </div>
          )}

          {donation.status === "completed" && (
            <div className="bg-secondary/10 p-6 rounded-2xl border border-secondary/20 flex flex-col items-center text-center">
              <CheckCircle2 className="w-12 h-12 text-secondary mb-3" />
              <h4 className="font-bold text-xl text-secondary">
                Donation Completed
              </h4>
              <p className="text-muted-foreground">
                This food was successfully picked up and distributed.
              </p>
            </div>
          )}

          {/* Admin controls */}
          {isAdmin && donation.status !== "completed" && (
            <div className="mt-6 pt-6 border-t border-destructive/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-destructive">
                    Admin Controls
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Permanently remove this donation from the platform
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleAdminDelete}
                  disabled={deleteDonation.isPending}
                  className="gap-2"
                >
                  {deleteDonation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Remove Donation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
