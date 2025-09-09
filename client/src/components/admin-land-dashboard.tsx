import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface LandContribution {
  kingdomId: string;
  total: number;
  name: string;
  continent: number;
  date: string;
  landId: string;
}

interface ContributionResult {
  data: LandContribution[];
  from: string;
  to: string;
}

interface LandStatsData {
  from: string;
  to: string;
  continentStats: Record<string, { total: number; kingdomCount: number }>;
  landStats: Record<string, { total: number; kingdomCount: number; continentCount: number }>;
  totalContributions: number;
  totalKingdoms: number;
}

const LAND_IDS = ['134378', '135682', '145933', '134152', '137752'];

export default function AdminLandDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("currentWeek");
  const [customDays, setCustomDays] = useState("");
  const [selectedContinent, setSelectedContinent] = useState("all");
  const [selectedLand, setSelectedLand] = useState("all");

  const { data: contributionsData, isLoading: contributionsLoading, error: contributionsError } = useQuery<ContributionResult>({
    queryKey: ["/api/admin/land-contributions", selectedPeriod, customDays, selectedContinent, selectedLand],
    queryFn: async () => {
      let url = `/api/admin/land-contributions?period=${selectedPeriod}`;
      if (selectedPeriod === 'customDays' && customDays) {
        url += `&customDays=${customDays}`;
      }
      if (selectedContinent !== 'all') {
        url += `&continent=${selectedContinent}`;
      }
      if (selectedLand !== 'all') {
        url += `&landId=${selectedLand}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch land contributions');
      }
      return response.json();
    },
    enabled: selectedPeriod !== 'customDays' || (selectedPeriod === 'customDays' && customDays !== ''),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<LandStatsData>({
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

  // Get unique continents and lands for filters
  const availableContinents = Array.from(new Set(contributionsData?.data.map(item => item.continent) || [])).sort((a, b) => a - b);

  // Aggregate contributions by kingdom
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

  const continentEntries = Object.entries(statsData?.continentStats || {}).sort((a, b) => b[1].total - a[1].total);
  const landEntries = Object.entries(statsData?.landStats || {}).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-globe text-accent"></i>
              <span>Elisia Land Program - Contribution Analytics</span>
            </CardTitle>
            <div className="flex items-center space-x-3 flex-wrap gap-2">
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
              
              <Select value={selectedContinent} onValueChange={setSelectedContinent}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Continent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Continents</SelectItem>
                  {availableContinents.map(continent => (
                    <SelectItem key={continent} value={continent.toString()}>
                      Continent {continent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedLand} onValueChange={setSelectedLand}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Land" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lands</SelectItem>
                  {LAND_IDS.map(landId => (
                    <SelectItem key={landId} value={landId}>
                      Land {landId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
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
      </Card>

      {/* Overall Summary */}
      {statsData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent">{statsData.totalContributions.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Contributions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{statsData.totalKingdoms}</p>
              <p className="text-sm text-muted-foreground">Active Kingdoms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-500">{landEntries.length}</p>
              <p className="text-sm text-muted-foreground">Lands Contributing</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{continentEntries.length}</p>
              <p className="text-sm text-muted-foreground">Continents Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-500">{LAND_IDS.length}</p>
              <p className="text-sm text-muted-foreground">Total Lands</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continent Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-map mr-2 text-orange-500"></i>
              By Continent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 gaming-gradient rounded-full flex items-center justify-center animate-pulse">
                  <i className="fas fa-map text-accent-foreground"></i>
                </div>
                <span className="ml-3 text-muted-foreground">Loading...</span>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Land Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-mountain mr-2 text-emerald-500"></i>
              By Land ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 gaming-gradient rounded-full flex items-center justify-center animate-pulse">
                  <i className="fas fa-mountain text-accent-foreground"></i>
                </div>
                <span className="ml-3 text-muted-foreground">Loading...</span>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Top Contributing Kingdoms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-crown mr-2 text-accent"></i>
              Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contributionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 gaming-gradient rounded-full flex items-center justify-center animate-pulse">
                  <i className="fas fa-crown text-accent-foreground"></i>
                </div>
                <span className="ml-3 text-muted-foreground">Loading...</span>
              </div>
            ) : contributionsError ? (
              <div className="text-center py-8">
                <i className="fas fa-exclamation-triangle text-destructive text-2xl mb-2"></i>
                <p className="text-muted-foreground">Failed to load contributions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aggregatedContributions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No contributions found for this period
                  </p>
                ) : (
                  aggregatedContributions.slice(0, 10).map((contribution, index) => (
                    <div
                      key={contribution.kingdomId}
                      className="p-3 border border-border rounded-lg"
                      data-testid={`contribution-${contribution.kingdomId}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-xs font-bold text-accent">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-foreground">{contribution.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Continent: {contribution.continent} • Land: {contribution.landId}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-accent">{contribution.total.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">contributions</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Period Summary */}
      {contributionsData && (
        <Card>
          <CardHeader>
            <CardTitle>Period Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">{totalContributions.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  Total contributions from {contributionsData.from} to {contributionsData.to}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{aggregatedContributions.length}</p>
                <p className="text-sm text-muted-foreground">Unique kingdoms contributing</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-500">
                  {aggregatedContributions.length > 0 ? Math.round(totalContributions / aggregatedContributions.length) : 0}
                </p>
                <p className="text-sm text-muted-foreground">Average contributions per kingdom</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}