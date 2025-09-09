import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/stat-card";
import LandContributions from "@/components/land-contributions";
import LandStats from "@/components/land-stats";
import AdminLandDashboard from "@/components/admin-land-dashboard";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("overview");

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

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && (user as any)?.isAdmin,
  });

  const { data: pendingUsers = [] } = useQuery({
    queryKey: ["/api/admin/pending-users"],
    enabled: isAuthenticated && (user as any)?.isAdmin,
  });

  const { data: pendingPayments = [] } = useQuery({
    queryKey: ["/api/admin/pending-payments"],
    enabled: isAuthenticated && (user as any)?.isAdmin,
  });

  const approveUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("POST", `/api/admin/approve-user/${userId}`),
    onSuccess: () => {
      toast({ title: "Success", description: "User approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
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
      toast({ title: "Error", description: "Failed to approve user", variant: "destructive" });
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/admin/reject-user/${userId}`),
    onSuccess: () => {
      toast({ title: "Success", description: "User rejected successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
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
      toast({ title: "Error", description: "Failed to reject user", variant: "destructive" });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => 
      apiRequest("PUT", `/api/admin/payment-requests/${id}`, { status, adminNotes }),
    onSuccess: () => {
      toast({ title: "Success", description: "Payment request updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
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
      toast({ title: "Error", description: "Failed to update payment request", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 gaming-gradient rounded-full flex items-center justify-center animate-pulse">
            <i className="fas fa-shield-alt text-2xl text-accent-foreground"></i>
          </div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!(user as any)?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <i className="fas fa-ban text-4xl text-destructive mb-4"></i>
              <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Admin access required</p>
            </div>
          </CardContent>
        </Card>
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
                <i className="fas fa-shield-alt text-accent-foreground"></i>
              </div>
              <div>
                <h3 className="font-bold text-foreground">Admin Panel</h3>
                <p className="text-xs text-muted-foreground">LoK Management</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => setActiveSection("overview")}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left ${
                activeSection === "overview" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid="nav-overview"
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>Overview</span>
            </button>
            <button 
              onClick={() => setActiveSection("users")}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left ${
                activeSection === "users" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid="nav-users"
            >
              <i className="fas fa-users"></i>
              <span>User Management</span>
              {(pendingUsers as any[]).length > 0 && (
                <span className="ml-auto bg-destructive/20 text-destructive px-2 py-0.5 rounded-full text-xs">
                  {(pendingUsers as any[]).length}
                </span>
              )}
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
              <span>All Kingdoms</span>
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
              {(pendingPayments as any[]).length > 0 && (
                <span className="ml-auto bg-accent/20 text-accent px-2 py-0.5 rounded-full text-xs">
                  {(pendingPayments as any[]).length}
                </span>
              )}
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
              <span>Land Contributions</span>
            </button>
            <button 
              onClick={() => setActiveSection("analytics")}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left ${
                activeSection === "analytics" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid="nav-analytics"
            >
              <i className="fas fa-chart-bar"></i>
              <span>Analytics</span>
            </button>
            <button 
              onClick={() => setActiveSection("settings")}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left ${
                activeSection === "settings" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid="nav-settings"
            >
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </button>
          </nav>
          
          {/* User Profile & Logout */}
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">
                  {(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {(user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName || ''}` : (user as any)?.email}
                </p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                fetch('/api/logout', { method: 'POST' })
                  .then(() => {
                    queryClient.setQueryData(['/api/auth/user'], null);
                    window.location.href = '/';
                  })
                  .catch(() => {
                    window.location.href = '/';
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
                {activeSection === "overview" && "Admin Overview"}
                {activeSection === "users" && "User Management"}
                {activeSection === "kingdoms" && "Kingdom Management"}
                {activeSection === "payments" && "Payment Requests"}
                {activeSection === "contributions" && "Land Contributions"}
                {activeSection === "analytics" && "Analytics Dashboard"}
                {activeSection === "settings" && "System Settings"}
              </h1>
              <p className="text-muted-foreground">
                {activeSection === "overview" && "Manage users, kingdoms, and payment requests"}
                {activeSection === "users" && "Review and approve user registrations"}
                {activeSection === "kingdoms" && "View and manage all registered kingdoms"}
                {activeSection === "payments" && "Process payment requests and payouts"}
                {activeSection === "contributions" && "Monitor land contribution data from League of Kingdoms"}
                {activeSection === "analytics" && "View detailed analytics and reporting"}
                {activeSection === "settings" && "Configure system settings and preferences"}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" data-testid="button-export-data">
                Export Data
              </Button>
              <Button className="gaming-gradient text-accent-foreground hover:opacity-90" data-testid="button-new-announcement">
                <i className="fas fa-plus mr-2"></i>
                New Announcement
              </Button>
            </div>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Overview Section */}
          {activeSection === "overview" && (
            <>
              {/* Admin Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Users"
                  value={(stats as any)?.totalUsers?.toString() || "0"}
                  icon="fas fa-users"
                  color="primary"
                />
                <StatCard
                  title="Total Kingdoms"
                  value={(stats as any)?.totalKingdoms?.toString() || "0"}
                  icon="fas fa-castle"
                  color="accent"
                />
                <StatCard
                  title="Pending Approvals"
                  value={(stats as any)?.pendingApprovals?.toString() || "0"}
                  icon="fas fa-clock"
                  color="destructive"
                />
                <StatCard
                  title="Total Payouts"
                  value={`$${(stats as any)?.totalPayouts || "0"}`}
                  icon="fas fa-money-bill-wave"
                  color="emerald"
                />
              </div>
            </>
          )}
          
          {/* User Management Section - Only show in overview and users sections */}
          {(activeSection === "overview" || activeSection === "users") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Approvals */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pending User Approvals</CardTitle>
                  <span className="bg-destructive/20 text-destructive px-2 py-1 rounded text-xs font-medium">
                    {pendingUsers.length} Pending
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {pendingUsers.map((pendingUser: any) => (
                    <div key={pendingUser.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-foreground">
                              {pendingUser.firstName?.charAt(0) || pendingUser.email?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {pendingUser.firstName ? `${pendingUser.firstName} ${pendingUser.lastName || ''}` : 'New User'}
                            </p>
                            <p className="text-sm text-muted-foreground">{pendingUser.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Registered {new Date(pendingUser.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => approveUserMutation.mutate(pendingUser.id)}
                            disabled={approveUserMutation.isPending}
                            data-testid={`button-approve-user-${pendingUser.id}`}
                          >
                            <i className="fas fa-check"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => rejectUserMutation.mutate(pendingUser.id)}
                            disabled={rejectUserMutation.isPending}
                            data-testid={`button-reject-user-${pendingUser.id}`}
                          >
                            <i className="fas fa-times"></i>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No pending user approvals
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Payment Approvals */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pending Payment Requests</CardTitle>
                  <span className="bg-accent/20 text-accent px-2 py-1 rounded text-xs font-medium">
                    {pendingPayments.length} Pending
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {pendingPayments.map((payment: any) => (
                    <div key={payment.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">User Payment Request</p>
                          <p className="text-sm text-muted-foreground">{payment.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Requested {new Date(payment.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-accent">${payment.amount}</p>
                          <div className="flex space-x-2 mt-2">
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => updatePaymentMutation.mutate({ 
                                id: payment.id, 
                                status: "approved" 
                              })}
                              disabled={updatePaymentMutation.isPending}
                              data-testid={`button-approve-payment-${payment.id}`}
                            >
                              <i className="fas fa-check"></i>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updatePaymentMutation.mutate({ 
                                id: payment.id, 
                                status: "rejected" 
                              })}
                              disabled={updatePaymentMutation.isPending}
                              data-testid={`button-reject-payment-${payment.id}`}
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingPayments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No pending payment requests
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          )}
          
          {/* Land Analytics Section - Only show in contributions section */}
          {activeSection === "contributions" && (
          <div className="space-y-6">
            <AdminLandDashboard />
          </div>
          )}

          {/* Other Sections */}
          {activeSection === "kingdoms" && (
            <Card>
              <CardHeader>
                <CardTitle>All Kingdoms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Kingdom management coming soon. This will show all registered kingdoms with their details.
                </p>
              </CardContent>
            </Card>
          )}

          {activeSection === "analytics" && (
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Advanced analytics dashboard coming soon. This will show detailed reports and charts.
                </p>
              </CardContent>
            </Card>
          )}

          {activeSection === "settings" && (
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  System configuration settings coming soon. This will allow configuration of application settings.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
