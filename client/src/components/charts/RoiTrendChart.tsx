import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts";
import { format, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Campaign {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  amountSpent: number;
  amountEarned: number | null;
  isActive: boolean;
  roi: number;
}

interface RoiTrendChartProps {
  campaigns: Campaign[];
}

const COLORS = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", 
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
];

export default function RoiTrendChart({ campaigns }: RoiTrendChartProps) {
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">("month");
  
  // Sort campaigns by start date
  const sortedCampaigns = useMemo(() => {
    return [...campaigns]
      .filter(c => !c.isActive && c.amountEarned !== null)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [campaigns]);
  
  // Prepare data for different time ranges
  const chartData = useMemo(() => {
    if (sortedCampaigns.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;
    
    // Calculate start date based on selected time range
    switch (timeRange) {
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case "quarter":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case "year":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }
    
    // Filter campaigns that ended within the selected time range
    return sortedCampaigns
      .filter(campaign => {
        const endDate = campaign.endDate ? new Date(campaign.endDate) : new Date();
        return endDate >= startDate;
      })
      .map(campaign => ({
        name: campaign.name,
        date: campaign.endDate || campaign.startDate,
        roi: campaign.roi,
        amountSpent: campaign.amountSpent,
        amountEarned: campaign.amountEarned || 0
      }));
  }, [sortedCampaigns, timeRange]);
  
  // No campaigns with ROI data
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ROI Trend Over Time</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex items-center justify-center h-64">
          <p className="text-muted-foreground">No completed campaigns with ROI data available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">ROI Trend Over Time</CardTitle>
          <Tabs 
            defaultValue="month" 
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as "month" | "quarter" | "year")}
            className="ml-auto"
          >
            <TabsList className="grid grid-cols-3 w-[240px]">
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(parseISO(date), 'MMM d')}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'ROI']}
                labelFormatter={(date) => format(parseISO(date as string), 'MMM d, yyyy')}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="roi" 
                stroke="#2563eb" 
                activeDot={{ r: 8 }} 
                strokeWidth={2}
                name="ROI (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}