import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, usersTable, donationsTable, claimsTable } from "@workspace/db";
import {
  ClaimDonationParams,
  ClaimDonationBody,
  VerifyPickupParams,
  VerifyPickupBody,
  VerifyPickupQrParams,
  VerifyPickupQrBody,
  UnclaimDonationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generatePickupQrToken(): string {
  return randomBytes(32).toString("hex");
}

async function getUser(clerkId: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);
  return user ?? null;
}

router.post("/donations/:id/claim", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = ClaimDonationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const user = await getUser(clerkId);
  if (!user) {
    res.status(403).json({ error: "Profile not found" });
    return;
  }
  if (
    user.role !== "ngo" &&
    user.role !== "volunteer" &&
    !(user.roles ?? []).includes("ngo") &&
    !(user.roles ?? []).includes("volunteer")
  ) {
    res.status(403).json({ error: "NGO or volunteer role required" });
    return;
  }

  const [donation] = await db
    .select()
    .from(donationsTable)
    .where(eq(donationsTable.id, parsed.data.id))
    .limit(1);

  if (!donation) {
    res.status(404).json({ error: "Donation not found" });
    return;
  }

  if (donation.status !== "available") {
    res.status(400).json({ error: "Donation is not available" });
    return;
  }

  const bodyParsed = ClaimDonationBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error });
    return;
  }

  const pickupMode = bodyParsed.data.pickupMode;
  const pickupPersonName =
    pickupMode === "self"
      ? user.name
      : bodyParsed.data.pickupPersonName?.trim();
  const pickupPersonPhone =
    pickupMode === "self"
      ? user.phone
      : bodyParsed.data.pickupPersonPhone?.trim();

  if (!pickupPersonName || !pickupPersonPhone) {
    res.status(400).json({
      error:
        "Pickup person's name and phone are required when someone else collects the donation",
    });
    return;
  }

  const otp = generateOtp();

  const [claim] = await db
    .insert(claimsTable)
    .values({
      donationId: donation.id,
      claimedByUserId: user.id,
      otp,
      pickupMode,
      pickupPersonName,
      pickupPersonPhone,
      pickupQrToken: generatePickupQrToken(),
      otpVerified: false,
    })
    .returning();

  await db
    .update(donationsTable)
    .set({ status: "claimed", claimedByUserId: user.id, updatedAt: new Date() })
    .where(eq(donationsTable.id, donation.id));

  const claimedBy = user;
  res.json({ ...claim, claimedBy });
});

router.post("/donations/:id/verify", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const paramsParsed = VerifyPickupParams.safeParse({
    id: Number(req.params.id),
  });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = VerifyPickupBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error });
    return;
  }

  const [donation] = await db
    .select()
    .from(donationsTable)
    .where(eq(donationsTable.id, paramsParsed.data.id))
    .limit(1);

  if (!donation) {
    res.status(404).json({ error: "Donation not found" });
    return;
  }

  const [donor] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);

  if (!donor || donor.id !== donation.donorId) {
    res.status(403).json({ error: "Only the donor can verify pickup" });
    return;
  }

  const [claim] = await db
    .select()
    .from(claimsTable)
    .where(eq(claimsTable.donationId, donation.id))
    .orderBy(desc(claimsTable.createdAt))
    .limit(1);

  if (!claim) {
    res.status(404).json({ error: "Claim not found" });
    return;
  }

  if (claim.otp !== bodyParsed.data.otp) {
    res.status(400).json({ error: "Invalid OTP" });
    return;
  }

  await db
    .update(claimsTable)
    .set({ otpVerified: true, completedAt: new Date() })
    .where(eq(claimsTable.id, claim.id));

  const [updated] = await db
    .update(donationsTable)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(donationsTable.id, donation.id))
    .returning();

  let claimedBy = null;
  if (updated.claimedByUserId) {
    const [claimer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, updated.claimedByUserId))
      .limit(1);
    claimedBy = claimer ?? null;
  }

  res.json({ ...updated, donor, claimedBy });
});

