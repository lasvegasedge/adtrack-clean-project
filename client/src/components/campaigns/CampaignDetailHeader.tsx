import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, DollarSign, LineChart, BarChart4 } from 'lucide-react';
import SocialMediaShare from '../share/SocialMediaShare';

interface CampaignDetailProps {
  campaign: {
    id: number;
    name: string;
    budget: number;
    revenue: number;
    roi: number;
    status: string;
    startDate: string;
    endDate: string;
    adMethodId: number;
    adMethodName?: string;
    description?: string;
    businessId: number;
    businessName?: string;
    imageUrl?: string;
  };
}

export default function CampaignDetailHeader({ campaign }: CampaignDetailProps) {
  const statusColor = {
    active: "bg-green-100 text-green-800 border-green-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
    draft: "bg-gray-100 text-gray-800 border-gray-200"
  };

  const getStatusClass = (status: string) => {
    return statusColor[status.toLowerCase() as keyof typeof statusColor] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl font-bold">{campaign.name}</CardTitle>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4" />
            {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
            <Badge className={`ml-2 ${getStatusClass(campaign.status)}`}>
              {campaign.status}
            </Badge>
          </div>
        </div>
        <SocialMediaShare 
          data={{
            campaignName: campaign.name,
            roi: campaign.roi,
            adSpend: campaign.budget,
            revenue: campaign.revenue,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            businessName: campaign.businessName,
          }}
        />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
            <DollarSign className="h-5 w-5 text-blue-500 mb-1" />
            <span className="text-xs text-gray-600">Ad Spend</span>
            <span className="font-semibold text-lg">{formatCurrency(campaign.budget)}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
            <BarChart4 className="h-5 w-5 text-green-500 mb-1" />
            <span className="text-xs text-gray-600">Revenue</span>
            <span className="font-semibold text-lg">{formatCurrency(campaign.revenue)}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg">
            <LineChart className="h-5 w-5 text-purple-500 mb-1" />
            <span className="text-xs text-gray-600">ROI</span>
            <span className="font-semibold text-lg">{campaign.roi}%</span>
          </div>
        </div>
        {campaign.description && (
          <p className="mt-4 text-sm text-gray-600">{campaign.description}</p>
        )}
      </CardContent>
    </Card>
  );
}