import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import CampaignForm from "@/components/campaigns/CampaignForm";

export default function AddCampaign() {
  const [location] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const editId = params.get('edit');
  const duplicateId = params.get('duplicate');
  const [campaignId, setCampaignId] = useState<number | undefined>(undefined);
  const [pageTitle, setPageTitle] = useState("Add New Campaign");
  const [showBackButton, setShowBackButton] = useState(true);

  useEffect(() => {
    if (editId) {
      setCampaignId(parseInt(editId));
      setPageTitle("Edit Campaign");
    } else if (duplicateId) {
      // For duplication, we don't set the campaignId
      // We'll load the campaign data but create a new record
      setPageTitle("Duplicate Campaign");
    } else {
      setCampaignId(undefined);
      setPageTitle("Add New Campaign");
    }
  }, [editId, duplicateId]);

  // If duplicating, fetch the source campaign data
  const { data: duplicateCampaign } = useQuery({
    queryKey: [`/api/campaigns/${duplicateId}`],
    enabled: !!duplicateId,
  });

  // Handle navigation back to previous page
  const handleBackClick = () => {
    if (location.includes('/campaign/')) {
      return -1; // Go back to campaign detail
    } else {
      return '/campaigns'; // Go to campaigns list
    }
  };

  return (
    <AppLayout 
      title={pageTitle} 
      showBackButton={showBackButton}
      onBackClick={handleBackClick}
    >
      <CampaignForm campaignId={campaignId} />
    </AppLayout>
  );
}
