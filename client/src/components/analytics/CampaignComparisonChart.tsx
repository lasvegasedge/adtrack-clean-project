import { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell
} from "recharts";
import { BusinessCampaignWithROI, AdMethod } from "@shared/schema";
import { useTheme } from "@/components/theme-provider";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface CampaignComparisonChartProps {
  campaigns: BusinessCampaignWithROI[];
  adMethods: AdMethod[];
}

type ComparisonData = {
  name: string;
  roi: number;
  amountSpent: number;
  amountEarned: number;
  profit: number;
  adMethod: string | { id: number; name: string };
};

export function CampaignComparisonChart({ campaigns, adMethods }: CampaignComparisonChartProps) {
  const { theme } = useTheme();

  const processedData = useMemo<ComparisonData[]>(() => {
    return campaigns.map(campaign => {
      const profit = campaign.amountEarned ? 
        parseFloat(campaign.amountEarned) - parseFloat(campaign.amountSpent) : 
        -parseFloat(campaign.amountSpent);
      
      const adMethod = adMethods.find(method => method.id === campaign.adMethodId) || "Unknown";
      
      return {
        name: campaign.name,
        roi: campaign.roi,
        amountSpent: parseFloat(campaign.amountSpent),
        amountEarned: campaign.amountEarned ? parseFloat(campaign.amountEarned) : 0,
        profit,
        adMethod
      };
    }).sort((a, b) => b.roi - a.roi);
  }, [campaigns, adMethods]);

  // Display at most 10 campaigns, prioritizing the ones with highest ROI
  const displayData = useMemo(() => {
    if (processedData.length <= 10) return processedData;
    return processedData.slice(0, 10);
  }, [processedData]);

  const getColorByROI = (roi: number) => {
    if (roi >= 200) return '#4caf50'; // Dark green for excellent ROI
    if (roi >= 100) return '#8bc34a'; // Green for very good ROI
    if (roi >= 50) return '#cddc39'; // Light green for good ROI
    if (roi >= 0) return '#ffeb3b'; // Yellow for break-even or slight profit
    if (roi >= -50) return '#ff9800'; // Orange for moderate loss
    return '#f44336'; // Red for significant loss
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    // Access the screen size here to make tooltip responsive
    const { isSmallMobile } = screenSize;
    
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const adMethodName = typeof data.adMethod === 'string' ? 
        data.adMethod : data.adMethod.name;
        
      return (
        <div className="bg-popover text-popover-foreground p-2 rounded-lg border shadow-sm">
          <p className={`font-bold ${isSmallMobile ? 'text-xs' : 'text-sm'} mb-1`}>{data.name}</p>
          <div className={`grid ${isSmallMobile ? 'grid-cols-2 gap-x-3 gap-y-1' : 'space-y-1'}`}>
            <p className={isSmallMobile ? "text-xs" : "text-sm"}>
              ROI: <span className="font-semibold">{formatPercent(data.roi)}</span>
            </p>
            <p className={isSmallMobile ? "text-xs" : "text-sm"}>
              Spent: <span className="font-semibold">{formatCurrency(data.amountSpent)}</span>
            </p>
            <p className={isSmallMobile ? "text-xs" : "text-sm"}>
              Earned: <span className="font-semibold">{formatCurrency(data.amountEarned)}</span>
            </p>
            <p className={isSmallMobile ? "text-xs" : "text-sm"}>
              Profit: <span className={`font-semibold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.profit)}
              </span>
            </p>
            {!isSmallMobile && (
              <p className="text-sm">
                Ad Method: <span className="font-semibold">{adMethodName}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Responsive design with window resize handling
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    isMobile: window.innerWidth < 768,
    isSmallMobile: window.innerWidth < 480
  });
  
  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize({
        width,
        isMobile: width < 768,
        isSmallMobile: width < 480
      });
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Extract properties for cleaner code
  const { isMobile, isSmallMobile } = screenSize;
  
  // Only show a smaller subset of campaigns on very small screens
  const visibleData = useMemo(() => {
    if (isSmallMobile && displayData.length > 5) {
      return displayData.slice(0, 5);
    }
    return displayData;
  }, [displayData, isSmallMobile]);
  
  return (
    <ResponsiveContainer width="100%" height="100%" aspect={isSmallMobile ? 1.2 : isMobile ? 1.5 : 2}>
      <BarChart
        data={visibleData}
        layout="vertical"
        margin={isSmallMobile ? 
          { top: 5, right: 45, left: 60, bottom: 5 } : 
          isMobile ? 
          { top: 10, right: 50, left: 70, bottom: 10 } : 
          { top: 20, right: 30, left: 100, bottom: 10 }
        }
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          type="number" 
          tickFormatter={(value) => formatPercent(value, 0)}
          domain={['dataMin', 'dataMax']}
          tick={{ fontSize: isSmallMobile ? 9 : isMobile ? 10 : 12 }}
          tickCount={isSmallMobile ? 3 : isMobile ? 4 : 6}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          width={isSmallMobile ? 55 : isMobile ? 65 : 90}
          tick={{ fontSize: isSmallMobile ? 9 : isMobile ? 10 : 12 }}
          // Truncate long campaign names on mobile
          tickFormatter={(value) => {
            if (isSmallMobile && value.length > 8) {
              return value.substring(0, 7) + '...';
            } else if (isMobile && value.length > 12) {
              return value.substring(0, 11) + '...';
            }
            return value;
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: isSmallMobile ? 9 : isMobile ? 10 : 12 }}
          // On very small screens, place legend at bottom
          verticalAlign={isSmallMobile ? "bottom" : "top"}
        />
        <Bar 
          dataKey="roi" 
          name="ROI %" 
          radius={[0, 4, 4, 0]}
        >
          {visibleData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColorByROI(entry.roi)} />
          ))}
          <LabelList 
            dataKey="roi" 
            position="right" 
            formatter={(value: number) => formatPercent(value, 0)}
            style={{ 
              fontSize: isSmallMobile ? 9 : isMobile ? 10 : 12, 
              fill: '#333',
              fontWeight: 500
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}