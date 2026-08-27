import { Link } from "wouter";
import {
  useGetMyDonations,
  useDeleteDonation,
  getGetMyDonationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  ScanLine,
  Trash2,
  UserRound,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not provided";
}

function statusClass(status: string) {
  if (status === "available") return "bg-primary/10 text-primary";
  if (status === "claimed") return "bg-accent/25 text-foreground";
  return "bg-secondary/15 text-secondary";
}

export default function MyDonations() {
  const { data: donations, isLoading, isError, refetch } = useGetMyDonations();
  const deleteDonation = useDeleteDonation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = (id: number) => {
    deleteDonation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyDonationsQueryKey() });
          toast({ title: "Listing deleted", description: "The donation has been removed." });
        },
        onError: () => toast({ variant: "destructive", title: "Could not delete listing", description: "Please try again." }),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 animate-pulse" data-testid="state-donations-loading">
        <div className="h-12 w-72 rounded bg-muted" />
        <div className="grid gap-6 md:grid-cols-2"><div className="h-72 rounded-[2rem] bg-muted" /><div className="h-72 rounded-[2rem] bg-muted" /></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex min-h-[50dvh] max-w-lg items-center justify-center text-center" data-testid="state-donations-error">
        <div className="rounded-[2rem] border border-destructive/20 bg-card p-8">
          <AlertTriangle className="mx-auto mb-3 h-9 w-9 text-destructive" />
          <h1 className="font-serif text-3xl font-semibold">Listings are taking a moment</h1>
          <p className="mt-2 text-muted-foreground">We could not load your donation history.</p>
          <Button className="mt-6" onClick={() => refetch()} data-testid="button-retry-donations">Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl animate-handoff-in pb-10" data-testid="page-my-donations">
      <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary"><MapPin className="h-4 w-4" /> Donor desk</div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl" data-testid="text-my-donations-title">My listings</h1>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">See what is still available, what is claimed, and where you need to verify the handoff.</p>
        </div>
        <Link href="/donate" className="inline-flex"><Button data-testid="link-new-donation">New listing</Button></Link>
      </div>

      {donations && donations.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {donations.map((donation) => {
            const collectorName = donation.pickupPersonName || donation.claimedBy?.name;
            const collectorPhone = donation.pickupPersonPhone || donation.claimedBy?.phone;
            const isClaimed = donation.status === "claimed";
            const isFinished = donation.status === "picked_up" || donation.status === "completed";
            return (
              <article key={donation.id} className="flex flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm transition-transform duration-300 hover:-translate-y-1" data-testid={`card-donation-${donation.id}`}>
                <div className="border-b border-border bg-[hsl(var(--primary)/.05)] px-6 py-5 sm:px-7">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Listing #{donation.id}</p><h2 className="mt-2 font-serif text-2xl font-semibold" data-testid={`text-donation-food-${donation.id}`}>{donation.foodName}</h2></div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${statusClass(donation.status)}`} data-testid={`status-my-donation-${donation.id}`}>{donation.status.replace("_", " ")}</span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-primary">{donation.quantityPlates} plates · {donation.foodType.replace("_", " ")}</p>
                </div>

                <div className="flex flex-1 flex-col gap-5 p-6 sm:p-7">
                  <div className="grid gap-3 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Pickup by {formatDate(donation.pickupDeadline)}</p>
                    <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {donation.address || "Pickup address not listed"}</p>
                  </div>

                  {isClaimed && (
                    <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4" data-testid={`card-claimed-pickup-${donation.id}`}>
                      <div className="flex items-start gap-3"><div className="rounded-xl bg-card p-2 text-primary"><UserRound className="h-4 w-4" /></div><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Collector</p><p className="mt-1 font-semibold">{collectorName || "Claimant"}</p><p className="text-xs capitalize text-muted-foreground">{donation.pickupMode === "representative" ? "Named representative" : "Claimant collecting"}{collectorPhone ? ` · ${collectorPhone}` : ""}</p></div></div>
                      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><ShieldIcon /> Ask them to show this listing’s pickup QR before you hand over the food.</p>
                      <Link href="/scan-pickup" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90" data-testid={`link-scan-donation-${donation.id}`}><ScanLine className="h-4 w-4" /> Open pickup scanner</Link>
                    </div>
                  )}

                  {isFinished && <div className="flex items-start gap-3 rounded-2xl bg-secondary/10 p-4 text-sm text-secondary" data-testid={`state-finished-donation-${donation.id}`}><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Handoff complete</p><p className="mt-1 text-xs leading-relaxed text-secondary/80">This listing has been recorded as collected.</p></div></div>}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                    <Link href={`/donations/${donation.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" data-testid={`link-view-donation-${donation.id}`}>View listing <span aria-hidden="true">→</span></Link>
                    {donation.status === "available" && <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive" data-testid={`button-delete-donation-${donation.id}`}><Trash2 className="h-4 w-4" /> Delete</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete this listing?</AlertDialogTitle><AlertDialogDescription>This will permanently remove the donation from SarthakSetu. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel data-testid={`button-cancel-delete-${donation.id}`}>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(donation.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid={`button-confirm-delete-${donation.id}`}>{deleteDonation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete listing</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-primary/30 bg-card px-6 py-16 text-center shadow-sm" data-testid="state-donations-empty">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/20 text-primary"><Clock3 className="h-8 w-8" /></div>
          <h2 className="mt-6 font-serif text-3xl font-semibold">Nothing listed yet.</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">When surplus food is ready to move, create a listing and let the network take it from there.</p>
          <Link href="/donate" className="mt-7 inline-flex"><Button data-testid="link-empty-new-donation">Create your first listing</Button></Link>
        </div>
      )}
    </div>
  );
}

function ShieldIcon() {
  return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />;
}