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
import { DollarSign, Settings, Clock, Banknote } from "lucide-react";

export default function AdminPaymentSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    payoutRatePerPoint: "",
    minimumPayout: "",
    payoutFrequency: "monthly"
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
        payoutRatePerPoint: currentSettings.payoutRatePerPoint || "",
        minimumPayout: currentSettings.minimumPayout || "",
        payoutFrequency: currentSettings.payoutFrequency || "monthly"
      });
    } else {
      setFormData({
        payoutRatePerPoint: "",
        minimumPayout: "10.00",
        payoutFrequency: "monthly"
      });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    const data = {
      payoutRatePerPoint: parseFloat(formData.payoutRatePerPoint),
      minimumPayout: parseFloat(formData.minimumPayout),
      payoutFrequency: formData.payoutFrequency,
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
      payoutRatePerPoint: "",
      minimumPayout: "",
      payoutFrequency: "monthly"
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
          Configure how much users get paid for their contribution points
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isEditing ? (
          <>
            {currentSettings ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Rate per Point</p>
                      <p className="text-lg font-bold" data-testid="rate-per-point">
                        ${parseFloat(currentSettings.payoutRatePerPoint || "0").toFixed(4)}
                      </p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payoutRatePerPoint">Rate per Contribution Point ($)</Label>
                <Input
                  id="payoutRatePerPoint"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0.0500"
                  value={formData.payoutRatePerPoint}
                  onChange={(e) => setFormData(prev => ({ ...prev, payoutRatePerPoint: e.target.value }))}
                  data-testid="input-rate-per-point"
                />
                <p className="text-xs text-muted-foreground">
                  Amount in USD paid per contribution point
                </p>
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
                disabled={!formData.payoutRatePerPoint || !formData.minimumPayout || createSettingsMutation.isPending || updateSettingsMutation.isPending}
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