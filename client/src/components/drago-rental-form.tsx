import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Crown, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface DragoRentalFormProps {
  kingdoms: any[];
}

export default function DragoRentalForm({ kingdoms }: DragoRentalFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedKingdom, setSelectedKingdom] = useState("");
  const [selectedDrago, setSelectedDrago] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");

  const { data: paymentSettings } = useQuery<any>({
    queryKey: ["/api/admin/payment-settings"],
  });

  const { data: dragoRentalRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/drago-rental-requests"],
  });

  const createDragoRentalMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/drago-rental-requests", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Drago rental request submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/drago-rental-requests"] });
      setSelectedKingdom("");
      setSelectedDrago("");
      setSelectedDuration("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit drago rental request", variant: "destructive" });
    },
  });

  const getPointsRequired = (dragoType: string, duration: string): number | null => {
    if (!paymentSettings) return null;
    
    const key = `${dragoType}Drago${duration.charAt(0).toUpperCase() + duration.slice(1)}`;
    return paymentSettings[key] || null;
  };

  const handleSubmit = () => {
    if (!selectedKingdom || !selectedDrago || !selectedDuration) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    const pointsRequired = getPointsRequired(selectedDrago, selectedDuration);
    if (!pointsRequired) {
      toast({ title: "Error", description: "Points configuration not found for this drago type", variant: "destructive" });
      return;
    }

    const data = {
      kingdomId: selectedKingdom,
      dragoType: selectedDrago,
      duration: selectedDuration,
      pointsRequired
    };

    createDragoRentalMutation.mutate(data);
  };

  const getDragoColor = (type: string) => {
    switch (type) {
      case 'regular': return 'text-green-600';
      case 'legendary': return 'text-purple-600';
      case 'war': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (duration: string) => {
    switch (duration) {
      case '1Week': return '1 Week';
      case '2Weeks': return '2 Weeks';
      case '3Weeks': return '3 Weeks';
      case '1Month': return '1 Month';
      default: return duration;
    }
  };

  return (
    <Card data-testid="drago-rental-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          Drago Rental System
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Rent dragos using your contribution points instead of cash payouts
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Drago Rental Requests */}
        {dragoRentalRequests.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Drago Rental Requests</h3>
            <div className="space-y-3">
              {dragoRentalRequests.map((request: any) => (
                <div key={request.id} className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Crown className={`h-4 w-4 ${getDragoColor(request.dragoType)}`} />
                        <span className="font-medium capitalize">{request.dragoType} Drago</span>
                        <span className="text-sm text-muted-foreground">({formatDuration(request.duration)})</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Points: {request.pointsRequired} • Requested: {new Date(request.requestedAt).toLocaleDateString()}
                      </div>
                      {request.adminNotes && (
                        <div className="text-sm text-muted-foreground">
                          Admin Notes: {request.adminNotes}
                        </div>
                      )}
                      {request.rentalStartDate && request.rentalEndDate && (
                        <div className="text-sm text-muted-foreground">
                          Rental Period: {new Date(request.rentalStartDate).toLocaleDateString()} - {new Date(request.rentalEndDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Separator />
          </div>
        )}

        {/* New Rental Request Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Request New Drago Rental</h3>
          
          {paymentSettings && (paymentSettings.regularDrago1Week || paymentSettings.legendaryDrago1Week || paymentSettings.warDrago1Week) ? (
            <div className="space-y-4">
              {/* Kingdom Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Kingdom</label>
                <Select value={selectedKingdom} onValueChange={setSelectedKingdom}>
                  <SelectTrigger data-testid="select-kingdom">
                    <SelectValue placeholder="Choose a kingdom" />
                  </SelectTrigger>
                  <SelectContent>
                    {kingdoms.map((kingdom) => (
                      <SelectItem key={kingdom.id} value={kingdom.id}>
                        {kingdom.name} (Level {kingdom.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Drago Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Drago Type</label>
                <Select value={selectedDrago} onValueChange={setSelectedDrago}>
                  <SelectTrigger data-testid="select-drago-type">
                    <SelectValue placeholder="Choose drago type" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentSettings.regularDrago1Week && (
                      <SelectItem value="regular">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          Regular Drago
                        </div>
                      </SelectItem>
                    )}
                    {paymentSettings.legendaryDrago1Week && (
                      <SelectItem value="legendary">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          Legendary Drago
                        </div>
                      </SelectItem>
                    )}
                    {paymentSettings.warDrago1Week && (
                      <SelectItem value="war">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          War Drago
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration Selection */}
              {selectedDrago && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Duration</label>
                  <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                    <SelectTrigger data-testid="select-duration">
                      <SelectValue placeholder="Choose duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPointsRequired(selectedDrago, '1Week') && (
                        <SelectItem value="1Week">
                          1 Week ({getPointsRequired(selectedDrago, '1Week')} points)
                        </SelectItem>
                      )}
                      {getPointsRequired(selectedDrago, '2Weeks') && (
                        <SelectItem value="2Weeks">
                          2 Weeks ({getPointsRequired(selectedDrago, '2Weeks')} points)
                        </SelectItem>
                      )}
                      {getPointsRequired(selectedDrago, '3Weeks') && (
                        <SelectItem value="3Weeks">
                          3 Weeks ({getPointsRequired(selectedDrago, '3Weeks')} points)
                        </SelectItem>
                      )}
                      {getPointsRequired(selectedDrago, '1Month') && (
                        <SelectItem value="1Month">
                          1 Month ({getPointsRequired(selectedDrago, '1Month')} points)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!selectedKingdom || !selectedDrago || !selectedDuration || createDragoRentalMutation.isPending}
                className="w-full"
                data-testid="button-submit-rental"
              >
                {createDragoRentalMutation.isPending ? "Submitting..." : "Submit Rental Request"}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                Drago Rental Not Available
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Admin has not configured drago rental settings yet. Please contact support.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}