router.post("/donations/:id/verify-qr", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const paramsParsed = VerifyPickupQrParams.safeParse({
    id: Number(req.params.id),
  });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = VerifyPickupQrBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error });
    return;
  }

  const donor = await getUser(clerkId);
  if (!donor) {
    res.status(403).json({ error: "Profile not found" });
    return;
  }

  const [donation] = await db
    .select()
    .from(donationsTable)
    .where(eq(donationsTable.id, paramsParsed.data.id))
    .limit(1);

  if (!donation) {
    res.status(404).json({ error: "Donation not found" });
    return;
  }

  if (donation.donorId !== donor.id) {
    res.status(403).json({ error: "Only the donor can verify pickup" });
    return;
  }

  if (donation.status !== "claimed") {
    res.status(400).json({ error: "This donation is no longer awaiting pickup" });
    return;
  }

  const [claim] = await db
    .select()
    .from(claimsTable)
    .where(
      and(
        eq(claimsTable.donationId, donation.id),
        eq(claimsTable.pickupQrToken, bodyParsed.data.token),
      ),
    )
    .orderBy(desc(claimsTable.createdAt))
    .limit(1);

  if (!claim) {
    res.status(400).json({ error: "Invalid pickup QR code" });
    return;
  }

  if (claim.otpVerified || claim.completedAt) {
    res.status(400).json({ error: "This pickup QR code has already been used" });
    return;
  }

  const [verifiedClaim] = await db
    .update(claimsTable)
    .set({ otpVerified: true, completedAt: new Date() })
    .where(and(eq(claimsTable.id, claim.id), eq(claimsTable.otpVerified, false)))
    .returning();

  if (!verifiedClaim) {
    res.status(400).json({ error: "This pickup QR code has already been used" });
    return;
  }

  const [updated] = await db
    .update(donationsTable)
    .set({ status: "completed", updatedAt: new Date() })
    .where(
      and(
        eq(donationsTable.id, donation.id),
        eq(donationsTable.status, "claimed"),
      ),
    )
    .returning();

  if (!updated) {
    res.status(400).json({ error: "This donation is no longer awaiting pickup" });
    return;
  }

  const [claimer] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, verifiedClaim.claimedByUserId))
    .limit(1);

  res.json({
    ...updated,
    donor,
    claimedBy: claimer ?? null,
    pickupMode: verifiedClaim.pickupMode,
    pickupPersonName: verifiedClaim.pickupPersonName,
    pickupPersonPhone: verifiedClaim.pickupPersonPhone,
    otp: null,
  });
});

router.post("/donations/:id/unclaim", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UnclaimDonationParams.safeParse({
    id: Number(req.params.id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const user = await getUser(clerkId);
  if (!user) {
    res.status(403).json({ error: "Profile not found" });
    return;
  }

  const [donation] = await db
    .select()
    .from(donationsTable)
    .where(eq(donationsTable.id, parsed.data.id))
    .limit(1);

  if (!donation || donation.claimedByUserId !== user.id) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [updated] = await db
    .update(donationsTable)
    .set({ status: "available", claimedByUserId: null, updatedAt: new Date() })
    .where(eq(donationsTable.id, donation.id))
    .returning();

  const [donor] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, updated.donorId))
    .limit(1);

  res.json({ ...updated, donor: donor ?? null, claimedBy: null });
});

router.get("/claims/my", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getUser(clerkId);
  if (!user) {
    res.json([]);
    return;
  }

  const claims = await db
    .select()
    .from(claimsTable)
    .where(eq(claimsTable.claimedByUserId, user.id))
    .orderBy(desc(claimsTable.createdAt));

  const enriched = await Promise.all(
    claims.map(async (claim) => {
      const [donation] = await db
        .select()
        .from(donationsTable)
        .where(eq(donationsTable.id, claim.donationId))
        .limit(1);
      return { ...claim, claimedBy: user, donation: donation ?? null };
    }),
  );

  // A released claim remains in the audit trail, but its old QR must not be
  // presented as an active pickup pass after the donation is available again.
  res.json(
    enriched.filter(
      (claim) => claim.donation && claim.donation.status !== "available",
    ),
  );
});

export default router;
