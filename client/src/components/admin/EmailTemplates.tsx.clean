import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw } from "lucide-react";

export default function EmailTemplates() {
  const [activeTab, setActiveTab] = useState("passwordReset");
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          <CardTitle>Email Templates</CardTitle>
        </div>
        <CardDescription>
          Customize system email templates for various notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="passwordReset" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="passwordReset">Password Reset</TabsTrigger>
            <TabsTrigger value="roiAlert">ROI Alert</TabsTrigger>
            <TabsTrigger value="campaignReminder">Campaign Reminder</TabsTrigger>
            <TabsTrigger value="weeklyReport">Weekly Report</TabsTrigger>
          </TabsList>
          
          <div className="my-4">
            <p className="text-sm text-muted-foreground">
              {activeTab === "passwordReset" && "Sent to users when they request a password reset."}
              {activeTab === "roiAlert" && "Notification sent when a campaign ROI changes significantly."}
              {activeTab === "campaignReminder" && "Reminds users to update their campaign performance data."}
              {activeTab === "weeklyReport" && "Weekly summary of business performance and analytics."}
            </p>
          </div>
          
          <div className="my-4 p-4 border rounded-md bg-muted">
            <h3 className="text-md font-medium mb-2">Available Template Variables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {activeTab === "passwordReset" && (
                <>
                  <div className="bg-card p-2 rounded text-sm">
                    <code>$&#123;resetLink&#125;</code>: Password reset URL
                  </div>
                  <div className="bg-card p-2 rounded text-sm">
                    <code>$&#123;username&#125;</code>: User's email address
                  </div>
                </>
              )}
              
              {activeTab === "roiAlert" && (
                <>
                  <div className="bg-card p-2 rounded text-sm">
                    <code>$&#123;campaignName&#125;</code>: Name of the campaign
                  </div>
                  <div className="bg-card p-2 rounded text-sm">
                    <code>$&#123;roi&#125;</code>: ROI percentage value
                  </div>
                </>
              )}
              
              {activeTab === "campaignReminder" && (
                <>
                  <div className="bg-card p-2 rounded text-sm">
                    <code>$&#123;campaignName&#125;</code>: Name of the campaign
                  </div>
                  <div className="bg-card p-2 rounded text-sm">
                    <code>$&#123;daysInactive&#125;</code>: Number of days inactive
                  </div>
                </>
              )}
              
              {activeTab === "weeklyReport" && (
                <>
                  <div className="bg-card p-2 rounded text-sm">
                    <code>$&#123;businessName&#125;</code>: Business name
                  </div>
                  <div className="bg-card p-2 rounded text-sm">
                    <code>$&#123;totalCampaigns&#125;</code>: Number of active campaigns
                  </div>
                  <div className="bg-card p-2 rounded text-sm">
                    <code>$&#123;averageRoi&#125;</code>: Average ROI percentage
                  </div>
                </>
              )}
            </div>
          </div>
          
          <p className="my-4 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800">
            Email templates are currently in development. You'll soon be able to customize and test email templates from this interface.
          </p>
          
          <div className="flex justify-end mt-4">
            <Button disabled>
              <RefreshCw className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}