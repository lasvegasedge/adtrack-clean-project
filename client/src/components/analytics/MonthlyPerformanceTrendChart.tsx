import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { BusinessCampaignWithROI } from "@shared/schema";
import { useTheme } from "@/components/theme-provider";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface MonthlyPerformanceTrendChartProps {
  campaigns: BusinessCampaignWithROI[];
}

export function MonthlyPerformanceTrendChart({ campaigns }: MonthlyPerformanceTrendChartProps) {
  const { theme } = useTheme();
  
  const data = useMemo(() => {
    // First, sort campaigns by start date
    const sortedCampaigns = [...campaigns].sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
    
    // Group campaigns by month
    const monthlyData: Record<string, {
      month: string;
      displayMonth: string;
      totalSpent: number;
      totalEarned: number;
      roi: number;
      campaigns: BusinessCampaignWithROI[];
    }> = {};
    
    sortedCampaigns.forEach(campaign => {
      const startDate = new Date(campaign.startDate);
      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      const displayMonth = startDate.toLocaleString('default', { month: 'short' }) + ' ' + startDate.getFullYear();
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          displayMonth,
          totalSpent: 0,
          totalEarned: 0,
          roi: 0,
          campaigns: []
        };
      }
      
      monthlyData[monthKey].totalSpent += parseFloat(campaign.amountSpent);
      monthlyData[monthKey].totalEarned += campaign.amountEarned 
        ? parseFloat(campaign.amountEarned) 
        : 0;
      monthlyData[monthKey].campaigns.push(campaign);
    });
    
    // Calculate ROI for each month
    return Object.values(monthlyData).map(month => {
      const roi = month.totalSpent > 0
        ? ((month.totalEarned - month.totalSpent) / month.totalSpent) * 100
        : 0;
        
      return {
        ...month,
        roi
      };
    });
  }, [campaigns]);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const monthData = payload[0].payload;
      return (
        <div className="bg-popover text-popover-foreground p-3 rounded-lg border shadow-sm">
          <p className="font-bold mb-1">{monthData.displayMonth}</p>
          <p className="text-sm">ROI: <span className="font-semibold">{formatPercent(monthData.roi)}</span></p>
          <p className="text-sm">Spent: <span className="font-semibold">{formatCurrency(monthData.totalSpent)}</span></p>
          <p className="text-sm">Earned: <span className="font-semibold">{formatCurrency(monthData.totalEarned)}</span></p>
          <p className="text-sm">Campaigns: <span className="font-semibold">{monthData.campaigns.length}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%" aspect={2}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="displayMonth" 
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          tickFormatter={(value) => formatPercent(value, 0)}
          tick={{ fontSize: 12 }}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
        <Line
          type="monotone"
          name="ROI %"
          dataKey="roi"
          stroke="#8884d8"
          strokeWidth={2}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}