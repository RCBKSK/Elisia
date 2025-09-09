import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Clock, TrendingUp, AlertCircle } from "lucide-react";

export default function UserPayoutSummary() {
  const { data: payoutData, isLoading } = useQuery<any>({
    queryKey: ["/api/user/payout-summary"],
  });

  const { data: paymentSettings } = useQuery<any>({
    queryKey: ["/api/admin/payment-settings"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payout Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading payout information...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = payoutData?.summary;
  const unpaidAmount = payoutData?.unpaidAmount || 0;
  const unpaidContributions = payoutData?.unpaidContributions || [];
  const ratePerPoint = paymentSettings?.payoutRatePerPoint ? parseFloat(paymentSettings.payoutRatePerPoint) : 0;
  const minimumPayout = paymentSettings?.minimumPayout ? parseFloat(paymentSettings.minimumPayout) : 10;

  const estimatedEarnings = unpaidAmount * ratePerPoint;
  const canRequestPayout = estimatedEarnings >= minimumPayout;

  return (
    <div className="space-y-6">
      <Card data-testid="user-payout-summary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payout Summary
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track your earnings and payout history
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Total Earned</span>
              </div>
              <p className="text-2xl font-bold" data-testid="text-total-earned">
                ${parseFloat(summary?.totalEarned || "0").toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Paid</span>
              </div>
              <p className="text-2xl font-bold" data-testid="text-total-paid">
                ${parseFloat(summary?.totalPaid || "0").toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Pending Amount</span>
              </div>
              <p className="text-2xl font-bold" data-testid="text-pending-amount">
                ${estimatedEarnings.toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Last Payout</span>
              </div>
              <p className="text-sm font-medium" data-testid="text-last-payout">
                {summary?.lastPayoutDate 
                  ? new Date(summary.lastPayoutDate).toLocaleDateString()
                  : "Never"
                }
              </p>
            </div>
          </div>

          <Separator />

          {paymentSettings && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Rate per Point:</span>
                  <span className="ml-2 font-medium" data-testid="text-rate-per-point">
                    ${ratePerPoint.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Minimum Payout:</span>
                  <span className="ml-2 font-medium" data-testid="text-minimum-payout">
                    ${minimumPayout.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Frequency:</span>
                  <Badge variant="outline" className="ml-2" data-testid="badge-payout-frequency">
                    {paymentSettings.payoutFrequency}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {unpaidContributions.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Unpaid Contributions</h3>
                  <Badge variant={canRequestPayout ? "default" : "secondary"} data-testid="badge-payout-status">
                    {canRequestPayout ? "Ready for Payout" : "Below Minimum"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Contribution Points:</span>
                    <span className="font-medium" data-testid="text-unpaid-points">
                      {unpaidAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Earnings:</span>
                    <span className="font-medium" data-testid="text-estimated-earnings">
                      ${estimatedEarnings.toFixed(2)}
                    </span>
                  </div>
                  {!canRequestPayout && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Need additional:</span>
                      <span data-testid="text-additional-needed">
                        ${(minimumPayout - estimatedEarnings).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {unpaidContributions.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                No unpaid contributions
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your contributions will appear here once they're recorded
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}