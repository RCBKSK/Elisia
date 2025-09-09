import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LandContribution {
  kingdomId: string;
  total: number;
  date: string;
}

interface ContributionResult {
  data: LandContribution[];
  from: string;
  to: string;
}

interface LandContributionsProps {
  isAdmin: boolean;
}

export default function LandContributions({ isAdmin }: LandContributionsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("currentWeek");
  const [customDays, setCustomDays] = useState("");

  const endpoint = isAdmin ? "/api/admin/land-contributions" : "/api/user/land-contributions";

  const { data: contributionsData, isLoading, error } = useQuery<ContributionResult>({
    queryKey: [endpoint, selectedPeriod, customDays],
    queryFn: async () => {
      let url = `${endpoint}?period=${selectedPeriod}`;
      if (selectedPeriod === 'customDays' && customDays) {
        url += `&customDays=${customDays}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch land contributions');
      }
      return response.json();
    },
    enabled: selectedPeriod !== 'customDays' || (selectedPeriod === 'customDays' && customDays !== ''),
  });

  // Aggregate contributions by kingdom ID for display
  const aggregatedContributions = contributionsData?.data.reduce((acc, contribution) => {
    const existing = acc.find(item => item.kingdomId === contribution.kingdomId);
    if (existing) {
      existing.total += contribution.total;
    } else {
      acc.push({ ...contribution });
    }
    return acc;
  }, [] as LandContribution[]) || [];

  // Sort by total contributions descending
  aggregatedContributions.sort((a, b) => b.total - a.total);

  const totalContributions = aggregatedContributions.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-chart-line text-accent"></i>
            <span>Land Contributions</span>
          </CardTitle>
          <div className="flex items-center space-x-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40" data-testid="select-period">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="currentWeek">Current Week</SelectItem>
                <SelectItem value="lastWeek">Last Week</SelectItem>
                <SelectItem value="last2Weeks">Last 2 Weeks</SelectItem>
                <SelectItem value="last3Weeks">Last 3 Weeks</SelectItem>
                <SelectItem value="currentMonth">Current Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="customDays">Custom Days</SelectItem>
              </SelectContent>
            </Select>
            {selectedPeriod === 'customDays' && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="customDays" className="text-sm">Days:</Label>
                <Input
                  id="customDays"
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-20"
                  placeholder="30"
                  data-testid="input-custom-days"
                />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              data-testid="button-refresh-contributions"
            >
              <i className="fas fa-refresh mr-2"></i>
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 gaming-gradient rounded-full flex items-center justify-center animate-pulse">
              <i className="fas fa-chart-line text-accent-foreground"></i>
            </div>
            <span className="ml-3 text-muted-foreground">Loading contributions...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <i className="fas fa-exclamation-triangle text-destructive text-2xl mb-2"></i>
            <p className="text-muted-foreground">Failed to load land contributions</p>
            <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          </div>
        )}

        {contributionsData && (
          <>
            {/* Period Summary */}
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Period Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    {contributionsData.from} to {contributionsData.to}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent">{totalContributions.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Contributions</p>
                </div>
              </div>
            </div>

            {/* Contributions List */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">
                {isAdmin ? "All Kingdom Contributions" : "Your Kingdom Contributions"}
              </h4>
              {aggregatedContributions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No contributions found for this period
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {aggregatedContributions.map((contribution, index) => (
                    <div
                      key={contribution.kingdomId}
                      className="py-3 flex items-center justify-between"
                      data-testid={`contribution-${contribution.kingdomId}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-accent">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Kingdom {contribution.kingdomId}</p>
                          <p className="text-xs text-muted-foreground">
                            Period: {contributionsData.from} - {contributionsData.to}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-accent">{contribution.total.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">contributions</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Contributors (Admin Only) */}
            {isAdmin && aggregatedContributions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-medium text-foreground mb-3">Top Contributing Kingdoms</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aggregatedContributions.slice(0, 3).map((contribution, index) => (
                    <div
                      key={contribution.kingdomId}
                      className="p-3 bg-accent/10 rounded-lg"
                      data-testid={`top-contributor-${index}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-accent">
                          {index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'} #{index + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">Kingdom</span>
                      </div>
                      <p className="font-bold text-foreground">ID: {contribution.kingdomId}</p>
                      <p className="text-sm text-accent font-semibold">
                        {contribution.total.toLocaleString()} contributions
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}