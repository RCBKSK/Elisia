import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isApproved: boolean("is_approved").default(false),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Kingdoms table
export const kingdoms = pgTable("kingdoms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  lokKingdomId: varchar("lok_kingdom_id").unique(), // LOK API kingdom ID for fetching contributions
  level: integer("level").default(1),
  imageUrl: varchar("image_url"),
  status: varchar("status").default("active"), // active, developing, inactive
  totalContributions: decimal("total_contributions", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contributions table
export const contributions = pgTable("contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kingdomId: varchar("kingdom_id").notNull().references(() => kingdoms.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  period: varchar("period").notNull(), // weekly, biweekly, monthly
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wallet addresses table
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  address: varchar("address").notNull(),
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment requests table
export const paymentRequests = pgTable("payment_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  kingdomId: varchar("kingdom_id").references(() => kingdoms.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  walletAddress: varchar("wallet_address").notNull(),
  description: text("description"),
  status: varchar("status").default("pending"), // pending, approved, rejected, paid
  adminNotes: text("admin_notes"),
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: varchar("processed_by").references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  kingdoms: many(kingdoms),
  wallets: many(wallets),
  paymentRequests: many(paymentRequests),
}));

export const kingdomsRelations = relations(kingdoms, ({ one, many }) => ({
  user: one(users, {
    fields: [kingdoms.userId],
    references: [users.id],
  }),
  contributions: many(contributions),
  paymentRequests: many(paymentRequests),
}));

export const contributionsRelations = relations(contributions, ({ one }) => ({
  kingdom: one(kingdoms, {
    fields: [contributions.kingdomId],
    references: [kingdoms.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

export const paymentRequestsRelations = relations(paymentRequests, ({ one }) => ({
  user: one(users, {
    fields: [paymentRequests.userId],
    references: [users.id],
  }),
  kingdom: one(kingdoms, {
    fields: [paymentRequests.kingdomId],
    references: [kingdoms.id],
  }),
  processedByUser: one(users, {
    fields: [paymentRequests.processedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertKingdomSchema = createInsertSchema(kingdoms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalContributions: true,
});

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  createdAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentRequestSchema = createInsertSchema(paymentRequests).omit({
  id: true,
  requestedAt: true,
  processedAt: true,
  processedBy: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type Kingdom = typeof kingdoms.$inferSelect;
export type InsertKingdom = z.infer<typeof insertKingdomSchema>;
export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = z.infer<typeof insertContributionSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type InsertPaymentRequest = z.infer<typeof insertPaymentRequestSchema>;
