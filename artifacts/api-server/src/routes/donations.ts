import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { db, usersTable, donationsTable } from "@workspace/db";
import {
  CreateDonationBody,
  UpdateDonationBody,
  UpdateDonationParams,
  GetDonationParams,
  DeleteDonationParams,
  ListDonationsQueryParams,
  GetMyDonationsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getDonorUser(clerkId: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);
  return user ?? null;
}

async function enrichDonation(donation: typeof donationsTable.$inferSelect) {
  const [donor] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, donation.donorId))
    .limit(1);

  let claimedBy = null;
  if (donation.claimedByUserId) {
    const [claimer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, donation.claimedByUserId))
      .limit(1);
    claimedBy = claimer ?? null;
  }

  return { ...donation, donor: donor ?? null, claimedBy };
}

router.get("/donations/my", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getDonorUser(clerkId);
  if (!user) {
    res.json([]);
    return;
  }

  const parsed = GetMyDonationsQueryParams.safeParse(req.query);
  const status = parsed.success ? parsed.data.status : undefined;

  const conditions = [eq(donationsTable.donorId, user.id)];
  if (status) {
    conditions.push(eq(donationsTable.status, status as any));
  }

  const rows = await db
    .select()
    .from(donationsTable)
    .where(and(...conditions))
    .orderBy(desc(donationsTable.createdAt));

  const enriched = await Promise.all(rows.map(enrichDonation));
  res.json(enriched);
});

router.get("/donations", async (req, res) => {
  const parsed = ListDonationsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  const conditions = [];

  if (params.status) {
    conditions.push(eq(donationsTable.status, params.status as any));
  }
  if (params.foodType) {
    conditions.push(eq(donationsTable.foodType, params.foodType as any));
  }

  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const rows = await db
    .select()
    .from(donationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(donationsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const enriched = await Promise.all(rows.map(enrichDonation));
  res.json(enriched);
});

router.post("/donations", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getDonorUser(clerkId);
  if (!user) {
    res.status(403).json({ error: "Profile not found" });
    return;
  }

  const parsed = CreateDonationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const data = parsed.data;
  const [donation] = await db
    .insert(donationsTable)
    .values({
      donorId: user.id,
      foodName: data.foodName,
      foodType: data.foodType as any,
      quantityPlates: data.quantityPlates,
      estimatedServings: data.estimatedServings,
      preparedAt: data.preparedAt ? new Date(data.preparedAt) : undefined,
      pickupDeadline: new Date(data.pickupDeadline),
      description: data.description,
      imageUrl: data.imageUrl,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      status: "available",
    })
    .returning();

  const enriched = await enrichDonation(donation);
  res.status(201).json(enriched);
});

router.get("/donations/:id", async (req, res) => {
  const parsed = GetDonationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [donation] = await db
    .select()
    .from(donationsTable)
    .where(eq(donationsTable.id, parsed.data.id))
    .limit(1);

  if (!donation) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const enriched = await enrichDonation(donation);
  res.json(enriched);
});

router.patch("/donations/:id", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const paramsParsed = UpdateDonationParams.safeParse({
    id: Number(req.params.id),
  });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const user = await getDonorUser(clerkId);
  if (!user) {
    res.status(403).json({ error: "Profile not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(donationsTable)
    .where(eq(donationsTable.id, paramsParsed.data.id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (existing.donorId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const bodyParsed = UpdateDonationBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error });
    return;
  }

  const data = bodyParsed.data;
  const [updated] = await db
    .update(donationsTable)
    .set({
      ...data,
      foodType: data.foodType as any,
      status: data.status as any,
      preparedAt: data.preparedAt ? new Date(data.preparedAt) : undefined,
      pickupDeadline: data.pickupDeadline
        ? new Date(data.pickupDeadline)
        : undefined,
      updatedAt: new Date(),
    })
    .where(eq(donationsTable.id, paramsParsed.data.id))
    .returning();

  const enriched = await enrichDonation(updated);
  res.json(enriched);
});

router.delete("/donations/:id", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = DeleteDonationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const user = await getDonorUser(clerkId);
  if (!user) {
    res.status(403).json({ error: "Profile not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(donationsTable)
    .where(eq(donationsTable.id, parsed.data.id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  // Admins can delete any donation; donors can only delete their own
  const isAdmin = user.role === "admin";
  if (!isAdmin && existing.donorId !== user.id) {
    res.status(403).json({ error: "Not authorized to delete this donation" });
    return;
  }

  await db.delete(donationsTable).where(eq(donationsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
