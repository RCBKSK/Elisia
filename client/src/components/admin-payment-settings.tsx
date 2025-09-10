import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Settings, Clock, Banknote, Crown } from "lucide-react";

export default function AdminPaymentSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    payoutFor1000Points: "",
    payoutFor5000Points: "",
    payoutFor8000Points: "",
    payoutFor10000Points: "",
    minimumPayout: "",
    payoutFrequency: "monthly",
    // Regular Drago rental points
    regularDrago1Week: "",
    regularDrago2Weeks: "",
    regularDrago3Weeks: "",
    regularDrago1Month: "",
    // Legendary Drago rental points
    legendaryDrago1Week: "",
    legendaryDrago2Weeks: "",
    legendaryDrago3Weeks: "",
    legendaryDrago1Month: "",
    // War Drago rental points
    warDrago1Week: "",
    warDrago2Weeks: "",
    warDrago3Weeks: "",
    warDrago1Month: ""
  });

  const { data: currentSettings, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/payment-settings"],
  });

  const createSettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/payment-settings", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Payment settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-settings"] });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update payment settings", variant: "destructive" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PUT", `/api/admin/payment-settings/${id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Payment settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-settings"] });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update payment settings", variant: "destructive" });
    },
  });

  const handleEdit = () => {
    if (currentSettings) {
      setFormData({
        payoutFor1000Points: currentSettings.payoutFor1000Points || "",
        payoutFor5000Points: currentSettings.payoutFor5000Points || "",
        payoutFor8000Points: currentSettings.payoutFor8000Points || "",
        payoutFor10000Points: currentSettings.payoutFor10000Points || "",
        minimumPayout: currentSettings.minimumPayout || "",
        payoutFrequency: currentSettings.payoutFrequency || "monthly",
        // Regular Drago rental points
        regularDrago1Week: currentSettings.regularDrago1Week || "",
        regularDrago2Weeks: currentSettings.regularDrago2Weeks || "",
        regularDrago3Weeks: currentSettings.regularDrago3Weeks || "",
        regularDrago1Month: currentSettings.regularDrago1Month || "",
        // Legendary Drago rental points
        legendaryDrago1Week: currentSettings.legendaryDrago1Week || "",
        legendaryDrago2Weeks: currentSettings.legendaryDrago2Weeks || "",
        legendaryDrago3Weeks: currentSettings.legendaryDrago3Weeks || "",
        legendaryDrago1Month: currentSettings.legendaryDrago1Month || "",
        // War Drago rental points
        warDrago1Week: currentSettings.warDrago1Week || "",
        warDrago2Weeks: currentSettings.warDrago2Weeks || "",
        warDrago3Weeks: currentSettings.warDrago3Weeks || "",
        warDrago1Month: currentSettings.warDrago1Month || ""
      });
    } else {
      setFormData({
        payoutFor1000Points: "",
        payoutFor5000Points: "",
        payoutFor8000Points: "",
        payoutFor10000Points: "",
        minimumPayout: "10.00",
        payoutFrequency: "monthly",
        // Regular Drago rental points
        regularDrago1Week: "",
        regularDrago2Weeks: "",
        regularDrago3Weeks: "",
        regularDrago1Month: "",
        // Legendary Drago rental points
        legendaryDrago1Week: "",
        legendaryDrago2Weeks: "",
        legendaryDrago3Weeks: "",
        legendaryDrago1Month: "",
        // War Drago rental points
        warDrago1Week: "",
        warDrago2Weeks: "",
        warDrago3Weeks: "",
        warDrago1Month: ""
      });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    const data = {
      payoutFor1000Points: parseFloat(formData.payoutFor1000Points),
      payoutFor5000Points: parseFloat(formData.payoutFor5000Points),
      payoutFor8000Points: parseFloat(formData.payoutFor8000Points),
      payoutFor10000Points: parseFloat(formData.payoutFor10000Points),
      minimumPayout: parseFloat(formData.minimumPayout),
      payoutFrequency: formData.payoutFrequency,
      // Regular Drago rental points
      regularDrago1Week: formData.regularDrago1Week ? parseInt(formData.regularDrago1Week) : null,
      regularDrago2Weeks: formData.regularDrago2Weeks ? parseInt(formData.regularDrago2Weeks) : null,
      regularDrago3Weeks: formData.regularDrago3Weeks ? parseInt(formData.regularDrago3Weeks) : null,
      regularDrago1Month: formData.regularDrago1Month ? parseInt(formData.regularDrago1Month) : null,
      // Legendary Drago rental points
      legendaryDrago1Week: formData.legendaryDrago1Week ? parseInt(formData.legendaryDrago1Week) : null,
      legendaryDrago2Weeks: formData.legendaryDrago2Weeks ? parseInt(formData.legendaryDrago2Weeks) : null,
      legendaryDrago3Weeks: formData.legendaryDrago3Weeks ? parseInt(formData.legendaryDrago3Weeks) : null,
      legendaryDrago1Month: formData.legendaryDrago1Month ? parseInt(formData.legendaryDrago1Month) : null,
      // War Drago rental points
      warDrago1Week: formData.warDrago1Week ? parseInt(formData.warDrago1Week) : null,
      warDrago2Weeks: formData.warDrago2Weeks ? parseInt(formData.warDrago2Weeks) : null,
      warDrago3Weeks: formData.warDrago3Weeks ? parseInt(formData.warDrago3Weeks) : null,
      warDrago1Month: formData.warDrago1Month ? parseInt(formData.warDrago1Month) : null,
      isActive: true
    };

    if (currentSettings?.id) {
      updateSettingsMutation.mutate({ id: currentSettings.id, data });
    } else {
      createSettingsMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      payoutFor1000Points: "",
      payoutFor5000Points: "",
      payoutFor8000Points: "",
      payoutFor10000Points: "",
      minimumPayout: "",
      payoutFrequency: "monthly",
      // Regular Drago rental points
      regularDrago1Week: "",
      regularDrago2Weeks: "",
      regularDrago3Weeks: "",
      regularDrago1Month: "",
      // Legendary Drago rental points
      legendaryDrago1Week: "",
      legendaryDrago2Weeks: "",
      legendaryDrago3Weeks: "",
      legendaryDrago1Month: "",
      // War Drago rental points
      warDrago1Week: "",
      warDrago2Weeks: "",
      warDrago3Weeks: "",
      warDrago1Month: ""
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Payment Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading payment settings...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="admin-payment-settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Payment Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure payment amounts for different point achievement tiers
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isEditing ? (
          <>
            {currentSettings ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <h3 className="text-lg font-semibold mb-3">Point-Based Payment Tiers</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs font-medium">1,000 Points</p>
                          <p className="text-sm font-bold" data-testid="payout-1000-points">
                            ${parseFloat(currentSettings.payoutFor1000Points || "0").toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs font-medium">5,000 Points</p>
                          <p className="text-sm font-bold" data-testid="payout-5000-points">
                            ${parseFloat(currentSettings.payoutFor5000Points || "0").toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                        <DollarSign className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs font-medium">8,000 Points</p>
                          <p className="text-sm font-bold" data-testid="payout-8000-points">
                            ${parseFloat(currentSettings.payoutFor8000Points || "0").toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-xs font-medium">10,000 Points</p>
                          <p className="text-sm font-bold" data-testid="payout-10000-points">
                            ${parseFloat(currentSettings.payoutFor10000Points || "0").toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Banknote className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Minimum Payout</p>
                      <p className="text-lg font-bold" data-testid="minimum-payout">
                        ${parseFloat(currentSettings.minimumPayout || "0").toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Frequency</p>
                      <Badge variant="outline" data-testid="payout-frequency">
                        {currentSettings.payoutFrequency}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Drago Rental Display */}
                {(currentSettings.regularDrago1Week || currentSettings.legendaryDrago1Week || currentSettings.warDrago1Week) && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-600" />
                        <h3 className="text-lg font-semibold">Drago Rental Settings</h3>
                      </div>
                      
                      {/* Regular Drago Display */}
                      {(currentSettings.regularDrago1Week || currentSettings.regularDrago2Weeks || currentSettings.regularDrago3Weeks || currentSettings.regularDrago1Month) && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <h4 className="font-medium">Regular Drago</h4>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {currentSettings.regularDrago1Week && (
                              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                                <Crown className="h-3 w-3 text-green-600" />
                                <div>
                                  <p className="text-xs font-medium">1 Week</p>
                                  <p className="text-sm font-bold">{currentSettings.regularDrago1Week} points</p>
                                </div>
                              </div>
                            )}
                            {currentSettings.regularDrago2Weeks && (
                              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                                <Crown className="h-3 w-3 text-green-600" />
                                <div>
                                  <p className="text-xs font-medium">2 Weeks</p>
                                  <p className="text-sm font-bold">{currentSettings.regularDrago2Weeks} points</p>
                                </div>
                              </div>
                            )}
                            {currentSettings.regularDrago3Weeks && (
                              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                                <Crown className="h-3 w-3 text-green-600" />
                                <div>
                                  <p className="text-xs font-medium">3 Weeks</p>
                                  <p className="text-sm font-bold">{currentSettings.regularDrago3Weeks} points</p>
                                </div>
                              </div>
                            )}
                            {currentSettings.regularDrago1Month && (
                              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                                <Crown className="h-3 w-3 text-green-600" />
                                <div>
                                  <p className="text-xs font-medium">1 Month</p>
                                  <p className="text-sm font-bold">{currentSettings.regularDrago1Month} points</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Legendary Drago Display */}
                      {(currentSettings.legendaryDrago1Week || currentSettings.legendaryDrago2Weeks || currentSettings.legendaryDrago3Weeks || currentSettings.legendaryDrago1Month) && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <h4 className="font-medium">Legendary Drago</h4>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {currentSettings.legendaryDrago1Week && (
                              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                                <Crown className="h-3 w-3 text-purple-600" />
                                <div>
                                  <p className="text-xs font-medium">1 Week</p>
                                  <p className="text-sm font-bold">{currentSettings.legendaryDrago1Week} points</p>
                                </div>
                              </div>
                            )}
                            {currentSettings.legendaryDrago2Weeks && (
                              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                                <Crown className="h-3 w-3 text-purple-600" />
                                <div>
                                  <p className="text-xs font-medium">2 Weeks</p>
                                  <p className="text-sm font-bold">{currentSettings.legendaryDrago2Weeks} points</p>
                                </div>
                              </div>
                            )}
                            {currentSettings.legendaryDrago3Weeks && (
                              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                                <Crown className="h-3 w-3 text-purple-600" />
                                <div>
                                  <p className="text-xs font-medium">3 Weeks</p>
                                  <p className="text-sm font-bold">{currentSettings.legendaryDrago3Weeks} points</p>
                                </div>
                              </div>
                            )}
                            {currentSettings.legendaryDrago1Month && (
                              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                                <Crown className="h-3 w-3 text-purple-600" />
                                <div>
                                  <p className="text-xs font-medium">1 Month</p>
                                  <p className="text-sm font-bold">{currentSettings.legendaryDrago1Month} points</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* War Drago Display */}
                      {(currentSettings.warDrago1Week || currentSettings.warDrago2Weeks || currentSettings.warDrago3Weeks || currentSettings.warDrago1Month) && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <h4 className="font-medium">War Drago</h4>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {currentSettings.warDrago1Week && (
                              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                                <Crown className="h-3 w-3 text-red-600" />
                                <div>
                                  <p className="text-xs font-medium">1 Week</p>
                                  <p className="text-sm font-bold">{currentSettings.warDrago1Week} points</p>
                                </div>
                              </div>
                            )}
                            {currentSettings.warDrago2Weeks && (
                              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                                <Crown className="h-3 w-3 text-red-600" />
                                <div>
                                  <p className="text-xs font-medium">2 Weeks</p>
                                  <p className="text-sm font-bold">{currentSettings.warDrago2Weeks} points</p>
                                </div>
                              </div>
                            )}
                            {currentSettings.warDrago3Weeks && (
                              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                                <Crown className="h-3 w-3 text-red-600" />
                                <div>
                                  <p className="text-xs font-medium">3 Weeks</p>
                                  <p className="text-sm font-bold">{currentSettings.warDrago3Weeks} points</p>
                                </div>
                              </div>
                            )}
                            {currentSettings.warDrago1Month && (
                              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                                <Crown className="h-3 w-3 text-red-600" />
                                <div>
                                  <p className="text-xs font-medium">1 Month</p>
                                  <p className="text-sm font-bold">{currentSettings.warDrago1Month} points</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Last updated: {new Date(currentSettings.updatedAt).toLocaleDateString()}
                  </div>
                  <Button onClick={handleEdit} data-testid="button-edit-settings">
                    Edit Settings
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                  No payment settings configured
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Set up payment rates and rules for user payouts
                </p>
                <Button onClick={handleEdit} className="mt-4" data-testid="button-setup-settings">
                  Setup Payment Settings
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Point-Based Payment Tiers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payoutFor1000Points">Payment for 1,000 Points ($)</Label>
                  <Input
                    id="payoutFor1000Points"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="50.00"
                    value={formData.payoutFor1000Points}
                    onChange={(e) => setFormData(prev => ({ ...prev, payoutFor1000Points: e.target.value }))}
                    data-testid="input-1000-points"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payoutFor5000Points">Payment for 5,000 Points ($)</Label>
                  <Input
                    id="payoutFor5000Points"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="250.00"
                    value={formData.payoutFor5000Points}
                    onChange={(e) => setFormData(prev => ({ ...prev, payoutFor5000Points: e.target.value }))}
                    data-testid="input-5000-points"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payoutFor8000Points">Payment for 8,000 Points ($)</Label>
                  <Input
                    id="payoutFor8000Points"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="400.00"
                    value={formData.payoutFor8000Points}
                    onChange={(e) => setFormData(prev => ({ ...prev, payoutFor8000Points: e.target.value }))}
                    data-testid="input-8000-points"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payoutFor10000Points">Payment for 10,000 Points ($)</Label>
                  <Input
                    id="payoutFor10000Points"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="500.00"
                    value={formData.payoutFor10000Points}
                    onChange={(e) => setFormData(prev => ({ ...prev, payoutFor10000Points: e.target.value }))}
                    data-testid="input-10000-points"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumPayout">Minimum Payout Amount ($)</Label>
                <Input
                  id="minimumPayout"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="10.00"
                  value={formData.minimumPayout}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumPayout: e.target.value }))}
                  data-testid="input-minimum-payout"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum amount required for payout
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payoutFrequency">Payout Frequency</Label>
              <Select
                value={formData.payoutFrequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payoutFrequency: value }))}
              >
                <SelectTrigger data-testid="select-payout-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Drago Rental Settings */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold">Drago Rental Settings</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure points required for renting different types of dragos for various durations
              </p>
              
              {/* Regular Drago */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h4 className="font-medium">Regular Drago</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="regularDrago1Week">1 Week (Points)</Label>
                    <Input
                      id="regularDrago1Week"
                      type="number"
                      min="0"
                      placeholder="500"
                      value={formData.regularDrago1Week}
                      onChange={(e) => setFormData(prev => ({ ...prev, regularDrago1Week: e.target.value }))}
                      data-testid="input-regular-1week"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regularDrago2Weeks">2 Weeks (Points)</Label>
                    <Input
                      id="regularDrago2Weeks"
                      type="number"
                      min="0"
                      placeholder="900"
                      value={formData.regularDrago2Weeks}
                      onChange={(e) => setFormData(prev => ({ ...prev, regularDrago2Weeks: e.target.value }))}
                      data-testid="input-regular-2weeks"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regularDrago3Weeks">3 Weeks (Points)</Label>
                    <Input
                      id="regularDrago3Weeks"
                      type="number"
                      min="0"
                      placeholder="1200"
                      value={formData.regularDrago3Weeks}
                      onChange={(e) => setFormData(prev => ({ ...prev, regularDrago3Weeks: e.target.value }))}
                      data-testid="input-regular-3weeks"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regularDrago1Month">1 Month (Points)</Label>
                    <Input
                      id="regularDrago1Month"
                      type="number"
                      min="0"
                      placeholder="1500"
                      value={formData.regularDrago1Month}
                      onChange={(e) => setFormData(prev => ({ ...prev, regularDrago1Month: e.target.value }))}
                      data-testid="input-regular-1month"
                    />
                  </div>
                </div>
              </div>
              
              {/* Legendary Drago */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <h4 className="font-medium">Legendary Drago</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="legendaryDrago1Week">1 Week (Points)</Label>
                    <Input
                      id="legendaryDrago1Week"
                      type="number"
                      min="0"
                      placeholder="1000"
                      value={formData.legendaryDrago1Week}
                      onChange={(e) => setFormData(prev => ({ ...prev, legendaryDrago1Week: e.target.value }))}
                      data-testid="input-legendary-1week"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legendaryDrago2Weeks">2 Weeks (Points)</Label>
                    <Input
                      id="legendaryDrago2Weeks"
                      type="number"
                      min="0"
                      placeholder="1800"
                      value={formData.legendaryDrago2Weeks}
                      onChange={(e) => setFormData(prev => ({ ...prev, legendaryDrago2Weeks: e.target.value }))}
                      data-testid="input-legendary-2weeks"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legendaryDrago3Weeks">3 Weeks (Points)</Label>
                    <Input
                      id="legendaryDrago3Weeks"
                      type="number"
                      min="0"
                      placeholder="2500"
                      value={formData.legendaryDrago3Weeks}
                      onChange={(e) => setFormData(prev => ({ ...prev, legendaryDrago3Weeks: e.target.value }))}
                      data-testid="input-legendary-3weeks"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legendaryDrago1Month">1 Month (Points)</Label>
                    <Input
                      id="legendaryDrago1Month"
                      type="number"
                      min="0"
                      placeholder="3000"
                      value={formData.legendaryDrago1Month}
                      onChange={(e) => setFormData(prev => ({ ...prev, legendaryDrago1Month: e.target.value }))}
                      data-testid="input-legendary-1month"
                    />
                  </div>
                </div>
              </div>
              
              {/* War Drago */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <h4 className="font-medium">War Drago</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="warDrago1Week">1 Week (Points)</Label>
                    <Input
                      id="warDrago1Week"
                      type="number"
                      min="0"
                      placeholder="2000"
                      value={formData.warDrago1Week}
                      onChange={(e) => setFormData(prev => ({ ...prev, warDrago1Week: e.target.value }))}
                      data-testid="input-war-1week"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warDrago2Weeks">2 Weeks (Points)</Label>
                    <Input
                      id="warDrago2Weeks"
                      type="number"
                      min="0"
                      placeholder="3500"
                      value={formData.warDrago2Weeks}
                      onChange={(e) => setFormData(prev => ({ ...prev, warDrago2Weeks: e.target.value }))}
                      data-testid="input-war-2weeks"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warDrago3Weeks">3 Weeks (Points)</Label>
                    <Input
                      id="warDrago3Weeks"
                      type="number"
                      min="0"
                      placeholder="5000"
                      value={formData.warDrago3Weeks}
                      onChange={(e) => setFormData(prev => ({ ...prev, warDrago3Weeks: e.target.value }))}
                      data-testid="input-war-3weeks"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warDrago1Month">1 Month (Points)</Label>
                    <Input
                      id="warDrago1Month"
                      type="number"
                      min="0"
                      placeholder="6000"
                      value={formData.warDrago1Month}
                      onChange={(e) => setFormData(prev => ({ ...prev, warDrago1Month: e.target.value }))}
                      data-testid="input-war-1month"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.payoutFor1000Points || !formData.minimumPayout || createSettingsMutation.isPending || updateSettingsMutation.isPending}
                data-testid="button-save-settings"
              >
                {createSettingsMutation.isPending || updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}