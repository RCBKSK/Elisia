import {
  users,
  kingdoms,
  contributions,
  wallets,
  paymentRequests,
  paymentSettings,
  payouts,
  userPayoutSummary,
  dragoRentalRequests,
  announcements,
  type User,
  type UpsertUser,
  type LoginData,
  type RegisterData,
  type Kingdom,
  type InsertKingdom,
  type Contribution,
  type InsertContribution,
  type Wallet,
  type InsertWallet,
  type PaymentRequest,
  type InsertPaymentRequest,
  type PaymentSettings,
  type InsertPaymentSettings,
  type Payout,
  type InsertPayout,
  type UserPayoutSummary,
  type InsertUserPayoutSummary,
  type DragoRentalRequest,
  type InsertDragoRentalRequest,
  type Announcement,
  type InsertAnnouncement,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: RegisterData): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getPendingUsers(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getAllUsersWithDetails(): Promise<any[]>;
  approveUser(id: string): Promise<void>;
  rejectUser(id: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  
  // Kingdom operations
  getUserKingdoms(userId: string): Promise<Kingdom[]>;
  getKingdomByLokId(lokKingdomId: string): Promise<Kingdom | undefined>;
  createKingdom(kingdom: InsertKingdom): Promise<Kingdom>;
  updateKingdom(id: string, kingdom: Partial<InsertKingdom>): Promise<Kingdom>;
  getKingdom(id: string): Promise<Kingdom | undefined>;
  getAllKingdoms(): Promise<Kingdom[]>;
  
  // Contribution operations
  getKingdomContributions(kingdomId: string): Promise<Contribution[]>;
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  getContributionsByPeriod(kingdomId: string, period: string): Promise<Contribution[]>;
  
  // Wallet operations
  getUserWallets(userId: string): Promise<Wallet[]>;
  getWalletByAddress(address: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: string, wallet: Partial<InsertWallet>): Promise<Wallet>;
  
  // Payment request operations
  getUserPaymentRequests(userId: string): Promise<PaymentRequest[]>;
  createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest>;
  getPendingPaymentRequests(): Promise<PaymentRequest[]>;
  getAllPaymentRequests(): Promise<PaymentRequest[]>;
  updatePaymentRequestStatus(id: string, status: string, adminNotes?: string, processedBy?: string): Promise<PaymentRequest>;
  
  // Payment settings operations
  getActivePaymentSettings(): Promise<PaymentSettings | undefined>;
  createPaymentSettings(settings: InsertPaymentSettings): Promise<PaymentSettings>;
  updatePaymentSettings(id: string, settings: Partial<InsertPaymentSettings>): Promise<PaymentSettings>;
  
  // Payout operations
  getUserPayouts(userId: string): Promise<Payout[]>;
  createPayout(payout: InsertPayout): Promise<Payout>;
  updatePayoutStatus(id: string, status: string, transactionHash?: string, adminNotes?: string, processedBy?: string): Promise<Payout>;
  getPendingPayouts(): Promise<Payout[]>;
  
  // User payout summary operations
  getUserPayoutSummary(userId: string): Promise<UserPayoutSummary | undefined>;
  updateUserPayoutSummary(userId: string, summary: Partial<InsertUserPayoutSummary>): Promise<UserPayoutSummary>;
  calculateUnpaidContributions(userId: string): Promise<{ amount: number; contributions: Contribution[] }>;
  
  // Drago rental operations
  getUserDragoRentalRequests(userId: string): Promise<DragoRentalRequest[]>;
  createDragoRentalRequest(data: InsertDragoRentalRequest): Promise<DragoRentalRequest>;
  getAllDragoRentalRequests(): Promise<DragoRentalRequest[]>;
  getPendingDragoRentalRequests(): Promise<DragoRentalRequest[]>;
  updateDragoRentalRequestStatus(id: string, status: string, adminNotes?: string, processedBy?: string, rentalStartDate?: Date, rentalEndDate?: Date): Promise<DragoRentalRequest>;
  
  // Announcement operations
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getActiveAnnouncements(): Promise<Announcement[]>;

  // Admin operations
  getSystemStats(): Promise<{
    totalUsers: number;
    totalKingdoms: number;
    pendingApprovals: number;
    totalPayouts: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: RegisterData): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getPendingUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.isApproved, false));
  }

  async approveUser(id: string): Promise<void> {
    await db.update(users).set({ isApproved: true }).where(eq(users.id, id));
  }

  async rejectUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllUsersWithDetails(): Promise<any[]> {
    const result = await db
      .select({
        user: users,
        kingdoms: sql`COALESCE(jsonb_agg(
          DISTINCT jsonb_build_object(
            'id', ${kingdoms.id},
            'name', ${kingdoms.name},
            'lokKingdomId', ${kingdoms.lokKingdomId},
            'level', ${kingdoms.level},
            'status', ${kingdoms.status},
            'totalContributions', ${kingdoms.totalContributions}
          ) ORDER BY ${kingdoms.createdAt}
        ) FILTER (WHERE ${kingdoms.id} IS NOT NULL), '[]'::jsonb)`.as('kingdoms'),
        wallets: sql`COALESCE(jsonb_agg(
          DISTINCT jsonb_build_object(
            'id', ${wallets.id},
            'address', ${wallets.address},
            'isPrimary', ${wallets.isPrimary},
            'isActive', ${wallets.isActive}
          ) ORDER BY ${wallets.createdAt}
        ) FILTER (WHERE ${wallets.id} IS NOT NULL), '[]'::jsonb)`.as('wallets'),
      })
      .from(users)
      .leftJoin(kingdoms, eq(users.id, kingdoms.userId))
      .leftJoin(wallets, eq(users.id, wallets.userId))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));

    return result;
  }

  async deleteUser(id: string): Promise<void> {
    // Delete related data first (cascade delete)
    await db.delete(contributions).where(sql`${contributions.kingdomId} IN (SELECT ${kingdoms.id} FROM ${kingdoms} WHERE ${kingdoms.userId} = ${id})`);
    await db.delete(kingdoms).where(eq(kingdoms.userId, id));
    await db.delete(wallets).where(eq(wallets.userId, id));
    await db.delete(paymentRequests).where(eq(paymentRequests.userId, id));
    await db.delete(payouts).where(eq(payouts.userId, id));
    await db.delete(userPayoutSummary).where(eq(userPayoutSummary.userId, id));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  // Kingdom operations
  async getUserKingdoms(userId: string): Promise<Kingdom[]> {
    return db.select().from(kingdoms).where(eq(kingdoms.userId, userId));
  }

  async getKingdomByLokId(lokKingdomId: string): Promise<Kingdom | undefined> {
    const [kingdom] = await db.select().from(kingdoms).where(eq(kingdoms.lokKingdomId, lokKingdomId));
    return kingdom;
  }

  async createKingdom(kingdom: InsertKingdom): Promise<Kingdom> {
    const [newKingdom] = await db.insert(kingdoms).values(kingdom).returning();
    return newKingdom;
  }

  async updateKingdom(id: string, kingdom: Partial<InsertKingdom>): Promise<Kingdom> {
    const [updatedKingdom] = await db
      .update(kingdoms)
      .set({ ...kingdom, updatedAt: new Date() })
      .where(eq(kingdoms.id, id))
      .returning();
    return updatedKingdom;
  }

  async getKingdom(id: string): Promise<Kingdom | undefined> {
    const [kingdom] = await db.select().from(kingdoms).where(eq(kingdoms.id, id));
    return kingdom;
  }

  async getAllKingdoms(): Promise<Kingdom[]> {
    return db.select().from(kingdoms);
  }

  // Contribution operations
  async getKingdomContributions(kingdomId: string): Promise<Contribution[]> {
    return db
      .select()
      .from(contributions)
      .where(eq(contributions.kingdomId, kingdomId))
      .orderBy(desc(contributions.createdAt));
  }

  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    const [newContribution] = await db.insert(contributions).values(contribution).returning();
    
    // Update kingdom total contributions
    await db
      .update(kingdoms)
      .set({
        totalContributions: sql`${kingdoms.totalContributions} + ${contribution.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(kingdoms.id, contribution.kingdomId));
    
    return newContribution;
  }

  async getContributionsByPeriod(kingdomId: string, period: string): Promise<Contribution[]> {
    return db
      .select()
      .from(contributions)
      .where(and(eq(contributions.kingdomId, kingdomId), eq(contributions.period, period)))
      .orderBy(desc(contributions.createdAt));
  }

  // Wallet operations
  async getUserWallets(userId: string): Promise<Wallet[]> {
    return db.select().from(wallets).where(eq(wallets.userId, userId));
  }

  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.address, address));
    return wallet;
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const [newWallet] = await db.insert(wallets).values(wallet).returning();
    return newWallet;
  }

  async updateWallet(id: string, wallet: Partial<InsertWallet>): Promise<Wallet> {
    const [updatedWallet] = await db
      .update(wallets)
      .set(wallet)
      .where(eq(wallets.id, id))
      .returning();
    return updatedWallet;
  }

  // Payment request operations
  async getUserPaymentRequests(userId: string): Promise<PaymentRequest[]> {
    return db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.userId, userId))
      .orderBy(desc(paymentRequests.requestedAt));
  }

  async createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest> {
    const [newRequest] = await db.insert(paymentRequests).values(request).returning();
    return newRequest;
  }

  async getPendingPaymentRequests(): Promise<PaymentRequest[]> {
    return db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.status, "pending"))
      .orderBy(desc(paymentRequests.requestedAt));
  }

  async updatePaymentRequestStatus(
    id: string,
    status: string,
    adminNotes?: string,
    processedBy?: string
  ): Promise<PaymentRequest> {
    const [updatedRequest] = await db
      .update(paymentRequests)
      .set({
        status,
        adminNotes,
        processedBy,
        processedAt: new Date(),
      })
      .where(eq(paymentRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Drago rental operations
  async getUserDragoRentalRequests(userId: string): Promise<DragoRentalRequest[]> {
    return db
      .select()
      .from(dragoRentalRequests)
      .where(eq(dragoRentalRequests.userId, userId))
      .orderBy(desc(dragoRentalRequests.requestedAt));
  }

  async createDragoRentalRequest(data: InsertDragoRentalRequest): Promise<DragoRentalRequest> {
    const [request] = await db.insert(dragoRentalRequests).values(data).returning();
    return request;
  }

  async getAllDragoRentalRequests(): Promise<DragoRentalRequest[]> {
    return db
      .select()
      .from(dragoRentalRequests)
      .orderBy(desc(dragoRentalRequests.requestedAt));
  }

  async getPendingDragoRentalRequests(): Promise<DragoRentalRequest[]> {
    return db
      .select()
      .from(dragoRentalRequests)
      .where(eq(dragoRentalRequests.status, "pending"))
      .orderBy(desc(dragoRentalRequests.requestedAt));
  }

  async updateDragoRentalRequestStatus(
    id: string, 
    status: string, 
    adminNotes?: string, 
    processedBy?: string,
    rentalStartDate?: Date,
    rentalEndDate?: Date
  ): Promise<DragoRentalRequest> {
    const updates: any = { status };
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (processedBy) updates.processedBy = processedBy;
    if (rentalStartDate) updates.rentalStartDate = rentalStartDate;
    if (rentalEndDate) updates.rentalEndDate = rentalEndDate;
    if (status !== "pending") updates.processedAt = new Date();

    const [updatedRequest] = await db
      .update(dragoRentalRequests)
      .set(updates)
      .where(eq(dragoRentalRequests.id, id))
      .returning();

    return updatedRequest;
  }

  // Payment settings operations
  async getActivePaymentSettings(): Promise<PaymentSettings | undefined> {
    const [settings] = await db
      .select()
      .from(paymentSettings)
      .where(eq(paymentSettings.isActive, true))
      .orderBy(desc(paymentSettings.createdAt));
    return settings;
  }

  async createPaymentSettings(settings: InsertPaymentSettings): Promise<PaymentSettings> {
    // Deactivate existing settings
    await db
      .update(paymentSettings)
      .set({ isActive: false })
      .where(eq(paymentSettings.isActive, true));
    
    const [newSettings] = await db.insert(paymentSettings).values(settings).returning();
    return newSettings;
  }

  async updatePaymentSettings(id: string, settings: Partial<InsertPaymentSettings>): Promise<PaymentSettings> {
    const [updatedSettings] = await db
      .update(paymentSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(paymentSettings.id, id))
      .returning();
    return updatedSettings;
  }

  // Payout operations
  async getUserPayouts(userId: string): Promise<Payout[]> {
    return db
      .select()
      .from(payouts)
      .where(eq(payouts.userId, userId))
      .orderBy(desc(payouts.createdAt));
  }

  async createPayout(payout: InsertPayout): Promise<Payout> {
    const [newPayout] = await db.insert(payouts).values(payout).returning();
    
    // Mark associated contributions as paid
    if (payout.userId) {
      await db
        .update(contributions)
        .set({ isPaid: true, payoutId: newPayout.id })
        .where(
          and(
            eq(contributions.isPaid, false),
            sql`${contributions.kingdomId} IN (SELECT id FROM ${kingdoms} WHERE ${kingdoms.userId} = ${payout.userId})`
          )
        );
    }
    
    return newPayout;
  }

  async updatePayoutStatus(
    id: string,
    status: string,
    transactionHash?: string,
    adminNotes?: string,
    processedBy?: string
  ): Promise<Payout> {
    const [updatedPayout] = await db
      .update(payouts)
      .set({
        status,
        transactionHash,
        adminNotes,
        processedBy,
        processedAt: new Date(),
      })
      .where(eq(payouts.id, id))
      .returning();
    return updatedPayout;
  }

  async getPendingPayouts(): Promise<Payout[]> {
    return db
      .select()
      .from(payouts)
      .where(eq(payouts.status, "pending"))
      .orderBy(desc(payouts.createdAt));
  }

  // User payout summary operations
  async getUserPayoutSummary(userId: string): Promise<UserPayoutSummary | undefined> {
    const [summary] = await db
      .select()
      .from(userPayoutSummary)
      .where(eq(userPayoutSummary.userId, userId));
    return summary;
  }

  async updateUserPayoutSummary(userId: string, summary: Partial<InsertUserPayoutSummary>): Promise<UserPayoutSummary> {
    const [existing] = await db
      .select()
      .from(userPayoutSummary)
      .where(eq(userPayoutSummary.userId, userId));

    if (existing) {
      const [updated] = await db
        .update(userPayoutSummary)
        .set({ ...summary, updatedAt: new Date() })
        .where(eq(userPayoutSummary.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userPayoutSummary)
        .values({ userId, ...summary })
        .returning();
      return created;
    }
  }

  async calculateUnpaidContributions(userId: string): Promise<{ amount: number; contributions: Contribution[] }> {
    const unpaidContributions = await db
      .select()
      .from(contributions)
      .leftJoin(kingdoms, eq(contributions.kingdomId, kingdoms.id))
      .where(
        and(
          eq(kingdoms.userId, userId),
          eq(contributions.isPaid, false)
        )
      )
      .orderBy(desc(contributions.createdAt));

    const amount = unpaidContributions.reduce((sum, row) => 
      sum + parseFloat(row.contributions?.amount || "0"), 0);

    return {
      amount,
      contributions: unpaidContributions.map(row => row.contributions!).filter(Boolean)
    };
  }

  // Admin operations
  async getSystemStats(): Promise<{
    totalUsers: number;
    totalKingdoms: number;
    pendingApprovals: number;
    totalPayouts: string;
  }> {
    const [usersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isApproved, true));

    const [kingdomsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(kingdoms);

    const [pendingUsersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isApproved, false));

    const [pendingPaymentsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentRequests)
      .where(eq(paymentRequests.status, "pending"));

    const [totalPayouts] = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(${paymentRequests.amount}), 0)` 
      })
      .from(paymentRequests)
      .where(eq(paymentRequests.status, "paid"));

    return {
      totalUsers: usersCount.count,
      totalKingdoms: kingdomsCount.count,
      pendingApprovals: pendingUsersCount.count + pendingPaymentsCount.count,
      totalPayouts: totalPayouts.total || "0",
    };
  }

  // Additional payment request operations
  async getAllPaymentRequests(): Promise<PaymentRequest[]> {
    return db
      .select()
      .from(paymentRequests)
      .orderBy(desc(paymentRequests.requestedAt));
  }

  // Announcement operations
  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db
      .insert(announcements)
      .values({
        title: announcement.title,
        message: announcement.message,
        type: announcement.type,
        createdBy: announcement.createdBy,
      })
      .returning();
    return newAnnouncement;
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return db
      .select()
      .from(announcements)
      .where(eq(announcements.isActive, true))
      .orderBy(desc(announcements.createdAt));
  }
}

export const storage = new DatabaseStorage();
