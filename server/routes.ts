import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, createAdminUser } from "./auth";
import { 
  insertKingdomSchema, 
  insertContributionSchema, 
  insertWalletSchema, 
  insertPaymentRequestSchema,
  loginSchema,
  registerSchema 
} from "@shared/schema";
import { z } from "zod";

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

  const httpServer = createServer(app);
  return httpServer;
}
