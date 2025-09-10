import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, createAdminUser } from "./auth";
import { 
  insertKingdomSchema, 
  insertContributionSchema, 
  insertWalletSchema, 
  insertPaymentRequestSchema,
  insertPaymentSettingsSchema,
  insertPayoutSchema,
  insertDragoRentalRequestSchema,
  loginSchema,
  registerSchema 
} from "@shared/schema";
import { z } from "zod";
import { getAllUsersContributions, getContributionsForKingdoms } from "./services/lok-api";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);
  
  // Create admin user on startup
  await createAdminUser();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user?.isApproved) {
        return res.status(403).json({ message: "Account pending approval" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin middleware
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const user = req.user;
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization error" });
    }
  };

  // Kingdom routes
  app.get('/api/kingdoms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const kingdoms = await storage.getUserKingdoms(userId);
      res.json(kingdoms);
    } catch (error) {
      console.error("Error fetching kingdoms:", error);
      res.status(500).json({ message: "Failed to fetch kingdoms" });
    }
  });

  app.post('/api/kingdoms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertKingdomSchema.parse({ ...req.body, userId });
      const kingdom = await storage.createKingdom(data);
      res.json(kingdom);
    } catch (error) {
      console.error("Error creating kingdom:", error);
      res.status(400).json({ message: "Failed to create kingdom" });
    }
  });

  app.put('/api/kingdoms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const data = insertKingdomSchema.partial().parse(req.body);
      const kingdom = await storage.updateKingdom(id, data);
      res.json(kingdom);
    } catch (error) {
      console.error("Error updating kingdom:", error);
      res.status(400).json({ message: "Failed to update kingdom" });
    }
  });

  // Contribution routes
  app.get('/api/kingdoms/:id/contributions', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { period } = req.query;
      
      const contributions = period 
        ? await storage.getContributionsByPeriod(id, period as string)
        : await storage.getKingdomContributions(id);
      
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  app.post('/api/contributions', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertContributionSchema.parse(req.body);
      const contribution = await storage.createContribution(data);
      res.json(contribution);
    } catch (error) {
      console.error("Error creating contribution:", error);
      res.status(400).json({ message: "Failed to create contribution" });
    }
  });

  // Wallet routes
  app.get('/api/wallets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const wallets = await storage.getUserWallets(userId);
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ message: "Failed to fetch wallets" });
    }
  });

  app.post('/api/wallets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertWalletSchema.parse({ ...req.body, userId });
      const wallet = await storage.createWallet(data);
      res.json(wallet);
    } catch (error) {
      console.error("Error creating wallet:", error);
      res.status(400).json({ message: "Failed to create wallet" });
    }
  });

  // Payment request routes
  app.get('/api/payment-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requests = await storage.getUserPaymentRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching payment requests:", error);
      res.status(500).json({ message: "Failed to fetch payment requests" });
    }
  });

  app.post('/api/payment-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertPaymentRequestSchema.parse({ ...req.body, userId });
      const request = await storage.createPaymentRequest(data);
      res.json(request);
    } catch (error) {
      console.error("Error creating payment request:", error);
      res.status(400).json({ message: "Failed to create payment request" });
    }
  });

  // Drago rental request routes
  app.get('/api/drago-rental-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requests = await storage.getUserDragoRentalRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching drago rental requests:", error);
      res.status(500).json({ message: "Failed to fetch drago rental requests" });
    }
  });

  app.post('/api/drago-rental-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertDragoRentalRequestSchema.parse({ ...req.body, userId });
      const request = await storage.createDragoRentalRequest(data);
      res.json(request);
    } catch (error) {
      console.error("Error creating drago rental request:", error);
      res.status(400).json({ message: "Failed to create drago rental request" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/admin/pending-users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getPendingUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.post('/api/admin/approve-user/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.approveUser(id);
      res.json({ message: "User approved successfully" });
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.delete('/api/admin/reject-user/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.rejectUser(id);
      res.json({ message: "User rejected successfully" });
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  app.get('/api/admin/all-users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsersWithDetails();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch all users" });
    }
  });

  app.delete('/api/admin/delete-user/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get('/api/admin/pending-payments', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const requests = await storage.getPendingPaymentRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      res.status(500).json({ message: "Failed to fetch pending payments" });
    }
  });

  app.put('/api/admin/payment-requests/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      const processedBy = req.user.id;
      
      const request = await storage.updatePaymentRequestStatus(id, status, adminNotes, processedBy);
      res.json(request);
    } catch (error) {
      console.error("Error updating payment request:", error);
      res.status(500).json({ message: "Failed to update payment request" });
    }
  });

  app.get('/api/admin/kingdoms', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const kingdoms = await storage.getAllKingdoms();
      res.json(kingdoms);
    } catch (error) {
      console.error("Error fetching all kingdoms:", error);
      res.status(500).json({ message: "Failed to fetch kingdoms" });
    }
  });

  // Land contributions routes
  app.get('/api/admin/land-contributions', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { period = 'currentWeek', customDays, continent, landId } = req.query;
      let result = await getAllUsersContributions(
        period as string, 
        customDays ? parseInt(customDays as string) : undefined
      );
      
      // Filter by continent if specified
      if (continent && continent !== 'all') {
        result.data = result.data.filter(item => item.continent === parseInt(continent as string));
      }
      
      // Filter by land ID if specified
      if (landId && landId !== 'all') {
        result.data = result.data.filter(item => item.landId === landId);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching land contributions:", error);
      res.status(500).json({ message: "Failed to fetch land contributions" });
    }
  });

  // Get aggregated stats by continent and land
  app.get('/api/admin/land-stats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { period = 'currentWeek', customDays } = req.query;
      const result = await getAllUsersContributions(
        period as string, 
        customDays ? parseInt(customDays as string) : undefined
      );
      
      // Aggregate by continent
      const continentStats = result.data.reduce((acc: any, item) => {
        if (!acc[item.continent]) {
          acc[item.continent] = { total: 0, kingdoms: new Set() };
        }
        acc[item.continent].total += item.total;
        acc[item.continent].kingdoms.add(item.kingdomId);
        return acc;
      }, {});
      
      // Aggregate by land
      const landStats = result.data.reduce((acc: any, item) => {
        if (!acc[item.landId || 'unknown']) {
          acc[item.landId || 'unknown'] = { total: 0, kingdoms: new Set(), continents: new Set() };
        }
        acc[item.landId || 'unknown'].total += item.total;
        acc[item.landId || 'unknown'].kingdoms.add(item.kingdomId);
        acc[item.landId || 'unknown'].continents.add(item.continent);
        return acc;
      }, {});
      
      // Convert Sets to counts
      Object.keys(continentStats).forEach(key => {
        continentStats[key].kingdomCount = continentStats[key].kingdoms.size;
        delete continentStats[key].kingdoms;
      });
      
      Object.keys(landStats).forEach(key => {
        landStats[key].kingdomCount = landStats[key].kingdoms.size;
        landStats[key].continentCount = landStats[key].continents.size;
        delete landStats[key].kingdoms;
        delete landStats[key].continents;
      });
      
      res.json({
        from: result.from,
        to: result.to,
        continentStats,
        landStats,
        totalContributions: result.data.reduce((sum, item) => sum + item.total, 0),
        totalKingdoms: new Set(result.data.map(item => item.kingdomId)).size
      });
    } catch (error) {
      console.error("Error fetching land stats:", error);
      res.status(500).json({ message: "Failed to fetch land stats" });
    }
  });

  // Payment settings routes (Admin only)
  app.get('/api/admin/payment-settings', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const settings = await storage.getActivePaymentSettings();
      res.json(settings || null);
    } catch (error) {
      console.error("Error fetching payment settings:", error);
      res.status(500).json({ message: "Failed to fetch payment settings" });
    }
  });

  app.post('/api/admin/payment-settings', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const updatedBy = req.user.id;
      const data = insertPaymentSettingsSchema.parse({ ...req.body, updatedBy });
      const settings = await storage.createPaymentSettings(data);
      res.json(settings);
    } catch (error) {
      console.error("Error creating payment settings:", error);
      res.status(400).json({ message: "Failed to create payment settings" });
    }
  });

  app.put('/api/admin/payment-settings/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updatedBy = req.user.id;
      const data = { ...req.body, updatedBy };
      const settings = await storage.updatePaymentSettings(id, data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating payment settings:", error);
      res.status(400).json({ message: "Failed to update payment settings" });
    }
  });

  // Admin drago rental routes
  app.get('/api/admin/drago-rental-requests', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const requests = await storage.getAllDragoRentalRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching drago rental requests:", error);
      res.status(500).json({ message: "Failed to fetch drago rental requests" });
    }
  });

  app.get('/api/admin/pending-drago-rentals', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const requests = await storage.getPendingDragoRentalRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending drago rentals:", error);
      res.status(500).json({ message: "Failed to fetch pending drago rentals" });
    }
  });

  app.put('/api/admin/drago-rental-requests/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes, rentalStartDate, rentalEndDate } = req.body;
      const processedBy = req.user.id;
      
      const request = await storage.updateDragoRentalRequestStatus(
        id, 
        status, 
        adminNotes, 
        processedBy,
        rentalStartDate ? new Date(rentalStartDate) : undefined,
        rentalEndDate ? new Date(rentalEndDate) : undefined
      );
      res.json(request);
    } catch (error) {
      console.error("Error updating drago rental request:", error);
      res.status(500).json({ message: "Failed to update drago rental request" });
    }
  });

  // Payout routes
  app.get('/api/payouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const payouts = await storage.getUserPayouts(userId);
      res.json(payouts);
    } catch (error) {
      console.error("Error fetching user payouts:", error);
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });

  app.get('/api/user/payout-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const [summary, unpaidData] = await Promise.all([
        storage.getUserPayoutSummary(userId),
        storage.calculateUnpaidContributions(userId)
      ]);
      
      res.json({
        summary: summary || {
          userId,
          lastPayoutDate: null,
          totalEarned: "0",
          totalPaid: "0",
          pendingAmount: "0",
          unpaidContributions: "0"
        },
        unpaidAmount: unpaidData.amount,
        unpaidContributions: unpaidData.contributions
      });
    } catch (error) {
      console.error("Error fetching user payout summary:", error);
      res.status(500).json({ message: "Failed to fetch payout summary" });
    }
  });

  // Admin payout management routes
  app.get('/api/admin/pending-payouts', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const payouts = await storage.getPendingPayouts();
      res.json(payouts);
    } catch (error) {
      console.error("Error fetching pending payouts:", error);
      res.status(500).json({ message: "Failed to fetch pending payouts" });
    }
  });

  app.post('/api/admin/payouts', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const processedBy = req.user.id;
      const data = insertPayoutSchema.parse({ ...req.body, processedBy });
      const payout = await storage.createPayout(data);
      
      // Update user payout summary
      const unpaidData = await storage.calculateUnpaidContributions(data.userId);
      await storage.updateUserPayoutSummary(data.userId, {
        lastPayoutDate: new Date(),
        totalPaid: data.totalAmount,
        pendingAmount: unpaidData.amount.toString(),
        unpaidContributions: unpaidData.amount.toString()
      });
      
      res.json(payout);
    } catch (error) {
      console.error("Error creating payout:", error);
      res.status(400).json({ message: "Failed to create payout" });
    }
  });

  app.put('/api/admin/payouts/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, transactionHash, adminNotes } = req.body;
      const processedBy = req.user.id;
      
      const payout = await storage.updatePayoutStatus(id, status, transactionHash, adminNotes, processedBy);
      res.json(payout);
    } catch (error) {
      console.error("Error updating payout status:", error);
      res.status(500).json({ message: "Failed to update payout status" });
    }
  });

  app.get('/api/user/land-contributions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { period = 'currentWeek', customDays } = req.query;
      
      // Get user's kingdoms with LOK kingdom IDs
      const kingdoms = await storage.getUserKingdoms(userId);
      const lokKingdomIds = kingdoms
        .filter((k: any) => k.lokKingdomId) // Only kingdoms with LOK IDs
        .map((k: any) => k.lokKingdomId);
      
      if (lokKingdomIds.length === 0) {
        return res.json({
          data: [],
          from: new Date().toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        });
      }
      
      const result = await getContributionsForKingdoms(
        lokKingdomIds,
        period as string,
        customDays ? parseInt(customDays as string) : undefined
      );
      res.json(result);
    } catch (error) {
      console.error("Error fetching user land contributions:", error);
      res.status(500).json({ message: "Failed to fetch land contributions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
