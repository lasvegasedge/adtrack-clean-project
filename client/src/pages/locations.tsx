import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Helmet } from "react-helmet";
import { Building } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import LocationsList from "@/components/locations/LocationsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavigation from "@/components/layout/BottomNavigation";

export default function LocationsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<string>("list");
  
  // Get the user's business
  const { data: business, isLoading: isLoadingBusiness, error: businessError } = useQuery({
    queryKey: [`/api/user/${user?.id}/business`],
    enabled: !!user,
  });

  if (isLoadingBusiness) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (businessError) {
    return (
      <div className="container py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading business data. Please try again.
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Locations | AdTrack</title>
      </Helmet>
      
      <div className="container py-6 pb-20">
        <PageTitle
          title="Locations"
          icon={<Building size={32} />}
          subtitle="Manage your business locations"
        />
        
        <Card className="mt-6">
          <CardContent className="p-6">
            <Tabs defaultValue={tab} onValueChange={setTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="list">Locations</TabsTrigger>
                <TabsTrigger value="analytics">Analytics by Location</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list">
                {business && <LocationsList businessId={business.id} />}
              </TabsContent>
              
              <TabsContent value="analytics">
                <div className="p-8 text-center">
                  <h3 className="text-lg font-medium">Location Analytics</h3>
                  <p className="text-muted-foreground mt-2">
                    View performance metrics across all your business locations.
                  </p>
                  
                  <div className="mt-4 p-8 bg-muted rounded-md">
                    <p>Location-specific analytics will be available soon.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />
    </>
  );
}