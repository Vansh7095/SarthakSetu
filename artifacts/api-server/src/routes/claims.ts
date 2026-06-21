import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, desc } from "drizzle-orm";
import { db, usersTable, donationsTable, claimsTable } from "@workspace/db";
import {
  ClaimDonationParams,
  VerifyPickupParams,
  VerifyPickupBody,
  UnclaimDonationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

  const otp = generateOtp();

  const [claim] = await db
    .insert(claimsTable)
    .values({
      donationId: donation.id,
      claimedByUserId: user.id,
      otp,
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

  const [donor] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, updated.donorId))
    .limit(1);

  let claimedBy = null;
  if (updated.claimedByUserId) {
    const [claimer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, updated.claimedByUserId))
      .limit(1);
    claimedBy = claimer ?? null;
  }

  res.json({ ...updated, donor: donor ?? null, claimedBy });
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

  res.json(enriched);
});

export default router;
