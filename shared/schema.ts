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
  isPaid: boolean("is_paid").default(false), // Track if this contribution has been paid out
  payoutId: varchar("payout_id"), // Link to specific payout
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment settings table (admin configurable)
export const paymentSettings = pgTable("payment_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payoutRatePerPoint: decimal("payout_rate_per_point", { precision: 10, scale: 4 }).notNull(), // Amount per contribution point
  minimumPayout: decimal("minimum_payout", { precision: 10, scale: 2 }).default("10.00"), // Minimum amount for payout
  payoutFrequency: varchar("payout_frequency").default("monthly"), // weekly, biweekly, monthly
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").notNull().references(() => users.id),
});

// Payouts table (tracks actual payments made)
export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  totalPoints: decimal("total_points", { precision: 10, scale: 2 }).notNull(),
  walletAddress: varchar("wallet_address").notNull(),
  paymentSettingsId: varchar("payment_settings_id").notNull().references(() => paymentSettings.id), // Reference to settings used
  status: varchar("status").default("pending"), // pending, processing, completed, failed
  transactionHash: varchar("transaction_hash"), // Blockchain transaction hash if applicable
  adminNotes: text("admin_notes"),
  periodFrom: timestamp("period_from").notNull(), // Start of payout period
  periodTo: timestamp("period_to").notNull(), // End of payout period
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: varchar("processed_by").references(() => users.id),
});

// User payout history summary table
export const userPayoutSummary = pgTable("user_payout_summary", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  lastPayoutDate: timestamp("last_payout_date"),
  totalEarned: decimal("total_earned", { precision: 10, scale: 2 }).default("0"),
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).default("0"),
  pendingAmount: decimal("pending_amount", { precision: 10, scale: 2 }).default("0"),
  unpaidContributions: decimal("unpaid_contributions", { precision: 10, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow(),
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
export const usersRelations = relations(users, ({ many, one }) => ({
  kingdoms: many(kingdoms),
  wallets: many(wallets),
  paymentRequests: many(paymentRequests),
  payouts: many(payouts),
  payoutSummary: one(userPayoutSummary, {
    fields: [users.id],
    references: [userPayoutSummary.userId],
  }),
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
  payout: one(payouts, {
    fields: [contributions.payoutId],
    references: [payouts.id],
  }),
}));

export const paymentSettingsRelations = relations(paymentSettings, ({ one, many }) => ({
  updatedByUser: one(users, {
    fields: [paymentSettings.updatedBy],
    references: [users.id],
  }),
  payouts: many(payouts),
}));

export const payoutsRelations = relations(payouts, ({ one, many }) => ({
  user: one(users, {
    fields: [payouts.userId],
    references: [users.id],
  }),
  paymentSettings: one(paymentSettings, {
    fields: [payouts.paymentSettingsId],
    references: [paymentSettings.id],
  }),
  processedByUser: one(users, {
    fields: [payouts.processedBy],
    references: [users.id],
  }),
  contributions: many(contributions),
}));

export const userPayoutSummaryRelations = relations(userPayoutSummary, ({ one }) => ({
  user: one(users, {
    fields: [userPayoutSummary.userId],
    references: [users.id],
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

export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertUserPayoutSummarySchema = createInsertSchema(userPayoutSummary).omit({
  id: true,
  updatedAt: true,
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
export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;
export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type UserPayoutSummary = typeof userPayoutSummary.$inferSelect;
export type InsertUserPayoutSummary = z.infer<typeof insertUserPayoutSummarySchema>;
