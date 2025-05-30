import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShareableAnalyticsCard from '@/components/analytics/ShareableAnalyticsCard';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SharedReportData {
  campaign?: string;
  roi?: number;
  spend?: number;
  revenue?: number;
  business?: string;
  start?: string;
  end?: string;
  isValid: boolean;
}

export default function SharedReportPage() {
  const [location] = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SharedReportData>({ isValid: false });

  useEffect(() => {
    // Parse URL parameters to extract shared data
    const parseSharedData = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        
        const parsedData: SharedReportData = {
          campaign: params.get('campaign') || undefined,
          roi: params.get('roi') ? parseFloat(params.get('roi') as string) : undefined,
          spend: params.get('spend') ? parseFloat(params.get('spend') as string) : undefined,
          revenue: params.get('revenue') ? parseFloat(params.get('revenue') as string) : undefined,
          business: params.get('business') || undefined,
          start: params.get('start') || undefined,
          end: params.get('end') || undefined,
          isValid: false
        };
        
        // Validate that we have at least some data to display
        parsedData.isValid = !!(parsedData.campaign && parsedData.roi !== undefined);
        
        setData(parsedData);
      } catch (error) {
        console.error('Error parsing shared data:', error);
        setData({ isValid: false });
      } finally {
        setLoading(false);
      }
    };

    parseSharedData();
  }, [location]);

  const handleBackToApp = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading shared report...</p>
      </div>
    );
  }

  if (!data.isValid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Invalid or Expired Link</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <p className="mb-6 text-center">This shared report link is invalid or has expired.</p>
            <Button onClick={handleBackToApp}>
              Back to ROI Tracker
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
      <div className="w-full max-w-3xl">
        <Card className="shadow-lg border-t-4 border-primary mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl md:text-2xl text-center">Shared Marketing Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center mb-6">
              This is a shared marketing campaign performance report from ROI Tracker.
            </p>
            
            <ShareableAnalyticsCard
              title={data.campaign || "Marketing Campaign"}
              roi={data.roi || 0}
              adSpend={data.spend}
              revenue={data.revenue}
              businessName={data.business}
              startDate={data.start}
              endDate={data.end}
            />
            
            <div className="mt-8 flex justify-center">
              <Button onClick={handleBackToApp} variant="outline">
                Learn More About ROI Tracker
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center text-xs text-muted-foreground mt-4">
          &copy; {new Date().getFullYear()} ROI Tracker - Powerful marketing analytics for business owners
        </div>
      </div>
    </div>
  );
}