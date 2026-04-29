import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { MapPin, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DestinationStat {
  destination: string;
  click_count: number;
  unique_users: number;
}

interface OriginCountryData {
  country: string;
  clicks: number;
  percentage: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

export default function DestinationAnalytics() {
  const [timeRange, setTimeRange] = useState<string>('30');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [destinationStats, setDestinationStats] = useState<DestinationStat[]>([]);
  const [originCountries, setOriginCountries] = useState<OriginCountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, selectedCountry]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch destination stats using the database function
      const { data: stats, error: statsError } = await supabase.rpc('get_destination_stats', {
        origin_country: selectedCountry === 'all' ? null : selectedCountry,
        days_back: parseInt(timeRange)
      });

      if (statsError) throw statsError;

      setDestinationStats(stats || []);

      // Calculate totals
      const clicks = stats?.reduce((sum, s) => sum + Number(s.click_count), 0) || 0;
      const users = new Set(stats?.map(s => s.unique_users)).size || 0;
      setTotalClicks(clicks);
      setTotalUsers(users);

      // Fetch origin country distribution
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      const { data: analytics, error: analyticsError } = await supabase
        .from('destination_analytics')
        .select('user_country')
        .gte('clicked_at', daysAgo.toISOString());

      if (analyticsError) throw analyticsError;

      // Count by origin country
      const countryCounts = (analytics || []).reduce((acc, row) => {
        acc[row.user_country] = (acc[row.user_country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = Object.values(countryCounts).reduce((sum, count) => sum + count, 0);
      const countryData = Object.entries(countryCounts)
        .map(([country, clicks]) => ({
          country,
          clicks,
          percentage: (clicks / total) * 100
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);

      setOriginCountries(countryData);
    } catch (error) {
      console.error('Error fetching destination analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const topDestinations = destinationStats.slice(0, 10);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Destination Analytics</h2>
          <p className="text-muted-foreground">Track which destinations users are interested in</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              <SelectItem value="TH">Thailand</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CN">China</SelectItem>
              <SelectItem value="JP">Japan</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
              <SelectItem value="DEFAULT">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Destination card clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Individual visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Clicks/User</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUsers > 0 ? (totalClicks / totalUsers).toFixed(1) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Engagement rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* No Data Alert */}
      {destinationStats.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No destination click data available for the selected time range and filters.
          </AlertDescription>
        </Alert>
      )}

      {/* Charts Grid */}
      {destinationStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Destinations Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Destinations</CardTitle>
              <CardDescription>Most clicked destinations by users</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topDestinations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="destination" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="click_count" fill="hsl(var(--primary))" name="Total Clicks" />
                  <Bar dataKey="unique_users" fill="hsl(var(--secondary))" name="Unique Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Origin Country Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic by Origin Country</CardTitle>
              <CardDescription>Where your users are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={originCountries}
                    dataKey="clicks"
                    nameKey="country"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.country}: ${entry.percentage.toFixed(1)}%`}
                  >
                    {originCountries.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Stats Table */}
      {destinationStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Statistics</CardTitle>
            <CardDescription>All destination click data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Rank</th>
                    <th className="text-left py-3 px-4 font-medium">Destination</th>
                    <th className="text-right py-3 px-4 font-medium">Total Clicks</th>
                    <th className="text-right py-3 px-4 font-medium">Unique Users</th>
                    <th className="text-right py-3 px-4 font-medium">Clicks/User</th>
                  </tr>
                </thead>
                <tbody>
                  {destinationStats.map((stat, index) => (
                    <tr key={stat.destination} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <Badge variant={index < 3 ? 'default' : 'secondary'}>
                          #{index + 1}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium">{stat.destination}</td>
                      <td className="py-3 px-4 text-right">{Number(stat.click_count).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{Number(stat.unique_users).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        {(Number(stat.click_count) / Number(stat.unique_users)).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
