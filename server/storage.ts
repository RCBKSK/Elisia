import {
  users,
  kingdoms,
  contributions,
  wallets,
  paymentRequests,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: RegisterData): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getPendingUsers(): Promise<User[]>;
  approveUser(id: string): Promise<void>;
  rejectUser(id: string): Promise<void>;
  
  // Kingdom operations
  getUserKingdoms(userId: string): Promise<Kingdom[]>;
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
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: string, wallet: Partial<InsertWallet>): Promise<Wallet>;
  
  // Payment request operations
  getUserPaymentRequests(userId: string): Promise<PaymentRequest[]>;
  createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest>;
  getPendingPaymentRequests(): Promise<PaymentRequest[]>;
  updatePaymentRequestStatus(id: string, status: string, adminNotes?: string, processedBy?: string): Promise<PaymentRequest>;
  
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

  // Kingdom operations
  async getUserKingdoms(userId: string): Promise<Kingdom[]> {
    return db.select().from(kingdoms).where(eq(kingdoms.userId, userId));
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
}

export const storage = new DatabaseStorage();
