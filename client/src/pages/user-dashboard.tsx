import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import KingdomCard from "@/components/kingdom-card";
import StatCard from "@/components/stat-card";
import ContributionForm from "@/components/contribution-form";
import PaymentRequestForm from "@/components/payment-request-form";
import LandContributions from "@/components/land-contributions";
import UserPayoutSummary from "@/components/user-payout-summary";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function UserDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("dashboard");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: kingdoms = [], isLoading: kingdomsLoading } = useQuery({
    queryKey: ["/api/kingdoms"],
    enabled: isAuthenticated,
  });

  const { data: paymentRequests = [] } = useQuery({
    queryKey: ["/api/payment-requests"],
    enabled: isAuthenticated,
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ["/api/wallets"],
    enabled: isAuthenticated,
  });

  // Add wallet mutation
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const addWalletMutation = useMutation({
    mutationFn: (address: string) => 
      apiRequest("POST", "/api/wallets", { address, isPrimary: (wallets as any[]).length === 0 }),
    onSuccess: () => {
      toast({ title: "Success", description: "Wallet added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setNewWalletAddress("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to add wallet", variant: "destructive" });
    },
  });

  // Delete wallet mutation
  const deleteWalletMutation = useMutation({
    mutationFn: (walletId: string) => apiRequest("DELETE", `/api/wallets/${walletId}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Wallet deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to delete wallet", variant: "destructive" });
    },
  });

  // Delete kingdom mutation
  const deleteKingdomMutation = useMutation({
    mutationFn: (kingdomId: string) => apiRequest("DELETE", `/api/kingdoms/${kingdomId}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Kingdom deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/kingdoms"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to delete kingdom", variant: "destructive" });
    },
  });

  // Get user contributions filtered by registered kingdom IDs
  const kingdomIds = (kingdoms as any[]).map(k => k.lokKingdomId).filter(Boolean);
  const { data: userContributions } = useQuery({
    queryKey: ["/api/user/land-contributions", kingdomIds],
    enabled: isAuthenticated && kingdomIds.length > 0,
  });

  // Calculate stats
  const weeklyContributions = kingdoms.reduce((sum: number, kingdom: any) => {
    // This would need to be calculated based on actual weekly contributions
    return sum + (parseFloat(kingdom.totalContributions) * 0.1); // Mock weekly calculation
  }, 0);

  const pendingPayments = paymentRequests
    .filter((req: any) => req.status === "pending")
    .reduce((sum: number, req: any) => sum + parseFloat(req.amount), 0);

  const totalEarned = paymentRequests
    .filter((req: any) => req.status === "paid")
    .reduce((sum: number, req: any) => sum + parseFloat(req.amount), 0);

  if (isLoading || kingdomsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 gaming-gradient rounded-full flex items-center justify-center animate-pulse">
            <i className="fas fa-crown text-2xl text-accent-foreground"></i>
          </div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gaming-gradient rounded-lg flex items-center justify-center">
                <i className="fas fa-crown text-accent-foreground"></i>
              </div>
              <div>
                <h3 className="elisia-brand text-foreground">Elisia Land Program</h3>
                <p className="text-xs text-muted-foreground">Kingdom Dashboard</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => setActiveSection("dashboard")}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left ${
                activeSection === "dashboard" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid="nav-dashboard"
            >
              <i className="fas fa-home"></i>
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveSection("kingdoms")}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left ${
                activeSection === "kingdoms" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid="nav-kingdoms"
            >
              <i className="fas fa-castle"></i>
              <span>My Kingdoms</span>
            </button>
            <button 
              onClick={() => setActiveSection("contributions")}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left ${
                activeSection === "contributions" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid="nav-contributions"
            >
              <i className="fas fa-chart-line"></i>
              <span>Contributions</span>
            </button>
            <button 
              onClick={() => setActiveSection("payouts")}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left ${
                activeSection === "payouts" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid="nav-payouts"
            >
              <i className="fas fa-money-bill-wave"></i>
              <span>Payouts</span>
            </button>
            <button 
              onClick={() => setActiveSection("wallet")}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left ${
                activeSection === "wallet" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid="nav-wallet"
            >
              <i className="fas fa-wallet"></i>
              <span>Wallet</span>
            </button>
            <button 
              onClick={() => setActiveSection("payments")}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left ${
                activeSection === "payments" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid="nav-payments"
            >
              <i className="fas fa-money-bill-wave"></i>
              <span>Payment Requests</span>
            </button>
          </nav>
          
          {/* User Profile & Logout */}
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">
                  {(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {(user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName || ''}` : (user as any)?.email}
                </p>
                <p className="text-xs text-muted-foreground">Kingdom Manager</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                fetch('/api/logout', { method: 'POST' })
                  .then(() => {
                    queryClient.setQueryData(['/api/auth/user'], null);
                    queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
                  })
                  .catch(() => {
                    queryClient.setQueryData(['/api/auth/user'], null);
                    queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
                  });
              }} 
              variant="outline"
              size="sm"
              className="w-full justify-start"
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {activeSection === "dashboard" && "Dashboard"}
                {activeSection === "kingdoms" && "My Kingdoms"}
                {activeSection === "contributions" && "My Contributions"}
                {activeSection === "payouts" && "Payouts"}
                {activeSection === "wallet" && "Wallet Management"}
                {activeSection === "payments" && "Payment Requests"}
              </h1>
              <p className="text-muted-foreground">
                {activeSection === "dashboard" && "Welcome back, manage your kingdoms and track contributions"}
                {activeSection === "kingdoms" && "Manage your registered kingdoms and their details"}
                {activeSection === "contributions" && "View your contribution history from registered kingdoms"}
                {activeSection === "payouts" && "Track your earnings and manage payouts"}
                {activeSection === "wallet" && "Manage your cryptocurrency wallet addresses"}
                {activeSection === "payments" && "View and create payment requests"}
              </p>
            </div>
            {activeSection === "kingdoms" && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gaming-gradient text-accent-foreground hover:opacity-90" data-testid="button-add-kingdom">
                    <i className="fas fa-plus mr-2"></i>
                    Add Kingdom
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <KingdomCard />
                </DialogContent>
              </Dialog>
            )}
            {activeSection === "wallet" && (
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter wallet address"
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  className="w-64"
                  data-testid="input-new-wallet"
                />
                <Button 
                  onClick={() => {
                    if (newWalletAddress.trim()) {
                      addWalletMutation.mutate(newWalletAddress.trim());
                    }
                  }}
                  disabled={addWalletMutation.isPending || !newWalletAddress.trim()}
                  data-testid="button-add-wallet"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Wallet
                </Button>
              </div>
            )}
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Payouts Section */}
          {activeSection === "payouts" && (
            <UserPayoutSummary />
          )}

          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Kingdoms"
                  value={(kingdoms as any[]).length.toString()}
                  icon="fas fa-castle"
                  color="primary"
                />
                <StatCard
                  title="Weekly Contributions"
                  value={`$${weeklyContributions.toFixed(2)}`}
                  icon="fas fa-coins"
                  color="accent"
                />
                <StatCard
                  title="Pending Payments"
                  value={`$${pendingPayments.toFixed(2)}`}
                  icon="fas fa-clock"
                  color="destructive"
                />
                <StatCard
                  title="Total Earned"
                  value={`$${totalEarned.toFixed(2)}`}
                  icon="fas fa-trophy"
                  color="emerald"
                />
              </div>
            </>
          )}
          
          {/* Kingdoms Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {kingdoms.map((kingdom: any) => (
              <KingdomCard key={kingdom.id} kingdom={kingdom} />
            ))}
          </div>
          
          {/* Recent Activity & Wallet Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentRequests.slice(0, 3).map((request: any) => (
                    <div key={request.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <i className="fas fa-money-bill-wave text-primary text-xs"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Payment request {request.status}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.requestedAt).toLocaleDateString()} • ${request.amount}
                        </p>
                      </div>
                    </div>
                  ))}
                  {paymentRequests.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Wallet Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Wallet Management</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid="button-add-wallet">
                        <i className="fas fa-plus"></i>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <PaymentRequestForm />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {wallets.map((wallet: any) => (
                    <div key={wallet.id} className="bg-muted rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {wallet.isPrimary ? 'Primary Wallet' : 'Secondary Wallet'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          wallet.isActive 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted-foreground/20 text-muted-foreground'
                        }`}>
                          {wallet.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {wallet.address}
                      </p>
                    </div>
                  ))}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full" data-testid="button-request-payment">
                        Request Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <PaymentRequestForm />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Land Contributions Section */}
          <div className="space-y-6">
            <LandContributions isAdmin={false} />
          </div>
        </main>
      </div>
    </div>
  );
}
