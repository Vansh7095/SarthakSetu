import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const foodTypeEnum = pgEnum("food_type", ["veg", "non_veg", "both"]);
export const donationStatusEnum = pgEnum("donation_status", [
  "available",
  "claimed",
  "picked_up",
  "completed",
]);

export const donationsTable = pgTable("donations", {
  id: serial("id").primaryKey(),
  donorId: integer("donor_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  foodName: text("food_name").notNull(),
  foodType: foodTypeEnum("food_type").notNull(),
  quantityPlates: integer("quantity_plates").notNull(),
  estimatedServings: integer("estimated_servings"),
  preparedAt: timestamp("prepared_at"),
  pickupDeadline: timestamp("pickup_deadline").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  address: text("address"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  status: donationStatusEnum("status").notNull().default("available"),
  claimedByUserId: integer("claimed_by_user_id").references(
    () => usersTable.id,
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDonationSchema = createInsertSchema(donationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donationsTable.$inferSelect;
