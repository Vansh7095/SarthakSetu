import app from "./app";
import { logger } from "./lib/logger";
import { seedVerificationsIfEmpty } from "./lib/seed";
import { db, donationsTable } from "@workspace/db";
import { and, lte, eq, not } from "drizzle-orm";

const rawPort = process.env["PORT"] ?? "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(
    `Invalid PORT value: "${rawPort}". Set PORT (default 8080).`,
  );
}

seedVerificationsIfEmpty().catch((err) => {
  logger.error({ err }, "Failed to seed verification tables");
});

async function cleanupExpiredDonations() {
  try {
    const result = await db
      .delete(donationsTable)
      .where(
        and(
          lte(donationsTable.pickupDeadline, new Date()),
          not(eq(donationsTable.status, "completed")),
        ),
      )
      .returning({ id: donationsTable.id });

    if (result.length > 0) {
      logger.info({ count: result.length }, "Expired donations auto-removed");
    }
  } catch (err) {
    logger.error({ err }, "Failed to clean up expired donations");
  }
}

// Run immediately on startup, then every 5 minutes
cleanupExpiredDonations().catch((err) => logger.error({ err }, "Initial cleanup failed"));
setInterval(cleanupExpiredDonations, 5 * 60 * 1000);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
