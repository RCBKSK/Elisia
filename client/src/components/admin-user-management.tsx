import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Users, Trash2, Shield, Castle, Wallet, Search, Calendar, Crown, CheckCircle, XCircle } from "lucide-react";

export default function AdminUserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allUsers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/all-users"],
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/admin/delete-user/${userId}`),
    onSuccess: () => {
      toast({ title: "Success", description: "User deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    },
  });

  const filteredUsers = allUsers.filter(userItem => {
    if (!searchQuery) return true;
    const user = userItem.user;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      userItem.kingdoms?.some((kingdom: any) => 
        kingdom.name?.toLowerCase().includes(searchLower) ||
        kingdom.lokKingdomId?.includes(searchQuery)
      )
    );
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading users...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="admin-user-management">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          All Registered Users
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage all users in the system with their kingdoms and wallet details
        </p>
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users, kingdoms, or land IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="search-users"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Total Users: {allUsers.length}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
              {searchQuery ? "No users found" : "No users registered"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery ? "Try adjusting your search terms" : "Users will appear here once they register"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((userItem: any) => {
              const user = userItem.user;
              const kingdoms = userItem.kingdoms || [];
              const wallets = userItem.wallets || [];
              
              return (
                <Card key={user.id} className="border-l-4 border-l-primary/20" data-testid={`user-card-${user.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* User Avatar */}
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-foreground">
                            {user.firstName?.charAt(0) || user.username?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </span>
                        </div>

                        {/* User Details */}
                        <div className="flex-1 space-y-3">
                          {/* Basic Info */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-foreground">
                                {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username}
                              </h3>
                              {user.isAdmin && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  Admin
                                </Badge>
                              )}
                              {user.isApproved ? (
                                <Badge variant="default" className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Approved
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>📧 {user.email}</p>
                              <p>👤 Username: {user.username}</p>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* Kingdoms */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Castle className="h-4 w-4 text-orange-600" />
                              <span className="font-medium">Kingdoms ({kingdoms.length})</span>
                            </div>
                            {kingdoms.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {kingdoms.map((kingdom: any) => (
                                  <div key={kingdom.id} className="p-3 bg-muted rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium text-sm">{kingdom.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Land ID: {kingdom.lokKingdomId || 'N/A'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="outline" className="text-xs">
                                            Level {kingdom.level}
                                          </Badge>
                                          <Badge variant={kingdom.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                            {kingdom.status}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="flex items-center gap-1">
                                          <Crown className="h-3 w-3 text-yellow-600" />
                                          <span className="text-xs font-medium">
                                            ${parseFloat(kingdom.totalContributions || '0').toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No kingdoms registered</p>
                            )}
                          </div>

                          <Separator />

                          {/* Wallets */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Wallet className="h-4 w-4 text-green-600" />
                              <span className="font-medium">Wallets ({wallets.length})</span>
                            </div>
                            {wallets.length > 0 ? (
                              <div className="space-y-2">
                                {wallets.map((wallet: any) => (
                                  <div key={wallet.id} className="p-2 bg-muted rounded">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-mono">
                                        {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                                      </span>
                                      <div className="flex gap-1">
                                        {wallet.isPrimary && (
                                          <Badge variant="default" className="text-xs">Primary</Badge>
                                        )}
                                        <Badge variant={wallet.isActive ? 'default' : 'secondary'} className="text-xs">
                                          {wallet.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No wallets added</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="ml-4">
                        {!user.isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex items-center gap-2"
                                data-testid={`button-delete-user-${user.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete User
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this user? This will permanently remove:
                                  <ul className="mt-2 list-disc list-inside text-sm">
                                    <li>User account and profile</li>
                                    <li>All associated kingdoms ({kingdoms.length})</li>
                                    <li>All wallet addresses ({wallets.length})</li>
                                    <li>All contributions and payment history</li>
                                  </ul>
                                  <p className="mt-2 font-semibold text-destructive">This action cannot be undone.</p>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  disabled={deleteUserMutation.isPending}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {user.isAdmin && (
                          <Badge variant="destructive" className="cursor-not-allowed">
                            Admin - Cannot Delete
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}