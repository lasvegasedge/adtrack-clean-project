import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Copy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface CloneCampaignButtonProps {
  campaignId: number;
  disabled?: boolean;
}

export default function CloneCampaignButton({ campaignId, disabled }: CloneCampaignButtonProps) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const businessId = user?.businessId;

  // Fetch campaign data
  const { data: campaign, isLoading } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}`],
  });

  // Clone campaign mutation
  const cloneMutation = useMutation({
    mutationFn: async () => {
      if (!campaign) throw new Error("Campaign data not available");
      
      // Prepare data for clone
      const formData = new FormData();
      const cloneData = {
        businessId,
        name: `${campaign.name} (Copy)`,
        description: campaign.description,
        adMethodId: campaign.adMethodId,
        amountSpent: campaign.amountSpent,
        startDate: new Date(),
        isActive: true,
        fileUrl: campaign.fileUrl,
      };
      
      formData.append("data", JSON.stringify(cloneData));
      
      // Submit clone request
      return await apiRequest("POST", "/api/campaigns", formData);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [`/api/business/${businessId}/campaigns`] });
      queryClient.invalidateQueries({ queryKey: [`/api/business/${businessId}/campaigns/roi`] });
      queryClient.invalidateQueries({ queryKey: [`/api/business/${businessId}/stats`] });
      
      toast({
        title: "Campaign cloned",
        description: "A copy of the campaign has been created successfully.",
      });
      
      // Close dialog
      setOpen(false);
      
      // Get the new campaign ID from the response and navigate to edit it
      response.json().then(data => {
        setLocation(`/campaigns/edit/${data.id}`);
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to clone campaign: ${error.message}`,
        variant: "destructive",
      });
      setOpen(false);
    }
  });

  const handleClone = () => {
    cloneMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          disabled={disabled || isLoading}
        >
          <Copy className="h-4 w-4" />
          <span>Clone</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Campaign</DialogTitle>
          <DialogDescription>
            This will create a copy of "{campaign?.name}" with today's date as the start date and it will be marked as active.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex items-center justify-between mt-4">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={cloneMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleClone}
            disabled={cloneMutation.isPending}
          >
            {cloneMutation.isPending ? "Cloning..." : "Clone Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}