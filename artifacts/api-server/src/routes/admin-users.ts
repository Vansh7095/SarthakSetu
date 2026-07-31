import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq, asc } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

async function requireAdmin(req: any, res: any): Promise<boolean> {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

// GET /admin/users — list all registered users
router.get("/admin/users", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const users = await db
    .select()
    .from(usersTable)
    .orderBy(asc(usersTable.createdAt));
  res.json(users);
});

const VALID_ROLES = new Set(["donor", "ngo", "volunteer", "admin"]);
const VALID_DONOR_CATEGORIES = new Set([
  "restaurant",
  "hotel",
  "caterer",
  "event_org",
  "household",
]);

// PATCH /admin/users/:id — update any user's fields
router.patch("/admin/users/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      res.status(400).json({ error: "name must be a non-empty string" });
      return;
    }
    patch.name = body.name.trim();
  }
  if (body.phone !== undefined) {
    if (typeof body.phone !== "string" || !body.phone.trim()) {
      res.status(400).json({ error: "phone must be a non-empty string" });
      return;
    }
    patch.phone = body.phone.trim();
  }
  if (body.role !== undefined) {
    if (typeof body.role !== "string" || !VALID_ROLES.has(body.role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }
    patch.role = body.role;
  }
  if (body.city !== undefined) patch.city = body.city || null;
  if (body.address !== undefined) patch.address = body.address || null;
  if (body.orgName !== undefined) patch.orgName = body.orgName || null;
  if (body.operatingRadiusKm !== undefined)
    patch.operatingRadiusKm = body.operatingRadiusKm ?? null;
  if (body.donorCategory !== undefined) {
    if (
      body.donorCategory !== null &&
      (typeof body.donorCategory !== "string" ||
        !VALID_DONOR_CATEGORIES.has(body.donorCategory))
    ) {
      res.status(400).json({ error: "Invalid donorCategory" });
      return;
    }
    patch.donorCategory = body.donorCategory;
  }

  const [updated] = await db
    .update(usersTable)
    .set(patch as any)
    .where(eq(usersTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(updated);
});

// DELETE /admin/users/:id — delete user from DB and Clerk
router.delete("/admin/users/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Delete from our database first
  await db.delete(usersTable).where(eq(usersTable.id, id));

  // Delete from Clerk (best-effort — don't fail if Clerk removal fails)
  try {
    await clerkClient.users.deleteUser(user.clerkId);
  } catch (err: any) {
    // Log but don't fail — DB record is already gone
    console.error("Clerk user deletion failed:", err?.message ?? err);
  }

  res.json({ message: "User deleted" });
});

export default router;
