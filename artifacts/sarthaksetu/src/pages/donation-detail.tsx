import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDonation,
  useClaimDonation,
  useUnclaimDonation,
  useDeleteDonation,
  useGetMyProfile,
  getGetDonationQueryKey,
  getGetMyClaimsQueryKey,
  getListDonationsQueryKey,
} from "@workspace/api-client-react";
import type { Claim } from "@workspace/api-client-react";
import { QRCodeSVG } from "qrcode.react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  ScanLine,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";

type ClaimFormValues = {
  pickupMode: "self" | "representative";
  pickupPersonName: string;
  pickupPersonPhone: string;
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not provided";
}

function statusClass(status: string) {
  if (status === "available") return "bg-primary/10 text-primary";
  if (status === "claimed") return "bg-accent/25 text-foreground";
  return "bg-secondary/15 text-secondary";
}

export default function DonationDetail() {
  const { id } = useParams();
  const donationId = Number(id || 0);
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [claimResult, setClaimResult] = useState<Claim | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);

  const { data: donation, isLoading, error } = useGetDonation(donationId);
  const { data: myProfile } = useGetMyProfile();
  const claimDonation = useClaimDonation();
  const unclaimDonation = useUnclaimDonation();
  const deleteDonation = useDeleteDonation();
  const claimForm = useForm<ClaimFormValues>({
    defaultValues: { pickupMode: "self", pickupPersonName: "", pickupPersonPhone: "" },
  });
  const selectedPickupMode = claimForm.watch("pickupMode");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 animate-pulse" data-testid="state-donation-loading">
        <div className="h-5 w-24 rounded bg-muted" />
        <div className="h-72 rounded-[2rem] bg-muted" />
        <div className="h-40 rounded-[2rem] bg-muted" />
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="mx-auto flex min-h-[50dvh] max-w-lg items-center justify-center text-center" data-testid="state-donation-error">
        <div className="rounded-[2rem] border border-destructive/20 bg-card p-8">
          <AlertTriangle className="mx-auto mb-3 h-9 w-9 text-destructive" />
          <h1 className="font-serif text-3xl font-semibold">Donation not found</h1>
          <p className="mt-2 text-muted-foreground">This listing may have been removed or is no longer available.</p>
          <Link href="/donations" className="mt-6 inline-flex"><Button data-testid="link-donation-browse">Browse donations</Button></Link>
        </div>
      </div>
    );
  }

  const currentUserId = user?.id;
  const isDonor = donation.donor?.clerkId === currentUserId;
  const isClaimer = donation.claimedBy?.clerkId === currentUserId;
  const isAdmin = myProfile?.role === "admin";
  const canClaim =
    myProfile?.role === "ngo" ||
    myProfile?.role === "volunteer" ||
    myProfile?.roles?.includes("ngo") ||
    myProfile?.roles?.includes("volunteer");
  const activeQrToken = claimResult?.pickupQrToken;
  const pickupPersonName = claimResult?.pickupPersonName || donation.pickupPersonName || donation.claimedBy?.name;
  const pickupPersonPhone = claimResult?.pickupPersonPhone || donation.pickupPersonPhone || donation.claimedBy?.phone;
  const pickupMode = claimResult?.pickupMode || donation.pickupMode;
  const qrPayload = activeQrToken ? `sarthaksetu://pickup?donationId=${donation.id}&token=${encodeURIComponent(activeQrToken)}` : "";

  const invalidateDonation = () => {
    queryClient.invalidateQueries({ queryKey: getGetDonationQueryKey(donationId) });
    queryClient.invalidateQueries({ queryKey: getListDonationsQueryKey() });
  };

  const handleClaim = claimForm.handleSubmit((values) => {
    if (values.pickupMode === "representative" && (!values.pickupPersonName.trim() || !values.pickupPersonPhone.trim())) {
      claimForm.setError("pickupPersonName", { message: "Name and phone are required for a representative." });
      claimForm.setError("pickupPersonPhone", { message: "Name and phone are required for a representative." });
      return;
    }
    claimDonation.mutate(
      {
        id: donationId,
        data: {
          pickupMode: values.pickupMode,
          ...(values.pickupMode === "representative"
            ? { pickupPersonName: values.pickupPersonName.trim(), pickupPersonPhone: values.pickupPersonPhone.trim() }
            : {}),
        },
      },
      {
        onSuccess: (claim) => {
          setClaimResult(claim);
          setClaimOpen(false);
          queryClient.invalidateQueries({ queryKey: getGetMyClaimsQueryKey() });
          invalidateDonation();
          toast({ title: "Claim confirmed", description: "Your one-time pickup QR is ready to present at handoff." });
        },
        onError: (error) => toast({ variant: "destructive", title: "Could not claim donation", description: error instanceof Error ? error.message : "It may have just been claimed by someone else. Please try again." }),
      },
    );
  });

  const handleUnclaim = () => {
    unclaimDonation.mutate(
      { id: donationId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyClaimsQueryKey() });
          invalidateDonation();
          toast({ title: "Claim cancelled", description: "The listing is available to the network again." });
        },
        onError: () => toast({ variant: "destructive", title: "Could not cancel claim", description: "Please try again." }),
      },
    );
  };

  const handleAdminDelete = () => {
    if (!window.confirm("Delete this donation permanently? This cannot be undone.")) return;
    deleteDonation.mutate(
      { id: donationId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDonationsQueryKey() });
          toast({ title: "Donation removed", description: "The listing has been permanently deleted." });
          setLocation("/donations");
        },
        onError: () => toast({ variant: "destructive", title: "Could not remove donation", description: "Please try again." }),
      },
    );
  };

  const handleGetDirections = () => {
    if (!donation.lat || !donation.lng) {
      toast({ variant: "destructive", title: "Location unavailable", description: "This listing does not have GPS coordinates." });
      return;
    }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${donation.lat},${donation.lng}&travelmode=driving`, "_blank");
  };

  return (
    <div className="mx-auto max-w-4xl animate-handoff-in pb-12" data-testid="page-donation-detail">
      <button type="button" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" onClick={() => window.history.back()} data-testid="button-donation-back">
        <ArrowLeft className="h-4 w-4" /> Back to donations
      </button>

      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-[hsl(var(--primary)/.07)] px-6 py-7 sm:px-10 sm:py-9">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-primary">{donation.foodType.replace("_", " ")}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${statusClass(donation.status)}`} data-testid={`status-donation-${donation.id}`}>{donation.status.replace("_", " ")}</span>
              </div>
              <h1 className="max-w-2xl font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl" data-testid="text-donation-name">{donation.foodName}</h1>
              <p className="mt-3 text-muted-foreground">A donation offered by {donation.donor?.name || "a SarthakSetu donor"}.</p>
            </div>
            <div className="shrink-0 sm:text-right">
              <div className="font-serif text-5xl font-semibold text-primary" data-testid="text-donation-quantity">{donation.quantityPlates}</div>
              <div className="text-sm font-medium text-muted-foreground">plates to rescue</div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 px-6 py-7 sm:grid-cols-2 sm:px-10">
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground"><UserRound className="h-4 w-4 text-primary" /> Donor</h2>
            <p className="text-lg font-semibold" data-testid="text-donor-name">{donation.donor?.name || "Anonymous donor"}</p>
            <p className="mt-1 text-sm capitalize text-muted-foreground">{donation.donor?.donorCategory?.replace("_", " ") || "Food donor"}</p>
            {donation.status === "claimed" && (isClaimer || isDonor) && donation.donor?.phone && <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" /> {donation.donor.phone}</p>}
          </div>
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground"><Clock3 className="h-4 w-4 text-primary" /> Pickup window</h2>
            <p className="flex items-start gap-2 text-sm font-medium"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {donation.address || "Address provided after claiming"}</p>
            <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-destructive"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> By {formatDate(donation.pickupDeadline)}</p>
            {donation.lat && donation.lng && <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={handleGetDirections} data-testid="button-get-directions"><Navigation className="h-4 w-4" /> Get directions</Button>}
          </div>
        </div>

        {donation.description && <div className="mx-6 mb-7 rounded-2xl bg-muted/60 px-5 py-4 sm:mx-10"><p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Pickup notes</p><p className="text-sm leading-relaxed">{donation.description}</p></div>}

        {canClaim && donation.status === "available" && (
          <div className="mx-6 mb-8 rounded-[1.5rem] border border-primary/20 bg-primary/5 p-6 sm:mx-10" data-testid="card-claim-start">
            {!claimOpen ? (
              <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div><p className="font-serif text-2xl font-semibold">Can you carry this handoff?</p><p className="mt-1 text-sm text-muted-foreground">Choose who will collect it, then bring the one-time QR to the donor.</p></div>
                <Button size="lg" className="w-full shrink-0 sm:w-auto" onClick={() => setClaimOpen(true)} data-testid="button-open-claim">Claim this donation</Button>
              </div>
            ) : (
              <Form {...claimForm}>
                <form onSubmit={handleClaim} className="space-y-5" data-testid="form-claim-pickup">
                  <div><h2 className="font-serif text-2xl font-semibold">Who will collect the food?</h2><p className="mt-1 text-sm text-muted-foreground">The donor will see these details when verifying the handoff.</p></div>
                  <FormField control={claimForm.control} name="pickupMode" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Pickup person</FormLabel>
                      <FormControl>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-3 sm:grid-cols-2">
                          <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${field.value === "self" ? "border-primary bg-card shadow-sm" : "border-border bg-background/30"}`}>
                            <RadioGroupItem value="self" className="mt-0.5" data-testid="radio-pickup-self" />
                            <span><span className="block font-semibold">I will collect it</span><span className="mt-1 block text-xs text-muted-foreground">Present your QR at pickup.</span></span>
                          </label>
                          <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${field.value === "representative" ? "border-primary bg-card shadow-sm" : "border-border bg-background/30"}`}>
                            <RadioGroupItem value="representative" className="mt-0.5" data-testid="radio-pickup-representative" />
                            <span><span className="block font-semibold">A representative will collect</span><span className="mt-1 block text-xs text-muted-foreground">Share their name and phone with the donor.</span></span>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {selectedPickupMode === "representative" && <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={claimForm.control} name="pickupPersonName" render={({ field }) => <FormItem><FormLabel>Representative name</FormLabel><FormControl><Input placeholder="Full name" {...field} data-testid="input-pickup-person-name" /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={claimForm.control} name="pickupPersonPhone" render={({ field }) => <FormItem><FormLabel>Representative phone</FormLabel><FormControl><Input type="tel" placeholder="Phone number" {...field} data-testid="input-pickup-person-phone" /></FormControl><FormMessage /></FormItem>} />
                  </div>}
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={() => setClaimOpen(false)} data-testid="button-cancel-claim">Not now</Button><Button type="submit" disabled={claimDonation.isPending} data-testid="button-confirm-claim">{claimDonation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm claim</Button></div>
                </form>
              </Form>
            )}
          </div>
        )}

        {isClaimer && donation.status === "claimed" && (
          <div className="mx-6 mb-8 rounded-[1.5rem] border border-primary/20 bg-primary/5 p-6 sm:mx-10" data-testid="card-claim-confirmed">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="flex h-[188px] w-[188px] items-center justify-center rounded-2xl bg-card p-3 text-center shadow-sm">{activeQrToken ? <QRCodeSVG value={qrPayload} size={164} bgColor="hsl(var(--card))" fgColor="hsl(var(--foreground))" includeMargin data-testid="img-pickup-qr" /> : <p className="text-xs text-muted-foreground" data-testid="state-pickup-qr-unavailable">Your pickup pass is available in My claims.</p>}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-primary"><CheckCircle2 className="h-5 w-5" /><p className="font-semibold">Claim confirmed</p></div>
                <h2 className="mt-2 font-serif text-2xl font-semibold">Show this QR at pickup.</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">The donor scans it in SarthakSetu. This pass is one-time and should only be shown when the food is being collected.</p>
                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-xl bg-card/70 p-3"><p className="text-xs text-muted-foreground">Collector</p><p className="mt-1 font-semibold">{pickupPersonName || "Claimant"}</p><p className="text-muted-foreground">{pickupMode === "representative" ? "Representative" : "Self"}</p></div><div className="rounded-xl bg-card/70 p-3"><p className="text-xs text-muted-foreground">Contact</p><p className="mt-1 font-semibold">{pickupPersonPhone || "Your profile phone"}</p></div></div>
                <Button variant="outline" className="mt-5" onClick={handleUnclaim} disabled={unclaimDonation.isPending} data-testid="button-unclaim">{unclaimDonation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Cancel claim</Button>
              </div>
            </div>
          </div>
        )}

        {isDonor && !isClaimer && donation.status === "claimed" && (
          <div className="mx-6 mb-8 rounded-[1.5rem] border border-accent/40 bg-accent/10 p-6 sm:mx-10" data-testid="card-donor-verify">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /><p className="font-semibold">Ready for a verified handoff</p></div>
                <h2 className="mt-2 font-serif text-2xl font-semibold">Confirm the collector, then scan.</h2>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"><span className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-primary" /> {pickupPersonName || donation.claimedBy?.name || "Claimant"} <span className="text-xs uppercase">{pickupMode === "representative" ? "representative" : "self"}</span></span>{pickupPersonPhone && <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {pickupPersonPhone}</span>}</div>
              </div>
              <Link href="/scan-pickup" className="shrink-0"><Button size="lg" className="w-full gap-2 sm:w-auto" data-testid="link-scan-pickup"><ScanLine className="h-4 w-4" /> Open pickup scanner</Button></Link>
            </div>
          </div>
        )}

        {(donation.status === "completed" || donation.status === "picked_up") && (
          <div className="mx-6 mb-8 flex items-start gap-4 rounded-[1.5rem] border border-secondary/30 bg-secondary/10 p-6 sm:mx-10" data-testid="state-donation-complete">
            <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-secondary" />
            <div><h2 className="font-serif text-2xl font-semibold">Handoff complete</h2><p className="mt-1 text-sm text-muted-foreground">This food has been collected and is now moving toward the people it was listed for.</p></div>
          </div>
        )}

        {isAdmin && donation.status !== "completed" && <div className="mx-6 mb-7 flex items-center justify-between gap-4 border-t border-destructive/20 pt-6 sm:mx-10"><div><p className="text-sm font-semibold text-destructive">Admin controls</p><p className="text-xs text-muted-foreground">Permanently remove this listing.</p></div><Button variant="destructive" size="sm" onClick={handleAdminDelete} disabled={deleteDonation.isPending} className="gap-2" data-testid="button-delete-donation">{deleteDonation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Remove</Button></div>}
      </div>
    </div>
  );
}