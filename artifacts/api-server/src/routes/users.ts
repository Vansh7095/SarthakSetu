import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { UpsertMyProfileBody, SwitchActiveRoleBody } from "@workspace/api-zod";
// SwitchActiveRoleBody is generated from operationId "switchActiveRole" + "Body"

const router: IRouter = Router();

router.get("/users/me", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(user);
});

router.put("/users/me", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpsertMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const data = parsed.data;

  // Ensure roles array always includes the active role
  const roles: string[] = data.roles?.length
    ? Array.from(new Set([...data.roles, data.role]))
    : [data.role];

  const payload = { ...data, roles };

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);

  let user;
  if (existing.length === 0) {
    [user] = await db
      .insert(usersTable)
      .values({ clerkId, ...payload })
      .returning();
  } else {
    // Merge roles with any already on the record
    const existingRoles: string[] = existing[0].roles ?? [];
    const mergedRoles = Array.from(new Set([...existingRoles, ...roles]));
    [user] = await db
      .update(usersTable)
      .set({ ...payload, roles: mergedRoles })
      .where(eq(usersTable.clerkId, clerkId))
      .returning();
  }

  res.json(user);
});

router.patch("/users/me/active-role", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = SwitchActiveRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { role } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  if (!existing.roles?.includes(role)) {
    res.status(400).json({
      error: `Role "${role}" is not in your roles list. Add it from your profile first.`,
    });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ role: role as any })
    .where(eq(usersTable.clerkId, clerkId))
    .returning();

  res.json(user);
});

export default router;
