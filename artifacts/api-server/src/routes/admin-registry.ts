import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  fssaiLicensesTable,
  darpanIdsTable,
  adminCodesTable,
  communitySpotlightsTable,
} from "@workspace/db";
import {
  AddFssaiLicenseBody,
  DeleteFssaiLicenseParams,
  AddDarpanIdBody,
  DeleteDarpanIdParams,
  AddAdminCodeBody,
  DeleteAdminCodeParams,
} from "@workspace/api-zod";

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

router.get("/admin/registry/fssai", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const records = await db
    .select()
    .from(fssaiLicensesTable)
    .orderBy(fssaiLicensesTable.addedAt);
  res.json(records);
});

router.post("/admin/registry/fssai", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const parsed = AddFssaiLicenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const [record] = await db
    .insert(fssaiLicensesTable)
    .values(parsed.data)
    .returning();
  res.status(201).json(record);
});

router.delete("/admin/registry/fssai/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const parsed = DeleteFssaiLicenseParams.safeParse({
    id: parseInt(req.params.id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db
    .delete(fssaiLicensesTable)
    .where(eq(fssaiLicensesTable.id, parsed.data.id));
  res.json({ message: "Deleted" });
});

router.get("/admin/registry/darpan", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const records = await db
    .select()
    .from(darpanIdsTable)
    .orderBy(darpanIdsTable.addedAt);
  res.json(records);
});

router.post("/admin/registry/darpan", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const parsed = AddDarpanIdBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const [record] = await db
    .insert(darpanIdsTable)
    .values(parsed.data)
    .returning();
  res.status(201).json(record);
});

router.delete("/admin/registry/darpan/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const parsed = DeleteDarpanIdParams.safeParse({
    id: parseInt(req.params.id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(darpanIdsTable).where(eq(darpanIdsTable.id, parsed.data.id));
  res.json({ message: "Deleted" });
});

router.get("/admin/registry/codes", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const records = await db
    .select()
    .from(adminCodesTable)
    .orderBy(adminCodesTable.createdAt);
  res.json(records);
});

router.post("/admin/registry/codes", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const parsed = AddAdminCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const [record] = await db
    .insert(adminCodesTable)
    .values(parsed.data)
    .returning();
  res.status(201).json(record);
});

router.delete("/admin/registry/codes/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const parsed = DeleteAdminCodeParams.safeParse({
    id: parseInt(req.params.id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db
    .delete(adminCodesTable)
    .where(eq(adminCodesTable.id, parsed.data.id));
  res.json({ message: "Deleted" });
});

// ── Community Spotlights ────────────────────────────────────────────────────

// GET /community/spotlights — public, used by the About page
router.get("/community/spotlights", async (_req, res) => {
  const records = await db
    .select()
    .from(communitySpotlightsTable)
    .orderBy(communitySpotlightsTable.createdAt);
  res.json(records);
});

// POST /admin/community — admin only
router.post("/admin/community", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { name, type, description, location } = req.body as Record<string, string>;
  const VALID_TYPES = new Set(["donor", "ngo", "volunteer", "supporter", "people", "partner"]);
  if (!name?.trim() || !type || !VALID_TYPES.has(type)) {
    res.status(400).json({ error: "name and a valid type are required" });
    return;
  }
  const [record] = await db
    .insert(communitySpotlightsTable)
    .values({
      name: name.trim(),
      type: type as any,
      description: description?.trim() || null,
      location: location?.trim() || null,
    })
    .returning();
  res.status(201).json(record);
});

// DELETE /admin/community/:id — admin only
router.delete("/admin/community/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(communitySpotlightsTable).where(eq(communitySpotlightsTable.id, id));
  res.json({ message: "Deleted" });
});

export default router;
