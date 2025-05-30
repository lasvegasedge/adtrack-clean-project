import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils';

interface ShareableAnalyticsCardProps {
  title: string;
  description?: string;
  roi: number;
  adSpend?: number;
  revenue?: number;
  businessName?: string;
  startDate?: string;
  endDate?: string;
}

export default function ShareableAnalyticsCard({
  title,
  description,
  roi,
  adSpend,
  revenue,
  businessName,
  startDate,
  endDate
}: ShareableAnalyticsCardProps) {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          {businessName && (
            <p className="text-sm text-muted-foreground">{businessName}</p>
          )}
          {startDate && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <CalendarIcon className="mr-1 h-3 w-3" />
              <span>
                {formatDate(new Date(startDate))} 
                {endDate ? ` - ${formatDate(new Date(endDate))}` : " - Present"}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex flex-col items-center">
            <span className="text-sm text-muted-foreground mb-1">ROI</span>
            <div className="flex items-center">
              <span className={`text-xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(roi)}
              </span>
              {roi >= 0 ? (
                <TrendingUp className="ml-1 h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="ml-1 h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
          
          {adSpend !== undefined && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex flex-col items-center">
              <span className="text-sm text-muted-foreground mb-1">Ad Spend</span>
              <span className="text-xl font-bold flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                {formatCurrency(adSpend).replace('$', '')}
              </span>
            </div>
          )}
          
          {revenue !== undefined && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex flex-col items-center">
              <span className="text-sm text-muted-foreground mb-1">Revenue</span>
              <span className="text-xl font-bold flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                {formatCurrency(revenue).replace('$', '')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="py-3 border-t flex items-center justify-center text-xs text-muted-foreground">
        Generated with ROI Tracker
      </CardFooter>
    </Card>
  );
}