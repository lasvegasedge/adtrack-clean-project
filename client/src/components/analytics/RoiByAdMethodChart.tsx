import { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { AdMethod, BusinessCampaignWithROI } from "@shared/schema";
import { useTheme } from "@/components/theme-provider";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface RoiByAdMethodChartProps {
  campaigns: BusinessCampaignWithROI[];
  adMethods: AdMethod[];
}

export function RoiByAdMethodChart({ campaigns, adMethods }: RoiByAdMethodChartProps) {
  const { theme } = useTheme();
  
  const data = useMemo(() => {
    // Group campaigns by ad method
    const adMethodPerformance: Record<number, {
      totalSpent: number;
      totalEarned: number;
      roi: number;
      campaignCount: number;
    }> = {};
    
    campaigns.forEach(campaign => {
      const adMethodId = campaign.adMethodId;
      
      if (!adMethodPerformance[adMethodId]) {
        adMethodPerformance[adMethodId] = {
          totalSpent: 0,
          totalEarned: 0,
          roi: 0,
          campaignCount: 0
        };
      }
      
      adMethodPerformance[adMethodId].totalSpent += parseFloat(campaign.amountSpent);
      adMethodPerformance[adMethodId].totalEarned += campaign.amountEarned 
        ? parseFloat(campaign.amountEarned) 
        : 0;
      adMethodPerformance[adMethodId].campaignCount += 1;
    });
    
    // Calculate ROI for each ad method
    return Object.entries(adMethodPerformance).map(([adMethodId, stats]) => {
      const adMethod = adMethods.find(m => m.id === parseInt(adMethodId)) || {
        id: parseInt(adMethodId),
        name: "Unknown"
      };
      
      const roi = stats.totalSpent > 0
        ? ((stats.totalEarned - stats.totalSpent) / stats.totalSpent) * 100
        : 0;
        
      return {
        adMethod,
        adMethodName: adMethod.name,
        roi,
        totalSpent: stats.totalSpent,
        totalEarned: stats.totalEarned,
        campaignCount: stats.campaignCount
      };
    }).sort((a, b) => b.roi - a.roi);
  }, [campaigns, adMethods]);
  
  const colors = [
    '#26a69a', '#42a5f5', '#7e57c2', '#ef5350', '#ff9800', 
    '#78909c', '#66bb6a', '#29b6f6', '#ab47bc', '#ec407a'
  ];
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover text-popover-foreground p-3 rounded-lg border shadow-sm">
          <p className="font-bold mb-1">{data.adMethodName}</p>
          <p className="text-sm">ROI: <span className="font-semibold">{formatPercent(data.roi)}</span></p>
          <p className="text-sm">Spent: <span className="font-semibold">{formatCurrency(data.totalSpent)}</span></p>
          <p className="text-sm">Earned: <span className="font-semibold">{formatCurrency(data.totalEarned)}</span></p>
          <p className="text-sm">Campaigns: <span className="font-semibold">{data.campaignCount}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%" aspect={2}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
        barSize={40}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="adMethodName" 
          angle={-45} 
          textAnchor="end" 
          height={70}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          tickFormatter={(value) => formatPercent(value, 0)}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          name="Return on Investment (ROI)" 
          dataKey="roi" 
          radius={[4, 4, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}