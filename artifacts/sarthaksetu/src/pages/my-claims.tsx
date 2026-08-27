import { QRCodeSVG } from "qrcode.react";
import { Link } from "wouter";
import { useGetMyClaims } from "@workspace/api-client-react";
import type { Claim } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  MapPin,
  Phone,
  QrCode,
  UserRound,
  UsersRound,
} from "lucide-react";

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not provided";
}

function statusLabel(status: string, verified?: boolean) {
  if (status === "completed") return "Completed";
  if (status === "picked_up" || verified) return "Handoff verified";
  return "Awaiting pickup";
}

export default function MyClaims() {
  const { data: claims, isLoading, isError, refetch } = useGetMyClaims();
  const visibleClaims = claims?.filter(
    (claim) => claim.donation && claim.donation.status !== "available",
  );
  const activeClaims = visibleClaims?.filter((claim) => claim.donation?.status !== "completed") || [];
  const completedClaims = visibleClaims?.filter((claim) => claim.donation?.status === "completed") || [];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 animate-pulse" data-testid="state-claims-loading">
        <div className="h-12 w-64 rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-2"><div className="h-[430px] rounded-[2rem] bg-muted" /><div className="h-[430px] rounded-[2rem] bg-muted" /></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex min-h-[50dvh] max-w-lg items-center justify-center text-center" data-testid="state-claims-error">
        <div className="rounded-[2rem] border border-destructive/20 bg-card p-8">
          <AlertTriangle className="mx-auto mb-3 h-9 w-9 text-destructive" />
          <h1 className="font-serif text-3xl font-semibold">Claims are taking a moment</h1>
          <p className="mt-2 text-muted-foreground">We could not load your pickup passes.</p>
          <Button className="mt-6" onClick={() => refetch()} data-testid="button-retry-claims">Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl animate-handoff-in pb-10" data-testid="page-my-claims">
      <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary"><QrCode className="h-4 w-4" /> Your handoff passes</div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl" data-testid="text-my-claims-title">My claims</h1>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">Keep the right QR ready. The donor scans it when the food changes hands.</p>
        </div>
        <Link href="/donations" className="inline-flex"><Button variant="outline" data-testid="link-browse-claims">Find more food</Button></Link>
      </div>

      {visibleClaims && visibleClaims.length > 0 ? (
        <div className="space-y-10">
          {activeClaims.length > 0 && <section data-testid="section-active-claims">
            <div className="mb-4 flex items-center gap-3"><h2 className="font-serif text-2xl font-semibold">Ready for pickup</h2><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{activeClaims.length}</span></div>
            <div className="grid gap-6 lg:grid-cols-2">
              {activeClaims.map((claim) => <ClaimCard key={claim.id} claim={claim} />)}
            </div>
          </section>}
          {completedClaims.length > 0 && <section data-testid="section-completed-claims">
            <div className="mb-4 flex items-center gap-3"><h2 className="font-serif text-2xl font-semibold">Completed rescues</h2><span className="rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-bold text-secondary">{completedClaims.length}</span></div>
            <div className="grid gap-6 lg:grid-cols-2">
              {completedClaims.map((claim) => <ClaimCard key={claim.id} claim={claim} />)}
            </div>
          </section>}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-primary/30 bg-card px-6 py-16 text-center shadow-sm" data-testid="state-claims-empty">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/20 text-primary"><QrCode className="h-8 w-8" /></div>
          <h2 className="mt-6 font-serif text-3xl font-semibold">Your next rescue starts nearby.</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">Claim a donation when you can meet its pickup window. Your one-time QR will appear here.</p>
          <Link href="/donations" className="mt-7 inline-flex"><Button data-testid="link-empty-claims-browse">Browse available food</Button></Link>
        </div>
      )}
    </div>
  );
}

function ClaimCard({ claim }: { claim: Claim }) {
  const donation = claim.donation;
  if (!donation) return null;
  const isCompleted = donation.status === "completed";
  const qrPayload = `sarthaksetu://pickup?donationId=${donation.id}&token=${encodeURIComponent(claim.pickupQrToken)}`;
  const collector = claim.pickupPersonName || claim.claimedBy?.name || "Claimant";

  return (
    <article className={`overflow-hidden rounded-[2rem] border bg-card shadow-sm transition-transform duration-300 hover:-translate-y-1 ${isCompleted ? "border-secondary/25" : "border-primary/20"}`} data-testid={`card-claim-${claim.id}`}>
      <div className={`border-b px-6 py-5 sm:px-7 ${isCompleted ? "border-secondary/20 bg-secondary/5" : "border-primary/15 bg-primary/5"}`}>
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Claim #{claim.id}</p><h2 className="mt-2 font-serif text-2xl font-semibold" data-testid={`text-claim-food-${claim.id}`}>{donation.foodName}</h2></div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-center text-xs font-bold ${isCompleted ? "bg-secondary/15 text-secondary" : "bg-accent/25 text-foreground"}`} data-testid={`status-claim-${claim.id}`}>{statusLabel(donation.status, claim.otpVerified)}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">From {donation.donor?.name || "a SarthakSetu donor"} · {donation.quantityPlates} plates</p>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-[180px_1fr] sm:p-7">
        <div className={`flex flex-col items-center rounded-2xl p-3 ${isCompleted ? "bg-secondary/5" : "bg-muted/60"}`} data-testid={`card-claim-qr-${claim.id}`}>
          <QRCodeSVG value={qrPayload} size={154} bgColor="hsl(var(--card))" fgColor="hsl(var(--foreground))" includeMargin data-testid={`img-claim-qr-${claim.id}`} />
          <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{isCompleted ? "Pass used" : "Show at pickup"}</p>
        </div>
        <div className="flex flex-col">
          <div className="grid gap-4 text-sm">
            <div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><UsersRound className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Collector</p><p className="mt-0.5 font-semibold" data-testid={`text-collector-${claim.id}`}>{collector}</p><p className="text-xs capitalize text-muted-foreground">{claim.pickupMode === "representative" ? "Named representative" : "Claimant collecting"}</p></div></div>
            <div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Phone className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Collector phone</p><p className="mt-0.5 font-semibold">{claim.pickupPersonPhone || claim.claimedBy?.phone || "On file"}</p></div></div>
            <div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><MapPin className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Pickup point</p><p className="mt-0.5 font-medium leading-snug">{donation.address || "Address provided by donor"}</p></div></div>
            <div className="flex items-start gap-3"><div className="rounded-xl bg-accent/25 p-2 text-primary"><CalendarClock className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Pickup by</p><p className="mt-0.5 font-semibold text-destructive">{formatDate(donation.pickupDeadline)}</p></div></div>
          </div>
          <div className="mt-auto border-t border-border pt-5">
            {isCompleted ? <p className="flex items-center gap-2 text-sm font-medium text-secondary" data-testid={`text-completed-at-${claim.id}`}><CheckCircle2 className="h-4 w-4" /> Completed {claim.completedAt ? formatDate(claim.completedAt) : "successfully"}</p> : <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Keep this QR private until you are at the donor’s pickup point.</p>}
            <Link href={`/donations/${donation.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline" data-testid={`link-claim-details-${claim.id}`}>View donation details <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </article>
  );
}