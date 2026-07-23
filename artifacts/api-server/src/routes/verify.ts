import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  fssaiLicensesTable,
  darpanIdsTable,
  adminCodesTable,
} from "@workspace/db";
import {
  VerifyFssaiBody,
  VerifyDarpanBody,
  VerifyAdminCodeBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/verify/fssai", async (req, res) => {
  const parsed = VerifyFssaiBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "licenseNumber required" });
    return;
  }

  const [record] = await db
    .select()
    .from(fssaiLicensesTable)
    .where(
      eq(fssaiLicensesTable.licenseNumber, parsed.data.licenseNumber.trim()),
    )
    .limit(1);

  if (!record || !record.isActive) {
    res.json({ valid: false });
    return;
  }

  res.json({
    valid: true,
    businessName: record.businessName,
    city: record.city,
    state: record.state,
    category: record.category,
  });
});

router.post("/verify/darpan", async (req, res) => {
  const parsed = VerifyDarpanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "darpanId required" });
    return;
  }

  const [record] = await db
    .select()
    .from(darpanIdsTable)
    .where(eq(darpanIdsTable.darpanId, parsed.data.darpanId.trim()))
    .limit(1);

  if (!record || !record.isActive) {
    res.json({ valid: false });
    return;
  }

  res.json({
    valid: true,
    orgName: record.orgName,
    city: record.city,
    state: record.state,
  });
});

router.post("/verify/admin-code", async (req, res) => {
  const parsed = VerifyAdminCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "code required" });
    return;
  }

  const [record] = await db
    .select()
    .from(adminCodesTable)
    .where(eq(adminCodesTable.code, parsed.data.code.trim()))
    .limit(1);

  res.json({ valid: !!(record && record.isActive) });
});

export default router;
