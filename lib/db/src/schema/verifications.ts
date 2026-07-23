import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const fssaiLicensesTable = pgTable("fssai_licenses", {
  id: serial("id").primaryKey(),
  licenseNumber: text("license_number").notNull().unique(),
  businessName: text("business_name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  category: text("category").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const darpanIdsTable = pgTable("darpan_ids", {
  id: serial("id").primaryKey(),
  darpanId: text("darpan_id").notNull().unique(),
  orgName: text("org_name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const adminCodesTable = pgTable("admin_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  usedByClerkId: text("used_by_clerk_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FssaiLicense = typeof fssaiLicensesTable.$inferSelect;
export type DarpanId = typeof darpanIdsTable.$inferSelect;
export type AdminCode = typeof adminCodesTable.$inferSelect;
