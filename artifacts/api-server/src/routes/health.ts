import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  let database: "ok" | "error" = "ok";
  try {
    await db.execute(sql`SELECT 1`);
  } catch (err) {
    database = "error";
  }

  const data = HealthCheckResponse.parse({ status: "ok", database });
  res.status(database === "ok" ? 200 : 503).json(data);
});

export default router;
