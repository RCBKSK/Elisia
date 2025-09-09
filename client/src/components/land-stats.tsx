import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LandStatsData {
  from: string;
  to: string;
  continentStats: Record<string, { total: number; kingdomCount: number }>;
  landStats: Record<string, { total: number; kingdomCount: number; continentCount: number }>;
  totalContributions: number;
  totalKingdoms: number;
}

export default function LandStats() {
  const [selectedPeriod, setSelectedPeriod] = useState("currentWeek");
  const [customDays, setCustomDays] = useState("");

  const { data: statsData, isLoading, error } = useQuery<LandStatsData>({
    queryKey: ["/api/admin/land-stats", selectedPeriod, customDays],
    queryFn: async () => {
      let url = `/api/admin/land-stats?period=${selectedPeriod}`;
      if (selectedPeriod === 'customDays' && customDays) {
        url += `&customDays=${customDays}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch land stats');
      }
      return response.json();
    },
    enabled: selectedPeriod !== 'customDays' || (selectedPeriod === 'customDays' && customDays !== ''),
  });

  const continentEntries = Object.entries(statsData?.continentStats || {}).sort((a, b) => b[1].total - a[1].total);
  const landEntries = Object.entries(statsData?.landStats || {}).sort((a, b) => b[1].total - a[1].total);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-globe text-accent"></i>
            <span>Land & Continent Statistics</span>
          </CardTitle>
          <div className="flex items-center space-x-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
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
                />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 gaming-gradient rounded-full flex items-center justify-center animate-pulse">
              <i className="fas fa-globe text-accent-foreground"></i>
            </div>
            <span className="ml-3 text-muted-foreground">Loading statistics...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <i className="fas fa-exclamation-triangle text-destructive text-2xl mb-2"></i>
            <p className="text-muted-foreground">Failed to load land statistics</p>
          </div>
        )}

        {statsData && (
          <>
            {/* Overall Summary */}
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">{statsData.totalContributions.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Contributions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{statsData.totalKingdoms}</p>
                  <p className="text-sm text-muted-foreground">Active Kingdoms</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-500">{landEntries.length}</p>
                  <p className="text-sm text-muted-foreground">Lands Contributing</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{continentEntries.length}</p>
                  <p className="text-sm text-muted-foreground">Continents Active</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Continent Stats */}
              <div>
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <i className="fas fa-map mr-2 text-orange-500"></i>
                  By Continent
                </h4>
                <div className="space-y-3">
                  {continentEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No continent data</p>
                  ) : (
                    continentEntries.map(([continent, stats], index) => (
                      <div key={continent} className="p-3 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center text-xs font-bold text-orange-500">
                              {index + 1}
                            </span>
                            <span className="font-medium">Continent {continent}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{stats.kingdomCount} kingdoms</span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-accent">{stats.total.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">contributions</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Land Stats */}
              <div>
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <i className="fas fa-mountain mr-2 text-emerald-500"></i>
                  By Land ID
                </h4>
                <div className="space-y-3">
                  {landEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No land data</p>
                  ) : (
                    landEntries.map(([landId, stats], index) => (
                      <div key={landId} className="p-3 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs font-bold text-emerald-500">
                              {index + 1}
                            </span>
                            <span className="font-medium">Land {landId}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stats.kingdomCount} kingdoms • {stats.continentCount} continents
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-accent">{stats.total.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">contributions</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}