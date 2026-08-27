import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { donationsTable } from "./donations";

export const pickupModeEnum = pgEnum("pickup_mode", [
  "self",
  "representative",
]);

export const claimsTable = pgTable("claims", {
  id: serial("id").primaryKey(),
  donationId: integer("donation_id")
    .notNull()
    .references(() => donationsTable.id, { onDelete: "cascade" }),
  claimedByUserId: integer("claimed_by_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  otp: text("otp"),
  pickupMode: pickupModeEnum("pickup_mode").notNull().default("self"),
  pickupPersonName: text("pickup_person_name").notNull(),
  pickupPersonPhone: text("pickup_person_phone").notNull(),
  pickupQrToken: text("pickup_qr_token").notNull().unique(),
  otpVerified: boolean("otp_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertClaimSchema = createInsertSchema(claimsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claimsTable.$inferSelect;
