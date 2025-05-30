import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import RoiTrendChart from "@/components/charts/RoiTrendChart";
import SpendingDistributionChart from "@/components/charts/SpendingDistributionChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface Campaign {
  id: number;
  name: string;
  roi: number;
  spent: number;
  earned: number;
  startDate: string;
  endDate: string;
  adMethod: string;
}

export default function DashboardCharts() {
  const { user } = useAuth();
  const businessId = user?.businessId;

  // Fetch campaigns with ROI data
  const { data, isLoading } = useQuery<Campaign[]>({
    queryKey: [`/api/business/${businessId}/campaigns/roi`],
    enabled: !!businessId,
  });
  
  // Ensure campaigns is always an array
  const campaigns = Array.isArray(data) ? data : [];

  if (isLoading) {
    return (
      <div className="my-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Campaign Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="my-6 p-8 bg-white rounded-xl shadow-sm text-center">
        <h2 className="text-xl font-semibold mb-2">Campaign Performance</h2>
        <p className="text-gray-500">
          No campaign data available yet. Start tracking your advertising efforts to see performance insights.
        </p>
      </div>
    );
  }

  return (
    <div className="my-6 space-y-4">
      <h2 className="text-xl font-semibold mb-4">Campaign Performance</h2>

      {/* Desktop: Side by Side Charts */}
      <div className="hidden md:grid md:grid-cols-2 gap-6">
        <RoiTrendChart campaigns={campaigns} />
        <SpendingDistributionChart campaigns={campaigns} />
      </div>

      {/* Mobile: Tabs for Charts */}
      <div className="block md:hidden">
        <Tabs defaultValue="roi" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="roi">ROI Trend</TabsTrigger>
            <TabsTrigger value="spending">Spending</TabsTrigger>
          </TabsList>
          <TabsContent value="roi" className="mt-4">
            <RoiTrendChart campaigns={campaigns} />
          </TabsContent>
          <TabsContent value="spending" className="mt-4">
            <SpendingDistributionChart campaigns={campaigns} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}