import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { useVerifyPickupQr, getGetMyDonationsQueryKey, getGetDonationQueryKey, getListDonationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ClipboardPaste,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useGetMyProfile } from "@workspace/api-client-react";

type ScanState = "idle" | "starting" | "ready" | "denied" | "verifying" | "success" | "error";

function parsePickupPayload(payload: string) {
  const value = payload.trim();
  if (!value) return null;

  if (value.startsWith("sarthaksetu://")) {
    try {
      const parsed = new URL(value);
      const donationId = Number(parsed.searchParams.get("donationId"));
      const token = parsed.searchParams.get("token") || "";
      if (!Number.isInteger(donationId) || donationId <= 0 || !token) return null;
      return { donationId, token };
    } catch {
      return null;
    }
  }

  return { donationId: 0, token: value };
}

export default function ScanPickup() {
  const { data: profile, isLoading: profileLoading } = useGetMyProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const verifyPickupQr = useVerifyPickupQr();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [manualToken, setManualToken] = useState("");
  const [manualDonationId, setManualDonationId] = useState("");
  const [verifiedDonationId, setVerifiedDonationId] = useState<number | null>(null);
  const isDonor = profile?.role === "donor" || profile?.roles?.includes("donor");

  const verifyPayload = (payload: string, fallbackDonationId = 0) => {
    const parsed = parsePickupPayload(payload);
    const donationId = parsed?.donationId || Number(fallbackDonationId);
    if (!parsed || !parsed.token || !Number.isInteger(donationId) || donationId <= 0) {
      setScanState("error");
      toast({
        variant: "destructive",
        title: "QR not recognised",
        description: "Use a SarthakSetu pickup QR, or enter its token and donation ID below.",
      });
      return;
    }

    setScanState("verifying");
    scannerRef.current?.stop();
    verifyPickupQr.mutate(
      { id: donationId, data: { token: parsed.token } },
      {
        onSuccess: () => {
          setVerifiedDonationId(donationId);
          setScanState("success");
          setManualToken("");
          setManualDonationId("");
          queryClient.invalidateQueries({ queryKey: getGetDonationQueryKey(donationId) });
          queryClient.invalidateQueries({ queryKey: getGetMyDonationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListDonationsQueryKey() });
          toast({
            title: "Handoff recorded",
            description: "The food can now be handed over with confidence.",
          });
        },
        onError: () => {
          setScanState("error");
          toast({
            variant: "destructive",
            title: "Could not verify this pickup",
            description: "This QR may be invalid, expired, or already used. Ask the claimant to show the current QR.",
          });
        },
      },
    );
  };

  useEffect(() => {
    if (!isDonor || !videoRef.current || scanState === "success") return;
    setScanState("starting");
    QrScanner.WORKER_PATH = new URL("qr-scanner/qr-scanner-worker.min.js", import.meta.url).toString();
    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        const payload = typeof result === "string" ? result : result.data;
        verifyPayload(payload);
      },
      { highlightScanRegion: true, highlightCodeOutline: true, returnDetailedScanResult: true },
    );
    scannerRef.current = scanner;
    scanner
      .start()
      .then(() => setScanState("ready"))
      .catch(() => setScanState("denied"));

    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
    // The scanner is intentionally mounted once for this donor page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDonor]);

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 animate-pulse" data-testid="state-scan-loading">
        <div className="h-5 w-28 rounded bg-muted" />
        <div className="h-12 w-72 rounded bg-muted" />
        <div className="h-[430px] rounded-[2rem] bg-muted" />
      </div>
    );
  }

  if (!isDonor) {
    return (
      <div className="mx-auto flex min-h-[55dvh] max-w-lg items-center justify-center" data-testid="state-scan-donor-only">
        <div className="rounded-[2rem] border border-primary/20 bg-card p-8 text-center shadow-sm">
          <LockKeyhole className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h1 className="font-serif text-3xl font-semibold">Donor access only</h1>
          <p className="mt-3 text-muted-foreground">Pickup verification belongs to the person handing the food over.</p>
          <Link href="/dashboard" className="mt-6 inline-flex">
            <Button data-testid="link-scan-dashboard">Return to dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (scanState === "success") {
    return (
      <div className="mx-auto max-w-2xl animate-handoff-in" data-testid="state-handoff-complete">
        <Link href="/my-donations" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" data-testid="link-scan-back">
          <ChevronLeft className="h-4 w-4" /> My listings
        </Link>
        <div className="overflow-hidden rounded-[2rem] border border-secondary/30 bg-card shadow-[0_18px_60px_hsl(var(--secondary)/.14)]">
          <div className="bg-primary px-7 py-8 text-primary-foreground sm:px-12">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
              <ShieldCheck className="h-5 w-5" /> Verified handoff
            </div>
            <h1 className="mt-5 max-w-md font-serif text-4xl leading-tight sm:text-5xl">Food is on its way to someone who needs it.</h1>
          </div>
          <div className="p-7 sm:p-12">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-secondary/15 p-3 text-secondary"><CheckCircle2 className="h-7 w-7" /></div>
              <div>
                <h2 className="text-xl font-semibold">Handoff completed</h2>
                <p className="mt-1 text-muted-foreground">Donation #{verifiedDonationId} has been marked as picked up. Thank you for closing the loop.</p>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/my-donations" className="flex-1">
                <Button className="w-full" data-testid="link-complete-listings">View my listings</Button>
              </Link>
              <Button variant="outline" className="flex-1" onClick={() => setScanState("idle")} data-testid="button-scan-another">
                <RefreshCw className="mr-2 h-4 w-4" /> Scan another
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const scannerMessage =
    scanState === "denied"
      ? "Camera access is unavailable. Use the manual token below."
      : scanState === "error"
        ? "We could not verify that code. Try again or enter the token manually."
        : scanState === "verifying"
          ? "Checking this one-time pickup pass…"
          : "Point the camera at the claimant’s QR. It is valid for one handoff only.";

  return (
    <div className="mx-auto max-w-5xl animate-handoff-in" data-testid="page-scan-pickup">
      <Link href="/my-donations" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" data-testid="link-scan-back-top">
        <ChevronLeft className="h-4 w-4" /> My listings
      </Link>
      <div className="mb-8 max-w-2xl">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
          <ScanLine className="h-4 w-4" /> Donor handoff desk
        </div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl" data-testid="text-scan-title">Verify before you hand over.</h1>
        <p className="mt-3 text-lg text-muted-foreground">Scan the claimant’s one-time QR to mark this donation complete. No OTP to read back, no guesswork.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <section className="overflow-hidden rounded-[2rem] border border-primary/20 bg-card shadow-sm" data-testid="card-camera-scanner">
          <div className="relative aspect-[4/3] min-h-[300px] overflow-hidden bg-[hsl(var(--primary)/.12)]">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline data-testid="video-pickup-camera" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-44 w-56 rounded-3xl border-2 border-accent sm:h-56 sm:w-72">
                <span className="absolute -left-1 -top-1 h-5 w-5 border-l-4 border-t-4 border-accent" />
                <span className="absolute -right-1 -top-1 h-5 w-5 border-r-4 border-t-4 border-accent" />
                <span className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-accent" />
                <span className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-accent" />
              </div>
            </div>
            {(scanState === "starting" || scanState === "verifying") && (
              <div className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--primary)/.78)] text-primary-foreground">
                <div className="text-center">
                  <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
                  <p className="font-medium">{scanState === "verifying" ? "Verifying pickup" : "Opening camera"}</p>
                </div>
              </div>
            )}
            {scanState === "denied" && (
              <div className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--primary)/.92)] px-8 text-center text-primary-foreground">
                <div>
                  <Camera className="mx-auto mb-3 h-9 w-9 text-accent" />
                  <p className="font-semibold">Camera unavailable</p>
                  <p className="mt-1 text-sm text-primary-foreground/70">Your browser did not allow camera access.</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-start gap-3 border-t border-border p-5">
            {scanState === "error" ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" /> : <Camera className="mt-0.5 h-5 w-5 shrink-0 text-primary" />}
            <p className="text-sm text-muted-foreground" data-testid="status-camera">{scannerMessage}</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8" data-testid="card-manual-fallback">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-accent/20 p-3 text-primary"><ClipboardPaste className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-semibold">Manual fallback</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">No camera? Enter the token from the claimant’s QR card.</p>
            </div>
          </div>
          <div className="mt-7 space-y-5">
            <div>
              <label htmlFor="donation-id" className="mb-2 block text-sm font-medium">Donation ID</label>
              <Input id="donation-id" inputMode="numeric" placeholder="For example, 184" value={manualDonationId} onChange={(event) => setManualDonationId(event.target.value)} data-testid="input-manual-donation-id" />
            </div>
            <div>
              <label htmlFor="pickup-token" className="mb-2 block text-sm font-medium">Pickup token</label>
              <Input id="pickup-token" placeholder="Paste the one-time token" value={manualToken} onChange={(event) => setManualToken(event.target.value)} data-testid="input-manual-pickup-token" />
            </div>
            <Button className="w-full" onClick={() => verifyPayload(manualToken, Number(manualDonationId))} disabled={scanState === "verifying" || !manualToken.trim() || !manualDonationId.trim()} data-testid="button-verify-manual">
              {scanState === "verifying" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Verify pickup
            </Button>
          </div>
          <div className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
            <div className="flex gap-2 font-medium text-foreground"><UserRound className="h-4 w-4 text-primary" /> Confirm the collector matches the name shown on their claim.</div>
            <p className="mt-2 pl-6">Only verify when the food is physically being collected.</p>
          </div>
        </section>
      </div>
    </div>
  );
}