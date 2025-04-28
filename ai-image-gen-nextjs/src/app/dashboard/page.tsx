// No "use client" here - this is a Server Component
import { supabase } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardCharts } from "@/components/dashboard/charts"; // Import the new client component

// Helper function to process fetched data into chart format
function processUsageData(data: { provider: string | null; model: string | null }[] | null, key: 'provider' | 'model'): { name: string; generations: number }[] {
    if (!data) return [];

    const counts: { [key: string]: number } = {};
    data.forEach(item => {
        const value = item[key];
        if (value) { // Only count if value is not null
            counts[value] = (counts[value] || 0) + 1;
        }
    });

    // Map to the format expected by the chart
    return Object.entries(counts)
        .map(([name, generations]) => ({ name, generations }))
        .sort((a, b) => b.generations - a.generations); // Sort descending
}

// Placeholder cost data (can be passed down or fetched differently later)
const costData = [
  { name: 'Week 1', cost: 0.15 },
  { name: 'Week 2', cost: 0.30 },
  { name: 'Week 3', cost: 0.20 },
  { name: 'Week 4', cost: 0.10 },
];

export default async function DashboardPage() {

  // Fetch data from Supabase (this runs on the server)
  console.log("Dashboard: Fetching usage data from Supabase...");
  const { data: usageStatsData, error: usageStatsError } = await supabase
    .from('images')
    .select('provider, model');

  if (usageStatsError) {
      console.error("Dashboard: Error fetching usage stats:", usageStatsError);
  }

  // Process the fetched data (still on the server)
  const providerUsageData = processUsageData(usageStatsData, 'provider');
  const modelUsageData = processUsageData(usageStatsData, 'model');

  // Fetch/calculate database counts (still on server)
  const promptCount = 25; // Placeholder
  const imageCount = usageStatsData?.length ?? 0;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {usageStatsError && (
           <Card className="bg-destructive/10 border-destructive">
              <CardHeader>
                  <CardTitle className="text-destructive">Error Loading Usage Stats</CardTitle>
              </CardHeader>
              <CardContent>
                 <p>{usageStatsError.message}</p>
              </CardContent>
           </Card>
       )}

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        {/* Card: Provider Usage Chart */}
        <Card className="lg:col-span-1 xl:col-span-1">
          <CardHeader>
            <CardTitle>Provider Usage</CardTitle>
            <CardDescription>Generations per provider.</CardDescription>
          </CardHeader>
          <CardContent>
             <DashboardCharts
                providerUsageData={providerUsageData}
                modelUsageData={[]}
                costData={[]}
             />
          </CardContent>
        </Card>

        {/* Card: Model Usage Chart */}
        <Card className="lg:col-span-1 xl:col-span-1">
          <CardHeader>
            <CardTitle>Model Usage</CardTitle>
            <CardDescription>Generations per model.</CardDescription>
          </CardHeader>
           <CardContent>
             <DashboardCharts
                providerUsageData={[]}
                modelUsageData={modelUsageData}
                costData={[]}
              />
           </CardContent>
        </Card>

         {/* Card: Cost Tracking Chart/Summary */}
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Cost Tracking</CardTitle>
            <CardDescription>Estimated spending ($)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-2xl font-bold">$?.??</p>
             <p className="text-xs text-muted-foreground">Cost calculation not implemented</p>
              <DashboardCharts
                  providerUsageData={[]}
                  modelUsageData={[]}
                  costData={costData}
               />
             <p className="pt-2 text-xs text-muted-foreground">Requires logging generation details and associating costs.</p>
          </CardContent>
        </Card>

         {/* Placeholder Card: Database Counts - Updated with real image count */}
        <Card>
          <CardHeader>
            <CardTitle>Database Overview</CardTitle>
            <CardDescription>Counts from your saved items.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
             <div className="flex justify-between text-sm">
                <span>Saved Prompts:</span>
                <span className="font-medium">{promptCount}</span>
            </div>
             <div className="flex justify-between text-sm">
                <span>Saved Images:</span>
                <span className="font-medium">{imageCount}</span>
            </div>
             <p className="pt-4 text-xs text-muted-foreground">
                 (Prompt count requires DB query)
            </p>
          </CardContent>
        </Card>

         {/* Placeholder Card: Recent Activity */}
         <Card className="md:col-span-2 lg:col-span-1 xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest generations.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground text-center">Recent activity table/list coming soon...</p>
          </CardContent>
        </Card>

      </div>
    </main>
  );
} 