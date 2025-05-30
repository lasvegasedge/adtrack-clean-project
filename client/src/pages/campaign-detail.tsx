import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import CampaignDetail from "@/components/campaigns/CampaignDetail";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  
  // Handle invalid ID
  if (!id || isNaN(parseInt(id))) {
    setLocation("/campaigns");
    return null;
  }

  const campaignId = parseInt(id);

  return (
    <AppLayout title="Campaign Details" showBackButton={true}>
      <CampaignDetail campaignId={campaignId} />
    </AppLayout>
  );
}
