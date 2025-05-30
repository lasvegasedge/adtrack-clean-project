import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash, Plus, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LocationForm } from "@/components/locations/LocationForm";
import { useToast } from "@/hooks/use-toast";

interface LocationsListProps {
  businessId: number;
}

export default function LocationsList({ businessId }: LocationsListProps) {
  const [isAddLocation, setIsAddLocation] = useState(false);
  const [editLocation, setEditLocation] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch locations for the business
  const { data: locations, isLoading, isError } = useQuery({
    queryKey: [`/api/locations/business/${businessId}`],
    queryFn: async () => {
      const res = await fetch(`/api/locations/business/${businessId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch locations');
      }
      return res.json();
    },
    enabled: !!businessId,
  });
  
  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (locationId: number) => {
      const res = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete location');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/locations/business/${businessId}`] });
      toast({
        title: "Location deleted",
        description: "The location has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete location",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Set primary location mutation
  const setPrimaryLocationMutation = useMutation({
    mutationFn: async (locationId: number) => {
      const res = await fetch(`/api/locations/${locationId}/set-primary`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to set primary location');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/locations/business/${businessId}`] });
      toast({
        title: "Primary location set",
        description: "The primary location has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to set primary location",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAddLocation = () => {
    setIsAddLocation(true);
    setEditLocation(null);
  };
  
  const handleEditLocation = (location: any) => {
    setEditLocation(location);
    setIsAddLocation(false);
  };
  
  const handleCloseDialog = () => {
    setIsAddLocation(false);
    setEditLocation(null);
  };
  
  const handleDeleteLocation = (locationId: number) => {
    if (confirm('Are you sure you want to delete this location?')) {
      deleteLocationMutation.mutate(locationId);
    }
  };
  
  const handleSetPrimary = (locationId: number) => {
    setPrimaryLocationMutation.mutate(locationId);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error loading locations.</strong>
          <p className="text-sm mt-1">Please refresh the page to try again. If the problem persists, contact support.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Locations</h2>
        <Button onClick={handleAddLocation} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>
      
      {locations?.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Primary</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location: any) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">{location.name}</TableCell>
                <TableCell>{location.address}</TableCell>
                <TableCell>{location.city}</TableCell>
                <TableCell>{location.state}</TableCell>
                <TableCell>
                  {location.isPrimary ? (
                    <div className="flex items-center text-primary">
                      <MapPin className="h-4 w-4 mr-1 fill-primary" />
                      Primary
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSetPrimary(location.id)}
                      disabled={setPrimaryLocationMutation.isPending}
                    >
                      Set Primary
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEditLocation(location)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDeleteLocation(location.id)}
                      disabled={deleteLocationMutation.isPending}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="bg-muted p-8 text-center rounded-md">
          <p>No locations found. Click "Add Location" to create one.</p>
        </div>
      )}
      
      {(isAddLocation || editLocation) && (
        <LocationForm
          businessId={businessId}
          location={editLocation}
          isOpen={isAddLocation || !!editLocation}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
}