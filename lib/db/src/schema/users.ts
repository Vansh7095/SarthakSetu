import {
  pgTable,
  serial,
  text,
  doublePrecision,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roleEnum = pgEnum("role", ["donor", "ngo", "volunteer", "admin"]);
export const donorCategoryEnum = pgEnum("donor_category", [
  "restaurant",
  "hotel",
  "caterer",
  "event_org",
  "household",
]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  role: roleEnum("role").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  city: text("city"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  donorCategory: donorCategoryEnum("donor_category"),
  licenseNumber: text("license_number"),
  orgName: text("org_name"),
  registrationNumber: text("registration_number"),
  operatingRadiusKm: doublePrecision("operating_radius_km"),
  vehicleType: text("vehicle_type"),
  availabilityStatus: text("availability_status"),
  darpanId: text("darpan_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
