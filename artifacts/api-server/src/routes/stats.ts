import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, count, sum, desc } from "drizzle-orm";
import { db, usersTable, donationsTable, claimsTable } from "@workspace/db";

const router: IRouter = Router();

async function getUser(clerkId: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);
  return user ?? null;
}

router.get("/stats/donor", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getUser(clerkId);
  if (!user) {
    res.json({
      totalDonations: 0,
      totalPlates: 0,
      completedDonations: 0,
      activeDonations: 0,
      claimedDonations: 0,
      recentDonations: [],
    });
    return;
  }

  const donations = await db
    .select()
    .from(donationsTable)
    .where(eq(donationsTable.donorId, user.id));

  const totalDonations = donations.length;
  const totalPlates = donations.reduce((s, d) => s + d.quantityPlates, 0);
  const completedDonations = donations.filter(
    (d) => d.status === "completed",
  ).length;
  const activeDonations = donations.filter(
    (d) => d.status === "available",
  ).length;
  const claimedDonations = donations.filter(
    (d) => d.status === "claimed" || d.status === "picked_up",
  ).length;

  const recentDonations = donations
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const enriched = await Promise.all(
    recentDonations.map(async (d) => {
      const [donor] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, d.donorId))
        .limit(1);
      let claimedBy = null;
      if (d.claimedByUserId) {
        const [claimer] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, d.claimedByUserId))
          .limit(1);
        claimedBy = claimer ?? null;
      }
      return { ...d, donor: donor ?? null, claimedBy };
    }),
  );

  res.json({
    totalDonations,
    totalPlates,
    completedDonations,
    activeDonations,
    claimedDonations,
    recentDonations: enriched,
  });
});

router.get("/stats/ngo", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getUser(clerkId);
  if (!user) {
    res.json({
      totalClaims: 0,
      completedPickups: 0,
      totalPlatesCollected: 0,
      activeClaims: 0,
      recentClaims: [],
    });
    return;
  }

  const claims = await db
    .select()
    .from(claimsTable)
    .where(eq(claimsTable.claimedByUserId, user.id));

  const totalClaims = claims.length;
  const completedPickups = claims.filter((c) => c.otpVerified).length;
  const activeClaims = claims.filter((c) => !c.otpVerified).length;

  let totalPlatesCollected = 0;
  for (const claim of claims.filter((c) => c.otpVerified)) {
    const [donation] = await db
      .select()
      .from(donationsTable)
      .where(eq(donationsTable.id, claim.donationId))
      .limit(1);
    if (donation) {
      totalPlatesCollected += donation.quantityPlates;
    }
  }

  const recentClaims = claims
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const enrichedClaims = await Promise.all(
    recentClaims.map(async (claim) => {
      return { ...claim, claimedBy: user };
    }),
  );

  res.json({
    totalClaims,
    completedPickups,
    totalPlatesCollected,
    activeClaims,
    recentClaims: enrichedClaims,
  });
});

router.get("/stats/platform", async (_req, res) => {
  const allUsers = await db.select().from(usersTable);
  const allDonations = await db.select().from(donationsTable);

  const totalDonors = allUsers.filter((u) => u.role === "donor").length;
  const totalNgos = allUsers.filter(
    (u) => u.role === "ngo" || u.role === "volunteer",
  ).length;
  const totalDonations = allDonations.length;
  const totalPlatesSaved = allDonations
    .filter((d) => d.status === "completed")
    .reduce((s, d) => s + d.quantityPlates, 0);
  const activeDonations = allDonations.filter(
    (d) => d.status === "available",
  ).length;

  res.json({
    totalDonors,
    totalNgos,
    totalDonations,
    totalPlatesSaved,
    activeDonations,
  });
});

export default router;
