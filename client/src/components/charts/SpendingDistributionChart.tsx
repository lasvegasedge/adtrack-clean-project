import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface Campaign {
  id: number;
  name: string;
  adMethodId: number;
  adMethod?: {
    id: number;
    name: string;
  };
  amountSpent: number;
}

interface SpendingDistributionChartProps {
  campaigns: Campaign[];
}

const COLORS = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", 
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
];

export default function SpendingDistributionChart({ campaigns }: SpendingDistributionChartProps) {
  // Group spending by ad method
  const spendingByAdMethod = useMemo(() => {
    const adMethodMap = new Map<string, number>();
    
    campaigns.forEach(campaign => {
      const adMethodName = campaign.adMethod?.name || `Method ${campaign.adMethodId}`;
      const currentAmount = adMethodMap.get(adMethodName) || 0;
      adMethodMap.set(adMethodName, currentAmount + Number(campaign.amountSpent));
    });
    
    // Convert map to array and sort by amount (descending)
    const result = Array.from(adMethodMap.entries()).map(([name, value]) => ({
      name,
      value
    }));
    
    // Sort by value (spending amount) descending
    result.sort((a, b) => b.value - a.value);
    
    return result;
  }, [campaigns]);
  
  // If no data, show empty state
  if (spendingByAdMethod.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spending Distribution by Ad Method</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex items-center justify-center h-64">
          <p className="text-muted-foreground">No campaign spending data available</p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate total spending for percentage display
  const totalSpending = spendingByAdMethod.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Spending Distribution by Ad Method</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <PieChart>
              <Pie
                data={spendingByAdMethod}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {spendingByAdMethod.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Spending']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Spending Breakdown</h4>
          <div className="space-y-1">
            {spendingByAdMethod.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span>{item.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>{formatCurrency(item.value)}</span>
                  <span className="text-muted-foreground">
                    ({((item.value / totalSpending) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}